import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { withRoom } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, playerId, nickname, avatar }: {
        pin: string; playerId: string; nickname: string; avatar: string;
    } = await req.json();

    // Ko'p o'quvchi bir vaqtda (QR orqali) kirganda hech kim yo'qolib qolmasligi uchun — qulf ichida
    let result;
    try {
        result = await withRoom(pin, room => {
            if (!room) return null;

            // 1. REJOIN ENGINE: Agar foydalanuvchi allaqachon xonada bo'lsa (ID yoki Nickname orqali), uni qayta kiritish
            const existing = room.players.find(p => p.id === playerId || p.nickname === nickname);
            if (existing) {
                // Faqat oxirgi avatarni yangilaymiz — avvalgi ballar va ketma-ketliklar saqlanadi
                existing.avatar = avatar || existing.avatar || '🤖';
                return {
                    room,
                    response: {
                        ok: true, pin,
                        teamId: existing.teamId,
                        teamName: room.teams?.find(t => t.id === existing.teamId)?.name,
                        teamColor: room.teams?.find(t => t.id === existing.teamId)?.color,
                        teamEmoji: room.teams?.find(t => t.id === existing.teamId)?.emoji,
                        rejoined: true,
                    },
                };
            }

            // 2. YANGI O'YINCHI o'yin davomida ham qo'shilishi mumkin (late join). Team mode: lobby'da o'quvchi
            // jamoani o'zi tanlaydi; o'yin boshlangandan keyin kirsa — eng kam a'zoli jamoaga.
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
                fastestAnswerMs: 0,
            });

            let team;
            if (room.teamMode && room.teams && room.teams.length > 0 && isLateJoin) {
                const memberCounts = room.teams.map(t => room.players.filter(p => p.teamId === t.id).length);
                team = room.teams[memberCounts.indexOf(Math.min(...memberCounts))];
                room.players[room.players.length - 1].teamId = team.id;
            }

            return {
                room,
                response: {
                    ok: true, pin,
                    teamMode: !!room.teamMode,
                    teams: room.teams?.map(t => ({ id: t.id, name: t.name, emoji: t.emoji, color: t.color })) ?? null,
                    teamId: team?.id,
                    teamName: team?.name,
                    teamColor: team?.color,
                    teamEmoji: team?.emoji,
                },
            };
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if (!result) {
        return NextResponse.json({ error: "O'yin xonasi topilmadi (Pin noto'g'ri)" }, { status: 400 });
    }

    // Faqat o'qituvchi ekraniga va faqat yangi o'yinchi: butun ro'yxat 80+ o'yinchida Pusher'ning 10KB xabar chegarasidan oshardi,
    // hammaga yuborish esa har kirishda N ta xabar sarflardi
    const p = result.room.players.find(x => x.id === playerId || x.nickname === nickname);
    if (p) {
        await pusherServer.trigger(`host-${pin}`, 'player-joined', {
            player: { id: p.id, nickname: p.nickname, avatar: p.avatar, streak: p.streak, teamId: p.teamId },
        }).catch(err => console.error('player-joined trigger:', err));
    }

    return NextResponse.json(result.response);
}
