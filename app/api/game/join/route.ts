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

    // Team mode: assign to team with fewest members
    let assignedTeamId: string | undefined;
    let assignedTeamName: string | undefined;
    let assignedTeamColor: string | undefined;
    let assignedTeamEmoji: string | undefined;
    if (room.teamMode && room.teams && room.teams.length > 0) {
        const memberCounts = room.teams.map(t => room.players.filter(p => p.teamId === t.id).length);
        const minIdx = memberCounts.indexOf(Math.min(...memberCounts));
        const team = room.teams[minIdx];
        room.players[room.players.length - 1].teamId = team.id;
        assignedTeamId = team.id;
        assignedTeamName = team.name;
        assignedTeamColor = team.color;
        assignedTeamEmoji = team.emoji;
    }

    await saveRoomData(room);

    await pusherServer.trigger(`game-${pin}`, 'player-joined', {
        players: room.players.map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar, streak: p.streak, teamId: p.teamId })),
    });

    return NextResponse.json({
        ok: true, pin,
        teamId: assignedTeamId,
        teamName: assignedTeamName,
        teamColor: assignedTeamColor,
        teamEmoji: assignedTeamEmoji,
    });
}
