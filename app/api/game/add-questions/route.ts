import { NextResponse } from 'next/server';
import { getRoom, saveRoomData } from '@/lib/gameState';

export async function POST(req: Request) {
    try {
        const { pin, quizTitle, questions } = await req.json();
        if (!pin || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: 'Malumotlar toliq emas' }, { status: 400 });
        }

        const room = await getRoom(pin);
        if (!room) {
            return NextResponse.json({ error: 'Xona topilmadi' }, { status: 404 });
        }

        if (room.status !== 'lobby') {
            return NextResponse.json({ error: 'O\'yin allaqachon boshlangan yoki tugallangan' }, { status: 400 });
        }

        // Append or replace questions. Following standard behavior: we just replace for the new game session
        room.quizTitle = quizTitle || room.quizTitle;
        room.questions = questions;

        await saveRoomData(room);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Add questions error:', error);
        return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
    }
}
