import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    const room = await getRoom(pin);
    if (!room || room.status !== 'lobby') {
        return NextResponse.json({ error: 'O\'yin topilmadi' }, { status: 400 });
    }

    room.status = 'question';
    room.currentQuestionIndex = 0;
    room.questionStartTime = Date.now();
    room.answeredPlayerIds = [];
    await saveRoomData(room);

    const question = room.questions[0];

    await pusherServer.trigger(`game-${pin}`, 'question-start', {
        questionIndex: 0,
        total: room.questions.length,
        text: question.text,
        options: question.options,
        timeLimit: question.timeLimit,
        imageUrl: question.imageUrl,
    });

    return NextResponse.json({ ok: true });
}
