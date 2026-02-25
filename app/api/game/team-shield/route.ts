import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, teamId }: { pin: string; teamId: string } = await req.json();

    const room = await getRoom(pin);
    if (!room || !room.teamMode || !room.teams) {
        return NextResponse.json({ error: 'Jamoa rejimi aktiv emas' }, { status: 400 });
    }

    const team = room.teams.find(t => t.id === teamId);
    if (!team) return NextResponse.json({ error: 'Jamoa topilmadi' }, { status: 404 });
    if (team.shieldUsed) return NextResponse.json({ error: "Qalqon allaqachon ishlatilgan" }, { status: 400 });

    team.shieldActiveUntil = Date.now() + 10_000; // 10 seconds
    team.shieldUsed = true;
    await saveRoomData(room);

    await pusherServer.trigger(`game-${pin}`, 'team-update', {
        teams: room.teams,
        shieldActivated: { teamId, until: team.shieldActiveUntil },
    });

    return NextResponse.json({ ok: true });
}
