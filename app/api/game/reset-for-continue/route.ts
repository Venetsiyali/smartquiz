import { NextResponse } from 'next/server';
import { getRoom, saveRoomData } from '@/lib/gameState';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
    try {
        const { pin } = await req.json();
        if (!pin) {
            return NextResponse.json({ error: 'PIN kiritilmagan' }, { status: 400 });
        }

        const room = await getRoom(pin);
        if (!room) {
            return NextResponse.json({ error: 'Xona topilmadi' }, { status: 404 });
        }

        // Reset game state for continuation
        room.status = 'lobby';
        room.currentQuestionIndex = 0;
        room.questions = [];
        room.questionStartTime = undefined;
        room.answeredPlayerIds = [];

        // Zero out player stats but keep them in the room
        room.players = room.players.map(p => ({
            ...p,
            score: 0,
            streak: 0,
            longestStreak: 0,
            correctCount: 0,
            totalAnswers: 0,
            totalResponseMs: 0,
            fastestAnswerMs: 0,
            hintsUsed: 0,
        }));

        // Reset team scores if team mode is active
        if (room.teams) {
            room.teams = room.teams.map(t => ({
                ...t,
                score: 0,
                health: 100,
                comboCount: 0,
                shieldActiveUntil: 0,
                shieldUsed: false,
                answeredCorrectly: [],
                answeredTotal: []
            }));
        }

        await saveRoomData(room);

        // Tell all players in the room to go back to the lobby waiting state
        await pusherServer.trigger(`game-${pin}`, 'return-to-lobby', {});

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
    }
}
