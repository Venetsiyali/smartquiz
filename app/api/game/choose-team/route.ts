import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, playerId, teamId }: {
        pin: string; playerId: string; teamId: string;
    } = await req.json();

    const room = await getRoom(pin);
    if (!room) {
        return NextResponse.json({ error: "O'yin topilmadi" }, { status: 404 });
    }
    if (room.status !== 'lobby') {
        return NextResponse.json({ error: "O'yin allaqachon boshlangan" }, { status: 400 });
    }
    if (!room.teamMode || !room.teams || room.teams.length === 0) {
        return NextResponse.json({ error: "Jamoaviy rejim yoqilmagan" }, { status: 400 });
    }

    const team = room.teams.find(t => t.id === teamId);
    if (!team) {
        return NextResponse.json({ error: "Jamoa topilmadi" }, { status: 400 });
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
        return NextResponse.json({ error: "O'yinchi topilmadi" }, { status: 404 });
    }

    player.teamId = teamId;
    await saveRoomData(room);

    await pusherServer.trigger(`game-${pin}`, 'team-updated', {
        playerTeams: room.players.map(p => ({ id: p.id, teamId: p.teamId })),
    });

    return NextResponse.json({
        ok: true,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        teamEmoji: team.emoji,
    });
}
