import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/gameState';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (!pin) return NextResponse.json({ error: 'PIN kerak' }, { status: 400 });

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 404 });

    const currentQ = room.questions[room.currentQuestionIndex];

    return NextResponse.json({
        status: room.status,
        players: room.players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            avatar: p.avatar,
            streak: p.streak
        })),
        currentQuestion: currentQ
            ? {
                questionIndex: room.currentQuestionIndex,
                total: room.questions.length,
                text: currentQ.text,
                options: currentQ.options,
                timeLimit: currentQ.timeLimit,
                imageUrl: currentQ.imageUrl,
                questionStartTime: room.questionStartTime,
            }
            : null,
    });
}
