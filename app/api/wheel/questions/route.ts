import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacherId, getOwnedWheelSession } from '@/lib/wheel/authz';
import { WheelSaveQuestionsBodySchema } from '@/lib/wheel/schema';

export async function POST(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const parsed = WheelSaveQuestionsBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: "Savollar noto'g'ri formatda" }, { status: 400 });
    }
    const { sessionId, questions } = parsed.data;

    const owned = await getOwnedWheelSession(sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 });
    }

    const created = await prisma.$transaction(
        questions.map(q => prisma.wheelQuestion.create({
            data: {
                sessionId,
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation || '',
                source: q.source,
            },
        }))
    );

    return NextResponse.json({ questions: created });
}

export async function GET(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
        return NextResponse.json({ error: 'sessionId ko\'rsatilmagan' }, { status: 400 });
    }

    const owned = await getOwnedWheelSession(sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 });
    }

    // Preview rejimi — teacher o'zi tuzayotgan savol bankini to'liq (to'g'ri javobi bilan) ko'radi
    const questions = await prisma.wheelQuestion.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ questions });
}

export async function DELETE(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('id');
    if (!questionId) {
        return NextResponse.json({ error: 'Savol id ko\'rsatilmagan' }, { status: 400 });
    }

    const question = await prisma.wheelQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
        return NextResponse.json({ error: 'Savol topilmadi' }, { status: 404 });
    }
    const owned = await getOwnedWheelSession(question.sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    await prisma.wheelQuestion.delete({ where: { id: questionId } });
    return NextResponse.json({ success: true });
}
