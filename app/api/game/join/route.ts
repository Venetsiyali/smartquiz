import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData } from '@/lib/gameState';


export async function POST(req: Request) {
    const { pin, playerId, nickname, avatar }: {
        pin: string; playerId: string; nickname: string; avatar: string;
    } = await req.json();

    const room = await getRoom(pin);
    if (!room) {
        return NextResponse.json({ error: "O'yin xonasi topilmadi (Pin noto'g'ri)" }, { status: 400 });
    }

    // 1. REJOIN ENGINE: Agar foydalanuvchi allaqachon xonada bo'lsa (ID yoki Nickname orqali), uni qayta kiritish
    const existingPlayerIndex = room.players.findIndex(p => p.id === playerId || p.nickname === nickname);
    
    if (existingPlayerIndex !== -1) {
        const p = room.players[existingPlayerIndex];
        // Faqat uning eng oxirgi Avatarini o'zgartirib qayta ulaymiz, avvalgi ballari va ketma-ketliklari saqlanab qoladi.
        p.avatar = avatar || p.avatar || '🤖';
        
        await saveRoomData(room);
        
        // Ulanganlik haqida yana hammaga xabar berish
        await pusherServer.trigger(`game-${pin}`, 'player-joined', {
            players: room.players.map((plyr) => ({ id: plyr.id, nickname: plyr.nickname, avatar: plyr.avatar, streak: plyr.streak, teamId: plyr.teamId })),
        });

        return NextResponse.json({
            ok: true, pin,
            teamId: p.teamId,
            teamName: room.teams?.find(t => t.id === p.teamId)?.name,
            teamColor: room.teams?.find(t => t.id === p.teamId)?.color,
            teamEmoji: room.teams?.find(t => t.id === p.teamId)?.emoji,
            rejoined: true // Qayta qo'shilganligi belgisi
        });
    }

    // 2. YANGI O'YINCHI o'yin davomida ham qo'shilishi mumkin (LATE JOIN / Kahoot uslubi)
    // Bunday o'yinchilar shunchaki o'tkazib yuborgan savollari bo'yicha nol ball bilan boshlashadi.
    // Team mode: talaba xonada o'z jamoasini tanlaydi — auto-assign yo'q (lobby'da).
    // Late-join (o'yin boshlangandan keyin): eng kam a'zoli jamoaga qo'shamiz.
    const isLateJoin = room.status !== 'lobby';

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

    let assignedTeamId: string | undefined;
    let assignedTeamName: string | undefined;
    let assignedTeamColor: string | undefined;
    let assignedTeamEmoji: string | undefined;
    if (room.teamMode && room.teams && room.teams.length > 0 && isLateJoin) {
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
        teamMode: !!room.teamMode,
        teams: room.teams?.map(t => ({ id: t.id, name: t.name, emoji: t.emoji, color: t.color })) ?? null,
        teamId: assignedTeamId,
        teamName: assignedTeamName,
        teamColor: assignedTeamColor,
        teamEmoji: assignedTeamEmoji,
    });
}
