import { NextResponse } from 'next/server';
import { withRoom, shuffleChoiceOptions } from '@/lib/gameState';

export async function POST(req: Request) {
    try {
        const { pin, quizTitle, questions } = await req.json();
        if (!pin || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: 'Malumotlar toliq emas' }, { status: 400 });
        }

        const result = await withRoom(pin, room => {
            if (!room) return { error: 'Xona topilmadi', status: 404 } as const;
            if (room.status !== 'lobby') {
                return { error: "O'yin allaqachon boshlangan yoki tugallangan", status: 400 } as const;
            }
            // Yangi o'yin sessiyasi uchun savollar almashtiriladi
            room.quizTitle = quizTitle || room.quizTitle;
            room.questions = shuffleChoiceOptions(questions);
            return { ok: true } as const;
        });

        if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Add questions error:', error);
        return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
    }
}
