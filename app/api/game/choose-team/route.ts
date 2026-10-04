import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { withRoom } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, playerId, teamId }: {
        pin: string; playerId: string; teamId: string;
    } = await req.json();

    // Lobby'da ko'p o'quvchi bir vaqtda jamoa tanlaydi — tanlovlar yo'qolmasligi uchun qulf ichida
    let result;
    try {
        result = await withRoom(pin, room => {
            if (!room) return { error: "O'yin topilmadi", status: 404 } as const;
            if (room.status !== 'lobby') return { error: "O'yin allaqachon boshlangan", status: 400 } as const;
            if (!room.teamMode || !room.teams || room.teams.length === 0) return { error: 'Jamoaviy rejim yoqilmagan', status: 400 } as const;

            const team = room.teams.find(t => t.id === teamId);
            if (!team) return { error: 'Jamoa topilmadi', status: 400 } as const;
            const player = room.players.find(p => p.id === playerId);
            if (!player) return { error: "O'yinchi topilmadi", status: 404 } as const;

            player.teamId = teamId;
            return {
                team,
                playerTeams: room.players.map(p => ({ id: p.id, teamId: p.teamId })),
            };
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

    await pusherServer.trigger(`game-${pin}`, 'team-updated', { playerTeams: result.playerTeams });

    return NextResponse.json({
        ok: true,
        teamId: result.team.id,
        teamName: result.team.name,
        teamColor: result.team.color,
        teamEmoji: result.team.emoji,
    });
}
