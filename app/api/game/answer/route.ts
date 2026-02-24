import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, calculateScore, getLeaderboard } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, playerId, optionIndex }: { pin: string; playerId: string; optionIndex: number } = await req.json();

    const room = await getRoom(pin);
    if (!room || room.status !== 'question') {
        return NextResponse.json({ error: 'Savol aktiv emas' }, { status: 400 });
    }

    if (room.answeredPlayerIds.includes(playerId)) {
        return NextResponse.json({ error: 'Allaqachon javob bergansiz' }, { status: 400 });
    }

    const question = room.questions[room.currentQuestionIndex];
    const isCorrect = question.correctOptions.includes(optionIndex);
    const elapsed = Date.now() - (room.questionStartTime || Date.now());
    const totalMs = question.timeLimit * 1000;
    const remaining = Math.max(0, totalMs - elapsed);

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
        // Update streak
        if (isCorrect) {
            player.streak += 1;
            if (player.streak > player.longestStreak) player.longestStreak = player.streak;
        } else {
            player.streak = 0;
        }

        const points = calculateScore(isCorrect, remaining, totalMs, player.streak);
        player.score += points;
        player.totalAnswers += 1;
        player.totalResponseMs += elapsed;
        if (elapsed < player.fastestAnswerMs) player.fastestAnswerMs = elapsed;
        if (isCorrect) player.correctCount += 1;

        room.answeredPlayerIds.push(playerId);
        await saveRoomData(room);

        // Individual result to player channel
        await pusherServer.trigger(`player-${playerId}`, 'answer-result', {
            correct: isCorrect,
            points,
            totalScore: player.score,
            streak: player.streak,
            correctOptions: question.correctOptions,
            explanation: question.explanation || null,
            options: question.options,
            selectedOption: optionIndex,
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
            leaderboard,
            isLastQuestion,
        });
    }

    return NextResponse.json({ ok: true });
}
