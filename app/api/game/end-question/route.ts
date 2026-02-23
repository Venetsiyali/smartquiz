import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, getLeaderboard } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: 'O\'yin topilmadi' }, { status: 400 });
    if (room.status !== 'question') {
        // Already ended, just return leaderboard
        const leaderboard = getLeaderboard(room.players);
        const isLastQuestion = room.currentQuestionIndex >= room.questions.length - 1;
        const question = room.questions[room.currentQuestionIndex];
        await pusherServer.trigger(`game-${pin}`, 'question-end', {
            correctOptions: question.correctOptions,
            leaderboard,
            isLastQuestion,
        });
        return NextResponse.json({ ok: true });
    }

    room.status = 'leaderboard';
    await saveRoomData(room);

    const question = room.questions[room.currentQuestionIndex];
    const leaderboard = getLeaderboard(room.players);
    const isLastQuestion = room.currentQuestionIndex >= room.questions.length - 1;

    await pusherServer.trigger(`game-${pin}`, 'question-end', {
        correctOptions: question.correctOptions,
        leaderboard,
        isLastQuestion,
    });

    return NextResponse.json({ ok: true });
}
