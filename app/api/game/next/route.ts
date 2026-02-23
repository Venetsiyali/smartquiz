import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, getLeaderboard } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: 'O\'yin topilmadi' }, { status: 400 });

    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
        // Game over
        room.status = 'ended';
        await saveRoomData(room);

        const leaderboard = getLeaderboard(room.players);
        await pusherServer.trigger(`game-${pin}`, 'game-end', { leaderboard });
        return NextResponse.json({ ok: true, ended: true });
    }

    room.status = 'question';
    room.questionStartTime = Date.now();
    room.answeredPlayerIds = [];
    await saveRoomData(room);

    const question = room.questions[room.currentQuestionIndex];

    await pusherServer.trigger(`game-${pin}`, 'question-start', {
        questionIndex: room.currentQuestionIndex,
        total: room.questions.length,
        text: question.text,
        options: question.options,
        timeLimit: question.timeLimit,
        imageUrl: question.imageUrl,
    });

    return NextResponse.json({ ok: true });
}
