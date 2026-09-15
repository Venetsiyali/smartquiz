import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacherId, getOwnedWheelSession } from '@/lib/wheel/authz';
import { WheelAnswerBodySchema } from '@/lib/wheel/schema';

const POINTS_PER_CORRECT = 10;

export async function POST(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const parsed = WheelAnswerBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
    }
    const { questionId, playerId, selectedIndex } = parsed.data;

    const question = await prisma.wheelQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
        return NextResponse.json({ error: 'Savol topilmadi' }, { status: 404 });
    }
    const owned = await getOwnedWheelSession(question.sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const player = await prisma.wheelPlayer.findUnique({ where: { id: playerId } });
    if (!player || player.sessionId !== question.sessionId) {
        return NextResponse.json({ error: "O'quvchi topilmadi" }, { status: 404 });
    }

    const isCorrect = selectedIndex === question.correctIndex;

    const [, updatedPlayer] = await prisma.$transaction([
        prisma.wheelRound.create({
            data: { sessionId: question.sessionId, playerId, questionId, selectedIndex, isCorrect },
        }),
        prisma.wheelPlayer.update({
            where: { id: playerId },
            data: {
                score: { increment: isCorrect ? POINTS_PER_CORRECT : 0 },
                correctCount: { increment: isCorrect ? 1 : 0 },
                wrongCount: { increment: isCorrect ? 0 : 1 },
            },
        }),
    ]);

    return NextResponse.json({
        isCorrect,
        correctIndex: question.correctIndex,
        explanation: question.explanation || '',
        player: updatedPlayer,
    });
}
