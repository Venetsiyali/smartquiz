import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, playerId, nickname }: { pin: string; playerId: string; nickname: string } = await req.json();

    const room = await getRoom(pin);
    if (!room || room.status !== 'lobby') {
        return NextResponse.json({ error: 'O\'yin topilmadi yoki allaqachon boshlangan' }, { status: 400 });
    }

    // Check duplicate nickname
    if (room.players.some((p) => p.nickname === nickname)) {
        return NextResponse.json({ error: 'Bu nikneym allaqachon ishlatilgan' }, { status: 400 });
    }

    room.players.push({ id: playerId, nickname, score: 0 });
    await saveRoomData(room);

    // Notify teacher
    await pusherServer.trigger(`game-${pin}`, 'player-joined', {
        players: room.players.map((p) => ({ id: p.id, nickname: p.nickname })),
    });

    return NextResponse.json({ ok: true, pin });
}
