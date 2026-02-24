import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, calculateScore, getLeaderboard } from '@/lib/gameState';

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
    optionIndex?: number;        // MCQ / TrueFalse
    submittedOrder?: number[];   // Order / Sorting
    matchResult?: MatchResultBody; // Match / Terminlar jangi
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

    /* ── MCQ / TrueFalse Scoring ────────────────────────────────────── */
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

        if (qType !== 'match' && qType !== 'order') {
            points = calculateScore(isCorrect, remaining, totalMs, player.streak);
        }

        player.score += points;
        player.totalAnswers += 1;
        player.totalResponseMs += elapsed;
        if (elapsed < player.fastestAnswerMs) player.fastestAnswerMs = elapsed;
        if (isCorrect) player.correctCount += 1;

        room.answeredPlayerIds.push(playerId);
        await saveRoomData(room);

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

    // Auto-end if all players answered
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
