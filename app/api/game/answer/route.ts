import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, calculateScore, getLeaderboard } from '@/lib/gameState';

interface AnswerBody {
    pin: string;
    playerId: string;
    optionIndex?: number;       // MCQ / TrueFalse
    submittedOrder?: number[];  // Order / Sorting question
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

    // ── Sorting question scoring ──────────────────────────────────────────
    const isOrderQuestion = question.type === 'order';
    let isCorrect = false;
    let orderScore = 0;
    let correctCount = 0;
    let streakFire = false;

    if (isOrderQuestion && body.submittedOrder) {
        const submitted = body.submittedOrder;
        const correct = question.correctOptions; // [0,1,2,...] expected order
        correctCount = submitted.reduce((acc, val, idx) => acc + (val === correct[idx] ? 1 : 0), 0);
        const pct = correctCount / correct.length;
        isCorrect = pct === 1;
        // Score: up to 1000 for accuracy + up to 200 time bonus
        const timeBonus = isCorrect ? Math.round((remaining / totalMs) * 200) : 0;
        orderScore = Math.round(pct * 1000) + timeBonus;
        // Streak fire: fully correct in < 10 seconds
        streakFire = isCorrect && elapsed < 10000;
    }

    // ── MCQ / TrueFalse scoring ───────────────────────────────────────────
    const optionIndex = body.optionIndex ?? -1;
    if (!isOrderQuestion) {
        isCorrect = question.correctOptions.includes(optionIndex);
    }

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
        if (isCorrect) {
            player.streak += 1;
            if (player.streak > player.longestStreak) player.longestStreak = player.streak;
        } else {
            player.streak = 0;
        }

        const points = isOrderQuestion
            ? orderScore
            : calculateScore(isCorrect, remaining, totalMs, player.streak);

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
            selectedOption: isOrderQuestion ? null : optionIndex,
            submittedOrder: isOrderQuestion ? body.submittedOrder : null,
            correctCount: isOrderQuestion ? correctCount : null,
            questionType: question.type || 'multiple',
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
            questionType: question.type || 'multiple',
            leaderboard,
            isLastQuestion,
        });
    }

    return NextResponse.json({ ok: true });
}
