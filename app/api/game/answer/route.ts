import { NextResponse } from 'next/server';
import { triggerAll, type PusherEvent } from '@/lib/pusher';
import { withRoom, type GameRoom, calculateScore, calculateBlitzScore, calculateAnagramScore, getLeaderboard, recalcTeamScores, getTeamLeaderboard } from '@/lib/gameState';
import { recordAnswerStats } from '@/lib/questionBank/stats';

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
    submittedOrder?: number[];   // Order / Sorting — o'quvchiga ko'rsatilgan tartibdagi pozitsiyalar
    matchResult?: MatchResultBody; // Match / Terminlar jangi
    anagramAnswer?: string;      // Anagram: submitted word
    anagramHintsUsed?: number;   // Anagram: how many hints used
    anagramCompletedMs?: number; // Anagram: how long it took to complete
}

interface Outcome {
    status: number;
    body: Record<string, unknown>;
    events: PusherEvent[];
    stats?: { text: string; answered: number; correct: number };
}

export async function POST(req: Request) {
    const body: AnswerBody = await req.json();
    const { pin, playerId } = body;

    let outcome: Outcome;
    try {
        outcome = await withRoom(pin, room => processAnswer(room, body));
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    // Pusher qulfdan tashqarida — qulf qisqa bo'lsin, boshqa o'quvchilar kutib qolmasin
    if (outcome.events.length > 0) await triggerAll(outcome.events);
    if (outcome.stats) await recordAnswerStats(outcome.stats.text, outcome.stats.answered, outcome.stats.correct);

    return NextResponse.json(outcome.body, { status: outcome.status });

    async function processAnswer(room: GameRoom | null, b: AnswerBody): Promise<Outcome> {
        if (!room || room.status !== 'question') {
            return { status: 400, body: { error: 'Savol aktiv emas' }, events: [] };
        }
        if (room.answeredPlayerIds.includes(playerId)) {
            return { status: 400, body: { error: 'Allaqachon javob bergansiz' }, events: [] };
        }

        const question = room.questions[room.currentQuestionIndex];
        const elapsed = Date.now() - (room.questionStartTime || Date.now());
        const totalMs = question.timeLimit * 1000;
        const remaining = Math.max(0, totalMs - elapsed);
        const qType = question.type || 'multiple';
        const player = room.players.find(p => p.id === playerId);
        const events: PusherEvent[] = [];

        let points = 0;
        let isCorrect = false;
        let streakFire = false;
        let submittedOriginal: number[] | null = null;
        let correctWord = '';

        if (qType === 'anagram' && b.anagramAnswer !== undefined) {
            correctWord = (question.options[0] || '').toUpperCase();
            isCorrect = b.anagramAnswer.toUpperCase() === correctWord;
            const hintsUsed = b.anagramHintsUsed ?? 0;
            const completedMs = b.anagramCompletedMs ?? elapsed;
            points = calculateAnagramScore(isCorrect, correctWord.length, completedMs, totalMs, hintsUsed);
            streakFire = isCorrect && hintsUsed === 0 && completedMs < 15000;
        } else if (qType === 'match' && b.matchResult) {
            isCorrect = b.matchResult.cleanSweep;
            points = b.matchResult.points; // already calculated on client
            streakFire = b.matchResult.cleanSweep && b.matchResult.completedMs < 20000;
        } else if (qType === 'order' && b.submittedOrder) {
            // O'quvchi ko'rgan (aralashtirilgan) pozitsiyalarni asl indekslarga o'giramiz
            submittedOriginal = b.submittedOrder.map(i => room.currentOrder?.[i] ?? i);
            const correct = question.correctOptions;
            const correctCount = submittedOriginal.reduce((acc, val, idx) => acc + (val === correct[idx] ? 1 : 0), 0);
            const pct = correctCount / correct.length;
            isCorrect = pct === 1;
            const timeBonus = isCorrect ? Math.round((remaining / totalMs) * 200) : 0;
            points = Math.round(pct * 1000) + timeBonus;
            streakFire = isCorrect && elapsed < 10000;
        } else {
            isCorrect = question.correctOptions.includes(b.optionIndex ?? -1);
        }

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
            } else if (qType === 'multiple' || qType === 'truefalse') {
                points = calculateScore(isCorrect, remaining, totalMs, player.streak);
            }

            player.score += points;
            player.totalAnswers += 1;
            player.totalResponseMs += elapsed;
            if (!(player.fastestAnswerMs > 0) || elapsed < player.fastestAnswerMs) player.fastestAnswerMs = elapsed;
            if (isCorrect) player.correctCount += 1;
        }

        if (room.questionStats?.index !== room.currentQuestionIndex) {
            room.questionStats = { index: room.currentQuestionIndex, correct: 0 };
        }
        if (isCorrect) room.questionStats.correct += 1;
        room.answeredPlayerIds.push(playerId);

        // O'quvchining o'z natijasi — eng birinchi yuboriladi
        if (player) {
            events.push({
                channel: `player-${playerId}`,
                name: 'answer-result',
                data: qType === 'anagram'
                    ? { correct: isCorrect, points, totalScore: player.score, streak: player.streak, streakFire, correctWord, questionType: 'anagram' }
                    : {
                        correct: isCorrect,
                        points,
                        totalScore: player.score,
                        streak: player.streak,
                        streakFire,
                        correctOptions: question.correctOptions,
                        explanation: question.explanation || null,
                        options: question.options,
                        optionImages: question.optionImages || null,
                        selectedOption: qType === 'multiple' || qType === 'truefalse' ? (b.optionIndex ?? -1) : null,
                        submittedOrder: submittedOriginal,
                        shownOrder: qType === 'order' ? (room.currentOrder ?? null) : null,
                        questionType: qType,
                        matchResult: qType === 'match' ? b.matchResult : null,
                    },
            });
        }

        // Jamoa rejimi
        if (player && qType !== 'anagram' && room.teamMode && room.teams) {
            const team = room.teams.find(t => t.id === player.teamId);
            if (team) {
                if (!team.answeredTotal.includes(playerId)) team.answeredTotal.push(playerId);
                if (isCorrect && !team.answeredCorrectly.includes(playerId)) team.answeredCorrectly.push(playerId);
                if (!isCorrect && !(team.shieldActiveUntil > Date.now())) {
                    team.health = Math.max(0, team.health - 10);
                }
                const teamMembers = room.players.filter(p => p.teamId === team.id);
                const allCorrect = teamMembers.every(p => team.answeredCorrectly.includes(p.id));
                const allAnswered = teamMembers.every(p => team.answeredTotal.includes(p.id));
                const combo = allAnswered && allCorrect && teamMembers.length > 0;
                if (combo) {
                    team.comboCount += 1;
                    teamMembers.forEach(p => { p.score += 100; });
                }
                recalcTeamScores(room);
                events.push({
                    channel: `game-${pin}`,
                    name: 'team-update',
                    data: {
                        teams: getTeamLeaderboard(room.teams),
                        triggeredBy: { playerId, teamId: team.id, correct: isCorrect },
                        combo: combo ? { teamId: team.id, bonus: 100 } : null,
                    },
                });
            }
        }

        if (player && qType !== 'anagram') {
            events.push({
                // Faqat o'qituvchi ekraniga — hammaga yuborilsa har javob N ta Pusher xabari sarflardi
                channel: `host-${pin}`,
                name: 'player-answered',
                data: { playerId, isCorrect, currentCorrectCount: player.correctCount, score: player.score },
            });
        }

        let stats: Outcome['stats'];
        if (qType === 'blitz') {
            // Blitz: savolni taymer yakunlaydi — faqat poyga paneli yangilanadi
            events.push({
                channel: `game-${pin}`,
                name: 'blitz-answer-update',
                data: { leaderboard: getLeaderboard(room.players), answeredCount: room.answeredPlayerIds.length, totalPlayers: room.players.length },
            });
        } else if (room.answeredPlayerIds.length >= room.players.length && room.players.length > 0) {
            // Hamma javob berdi — savolni yakunlaymiz
            room.status = 'leaderboard';
            if (qType === 'multiple') {
                stats = { text: question.text, answered: room.answeredPlayerIds.length, correct: room.questionStats.correct };
            }
            events.push({
                channel: `game-${pin}`,
                name: 'question-end',
                data: {
                    correctOptions: question.correctOptions,
                    explanation: question.explanation || null,
                    options: qType === 'anagram' ? [correctWord] : question.options,
                    optionImages: question.optionImages || null,
                    questionType: qType,
                    leaderboard: getLeaderboard(room.players),
                    isLastQuestion: room.currentQuestionIndex >= room.questions.length - 1,
                },
            });
        }

        return { status: 200, body: { ok: true }, events, stats };
    }
}
