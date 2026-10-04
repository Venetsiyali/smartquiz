import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { withRoom } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, teamId }: { pin: string; teamId: string } = await req.json();

    let result;
    try {
        result = await withRoom(pin, room => {
            if (!room || !room.teamMode || !room.teams) return { error: 'Jamoa rejimi aktiv emas', status: 400 } as const;

            const team = room.teams.find(t => t.id === teamId);
            if (!team) return { error: 'Jamoa topilmadi', status: 404 } as const;
            if (team.shieldUsed) return { error: 'Qalqon allaqachon ishlatilgan', status: 400 } as const;

            team.shieldActiveUntil = Date.now() + 10_000; // 10 seconds
            team.shieldUsed = true;
            return { teams: room.teams, until: team.shieldActiveUntil };
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await pusherServer.trigger(`game-${pin}`, 'team-update', {
        teams: result.teams,
        shieldActivated: { teamId, until: result.until },
    });

    return NextResponse.json({ ok: true });
}
