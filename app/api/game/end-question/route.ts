import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, getLeaderboard } from '@/lib/gameState';
import { recordAnswerStats } from '@/lib/questionBank/stats';

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });

    const question = room.questions[room.currentQuestionIndex];
    const leaderboard = getLeaderboard(room.players);
    const isLastQuestion = room.currentQuestionIndex >= room.questions.length - 1;

    if (room.status !== 'question') {
        // Already ended — just re-broadcast
        room.status = 'leaderboard';
        await saveRoomData(room);
    } else {
        room.status = 'leaderboard';
        await saveRoomData(room);

        // Ombordagi ko'p tanlovli savol bo'lsa — natijani statistikaga yozamiz (faqat birinchi yakunlashda)
        if ((question.type ?? 'multiple') === 'multiple') {
            const correct = room.questionStats?.index === room.currentQuestionIndex ? room.questionStats.correct : 0;
            await recordAnswerStats(question.text, room.answeredPlayerIds.length, correct);
        }
    }

    await pusherServer.trigger(`game-${pin}`, 'question-end', {
        correctOptions: question.correctOptions,
        explanation: question.explanation || null,
        options: question.options,
        leaderboard,
        isLastQuestion,
    });

    return NextResponse.json({ ok: true });
}
