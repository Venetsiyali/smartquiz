import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { saveRoomData, generatePin, GameRoom, Question } from '@/lib/gameState';

export async function POST(req: Request) {
    const { quizTitle, questions, teamMode, teamCount, gameMode }: { quizTitle: string; questions: Question[]; teamMode?: boolean; teamCount?: number; gameMode?: 'classic' | 'tezkor' } = await req.json();

    const pin = generatePin();
    const teacherChannelId = `teacher-${pin}`;

    const room: GameRoom = {
        pin,
        teacherChannelId,
        quizTitle,
        questions,
        players: [],
        currentQuestionIndex: -1,
        status: 'lobby',
        answeredPlayerIds: [],
        teamMode,
        teamCount,
        gameMode,
    };

    await saveRoomData(room);

    return NextResponse.json({ pin, teacherChannelId });
}
