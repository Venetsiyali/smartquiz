import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { saveRoomData, generatePin, GameRoom, Question } from '@/lib/gameState';

export async function POST(req: Request) {
    const { quizTitle, questions }: { quizTitle: string; questions: Question[] } = await req.json();

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
    };

    await saveRoomData(room);

    return NextResponse.json({ pin, teacherChannelId });
}
