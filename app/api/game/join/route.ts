import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, playerId, nickname, avatar }: {
        pin: string; playerId: string; nickname: string; avatar: string;
    } = await req.json();

    const room = await getRoom(pin);
    if (!room || room.status !== 'lobby') {
        return NextResponse.json({ error: "O'yin topilmadi yoki allaqachon boshlangan" }, { status: 400 });
    }

    if (room.players.some((p) => p.nickname === nickname)) {
        return NextResponse.json({ error: 'Bu nikneym allaqachon ishlatilgan' }, { status: 400 });
    }

    room.players.push({
        id: playerId,
        nickname,
        avatar: avatar || '🤖',
        score: 0,
        streak: 0,
        longestStreak: 0,
        correctCount: 0,
        totalAnswers: 0,
        totalResponseMs: 0,
        fastestAnswerMs: Infinity,
    });
    await saveRoomData(room);

    await pusherServer.trigger(`game-${pin}`, 'player-joined', {
        players: room.players.map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar, streak: p.streak })),
    });

    return NextResponse.json({ ok: true, pin });
}
