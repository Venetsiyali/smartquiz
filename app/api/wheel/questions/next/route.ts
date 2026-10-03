import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacherId, getOwnedWheelSession } from '@/lib/wheel/authz';
import { shuffle } from '@/lib/shuffle';

export async function POST(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;
    if (!sessionId) {
        return NextResponse.json({ error: "sessionId ko'rsatilmagan" }, { status: 400 });
    }

    const owned = await getOwnedWheelSession(sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 });
    }

    const unused = await prisma.wheelQuestion.findMany({
        where: { sessionId, used: false },
        select: { id: true },
    });

    if (unused.length === 0) {
        return NextResponse.json({ done: true });
    }

    const pick = unused[Math.floor(Math.random() * unused.length)];

    // Variantlarni har chaqirilganda aralashtiramiz va DB'dagi correctIndex'ni mos ravishda yangilaymiz —
    // shu bilan to'g'ri javob clientga hech qachon shu bosqichda yuborilmaydi.
    const full = await prisma.wheelQuestion.findUnique({ where: { id: pick.id } });
    if (!full) return NextResponse.json({ done: true });

    const options = full.options as string[];
    const correctText = options[full.correctIndex];
    const shuffledOptions = shuffle(options);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);

    const updated = await prisma.wheelQuestion.update({
        where: { id: full.id },
        data: { options: shuffledOptions, correctIndex: newCorrectIndex, used: true },
    });

    return NextResponse.json({
        question: {
            id: updated.id,
            question: updated.question,
            options: updated.options,
        },
    });
}
