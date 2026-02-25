import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, calculateScore, calculateBlitzScore, calculateAnagramScore, getLeaderboard, recalcTeamScores, getTeamLeaderboard } from '@/lib/gameState';




interface MatchResultBody {
    totalPairs: number;
    completedMs: number;
    mistakes: number;
    cleanSweep: boolean;
    points: number;
}

interface AnswerBody {
    pin: string;
    playerId: string;
    optionIndex?: number;        // MCQ / TrueFalse / Blitz
    submittedOrder?: number[];   // Order / Sorting
    matchResult?: MatchResultBody; // Match / Terminlar jangi
    anagramAnswer?: string;      // Anagram: submitted word
    anagramHintsUsed?: number;   // Anagram: how many hints used
    anagramCompletedMs?: number; // Anagram: how long it took to complete
}


export async function POST(req: Request) {
    const body: AnswerBody = await req.json();
    const { pin, playerId } = body;

    const room = await getRoom(pin);
    if (!room || room.status !== 'question') {
        return NextResponse.json({ error: 'Savol aktiv emas' }, { status: 400 });
    }

    if (room.answeredPlayerIds.includes(playerId)) {
        return NextResponse.json({ error: 'Allaqachon javob bergansiz' }, { status: 400 });
    }

    const question = room.questions[room.currentQuestionIndex];
    const elapsed = Date.now() - (room.questionStartTime || Date.now());
    const totalMs = question.timeLimit * 1000;
    const remaining = Math.max(0, totalMs - elapsed);

    const qType = question.type || 'multiple';
    let points = 0;
    let isCorrect = false;
    let streakFire = false;

    /* ── Anagram Scoring ─────────────────────────────────────────────── */
    if (qType === 'anagram' && body.anagramAnswer !== undefined) {
        const correctWord = (question.options[0] || '').toUpperCase();
        isCorrect = body.anagramAnswer.toUpperCase() === correctWord;
        const hintsUsed = body.anagramHintsUsed ?? 0;
        const completedMs = body.anagramCompletedMs ?? elapsed;
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            if (isCorrect) { player.streak += 1; if (player.streak > player.longestStreak) player.longestStreak = player.streak; }
            else { player.streak = 0; }
            points = calculateAnagramScore(isCorrect, correctWord.length, completedMs, totalMs, hintsUsed);
            streakFire = isCorrect && hintsUsed === 0 && completedMs < 15000;
            player.score += points;
            player.totalAnswers += 1;
            player.totalResponseMs += elapsed;
            if (elapsed < player.fastestAnswerMs) player.fastestAnswerMs = elapsed;
            if (isCorrect) player.correctCount += 1;
            room.answeredPlayerIds.push(playerId);
            await saveRoomData(room);
            await pusherServer.trigger(`player-${playerId}`, 'answer-result', {
                correct: isCorrect, points, totalScore: player.score,
                streak: player.streak, streakFire,
                correctWord,          // reveal the word after submission
                questionType: 'anagram',
            });
        } else {
            room.answeredPlayerIds.push(playerId);
            await saveRoomData(room);
        }
        // Auto-end if all answered
        if (room.answeredPlayerIds.length >= room.players.length && room.players.length > 0) {
            room.status = 'leaderboard';
            await saveRoomData(room);
            const leaderboard = getLeaderboard(room.players);
            const isLastQuestion = room.currentQuestionIndex >= room.questions.length - 1;
            await pusherServer.trigger(`game-${pin}`, 'question-end', {
                correctOptions: question.correctOptions,
                explanation: question.explanation || null,
                options: [correctWord],
                leaderboard, isLastQuestion, questionType: 'anagram',
            });
        }
        return NextResponse.json({ ok: true });
    }

    /* ── Match Scoring ─────────────────────────────────────────────── */
    if (qType === 'match' && body.matchResult) {
        const mr = body.matchResult;
        isCorrect = mr.cleanSweep;
        points = mr.points; // already calculated on client
        streakFire = mr.cleanSweep && mr.completedMs < 20000;
    }

    /* ── Order Scoring ─────────────────────────────────────────────── */
    else if (qType === 'order' && body.submittedOrder) {
        const submitted = body.submittedOrder;
        const correct = question.correctOptions;
        const correctCount = submitted.reduce((acc, val, idx) => acc + (val === correct[idx] ? 1 : 0), 0);
        const pct = correctCount / correct.length;
        isCorrect = pct === 1;
        const timeBonus = isCorrect ? Math.round((remaining / totalMs) * 200) : 0;
        points = Math.round(pct * 1000) + timeBonus;
        streakFire = isCorrect && elapsed < 10000;
    }

    /* ── MCQ / TrueFalse / Blitz Scoring ────────────────────────────── */
    else {
        const optionIndex = body.optionIndex ?? -1;
        isCorrect = question.correctOptions.includes(optionIndex);
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
        if (isCorrect) {
            player.streak += 1;
            if (player.streak > player.longestStreak) player.longestStreak = player.streak;
        } else {
            player.streak = 0;
        }

        if (qType === 'blitz') {
            points = calculateBlitzScore(isCorrect, player.streak, elapsed, totalMs);
            streakFire = isCorrect && player.streak >= 3;
        } else if (qType !== 'match' && qType !== 'order') {
            points = calculateScore(isCorrect, remaining, totalMs, player.streak);
        }

        player.score += points;
        player.totalAnswers += 1;
        player.totalResponseMs += elapsed;
        if (elapsed < player.fastestAnswerMs) player.fastestAnswerMs = elapsed;
        if (isCorrect) player.correctCount += 1;

        room.answeredPlayerIds.push(playerId);
        await saveRoomData(room);

        // ── Team Mode Updates ──────────────────────────────────────────
        if (room.teamMode && room.teams) {
            const team = room.teams.find(t => t.id === player.teamId);
            if (team) {
                if (!team.answeredTotal.includes(playerId)) team.answeredTotal.push(playerId);
                if (isCorrect && !team.answeredCorrectly.includes(playerId)) team.answeredCorrectly.push(playerId);

                // Health penalty for wrong answer (shield check)
                if (!isCorrect) {
                    const shielded = team.shieldActiveUntil > Date.now();
                    if (!shielded) {
                        team.health = Math.max(0, team.health - 10);
                    }
                }

                // Combo: all team members for this question answered correctly
                const teamMembers = room.players.filter(p => p.teamId === team.id);
                const allCorrect = teamMembers.every(p => team.answeredCorrectly.includes(p.id));
                const allAnswered = teamMembers.every(p => team.answeredTotal.includes(p.id));
                if (allAnswered && allCorrect && teamMembers.length > 0) {
                    team.comboCount += 1;
                    // Give every team member a combo bonus (+100)
                    teamMembers.forEach(p => { p.score += 100; });
                }

                recalcTeamScores(room);
                await saveRoomData(room);

                const combo = allAnswered && allCorrect && teamMembers.length > 0;
                await pusherServer.trigger(`game-${pin}`, 'team-update', {
                    teams: getTeamLeaderboard(room.teams),
                    triggeredBy: { playerId, teamId: team.id, correct: isCorrect },
                    combo: combo ? { teamId: team.id, bonus: 100 } : null,
                });
            }
        }

        await pusherServer.trigger(`player-${playerId}`, 'answer-result', {
            correct: isCorrect,
            points,
            totalScore: player.score,
            streak: player.streak,
            streakFire,
            correctOptions: question.correctOptions,
            explanation: question.explanation || null,
            options: question.options,
            optionImages: question.optionImages || null,
            selectedOption: qType === 'multiple' || qType === 'truefalse' ? (body.optionIndex ?? -1) : null,
            submittedOrder: qType === 'order' ? body.submittedOrder : null,
            questionType: qType,
            matchResult: qType === 'match' ? body.matchResult : null,
        });
    } else {
        room.answeredPlayerIds.push(playerId);
        await saveRoomData(room);
    }

    // For blitz: fire race bar update (no auto question-end — timer drives it)
    if (qType === 'blitz') {
        const liveLeaderboard = getLeaderboard(room.players);
        await pusherServer.trigger(`game-${pin}`, 'blitz-answer-update', {
            leaderboard: liveLeaderboard,
            answeredCount: room.answeredPlayerIds.length,
            totalPlayers: room.players.length,
        });
        return NextResponse.json({ ok: true });
    }

    // Auto-end if all players answered (non-blitz)
    if (room.answeredPlayerIds.length >= room.players.length && room.players.length > 0) {
        room.status = 'leaderboard';
        await saveRoomData(room);
        const leaderboard = getLeaderboard(room.players);
        const isLastQuestion = room.currentQuestionIndex >= room.questions.length - 1;
        await pusherServer.trigger(`game-${pin}`, 'question-end', {
            correctOptions: question.correctOptions,
            explanation: question.explanation || null,
            options: question.options,
            optionImages: question.optionImages || null,
            questionType: qType,
            leaderboard,
            isLastQuestion,
        });
    }

    return NextResponse.json({ ok: true });
}
