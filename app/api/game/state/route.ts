import { NextResponse } from 'next/server';
import { getRoom, getLeaderboard, computeBadges, questionPayload } from '@/lib/gameState';

export const dynamic = 'force-dynamic';

// O'quvchi qayta ulanganda (ekran yoqilganda, internet tiklanganda) joriy holatni shu yerdan oladi —
// shuning uchun javob Pusher orqali yuboriladigan savol bilan aynan bir xil va to'g'ri javobsiz.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const playerId = searchParams.get('playerId');

    if (!pin) return NextResponse.json({ error: 'PIN kerak' }, { status: 400 });

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 404 });

    const inGame = room.status === 'question' || room.status === 'leaderboard';

    return NextResponse.json({
        status: room.status,
        serverTime: Date.now(),
        players: room.players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            avatar: p.avatar,
            streak: p.streak,
            score: p.score,
            correctCount: p.correctCount,
            teamId: p.teamId,
        })),
        teamMode: !!room.teamMode,
        gameMode: room.gameMode || 'classic',
        teams: room.teams?.map(t => ({
            id: t.id,
            name: t.name,
            emoji: t.emoji,
            color: t.color,
        })) ?? null,
        currentQuestion: inGame ? questionPayload(room) : null,
        answered: playerId ? room.answeredPlayerIds.includes(playerId) : undefined,
        answeredCount: inGame ? room.answeredPlayerIds.length : 0,
        // Savol yopilgandan keyin to'g'ri javob (o'qituvchi ekrani qayta ochilganda ko'rsatish uchun)
        reveal: room.status === 'leaderboard' && room.questions[room.currentQuestionIndex] ? {
            correctOptions: room.questions[room.currentQuestionIndex].correctOptions,
            explanation: room.questions[room.currentQuestionIndex].explanation || null,
            isLastQuestion: room.currentQuestionIndex >= room.questions.length - 1,
        } : undefined,
        leaderboard: room.status === 'leaderboard' || room.status === 'ended' ? getLeaderboard(room.players) : undefined,
        badges: room.status === 'ended' ? computeBadges(room.players) : undefined,
    }, { headers: { 'Cache-Control': 'no-store' } });
}
