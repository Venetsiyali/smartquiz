import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AssignmentSettingsSchema, publicUrl, type AssignmentQuestion } from '@/lib/assignments';

export const dynamic = 'force-dynamic';

async function loadOwned(id: string, session: Session | null) {
    if (!session?.user?.id) return { error: NextResponse.json({ error: 'Tizimga kiring' }, { status: 401 }) };
    const a = await prisma.assignment.findUnique({ where: { id } });
    if (!a || (a.teacherId !== session.user.id && session.user.role !== 'ADMIN')) {
        return { error: NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 }) };
    }
    return { assignment: a };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const { assignment: a, error } = await loadOwned(params.id, await getServerSession(authOptions));
    if (error) return error;

    const questions = a.questions as AssignmentQuestion[];
    const attempts = await prisma.assignmentAttempt.findMany({
        where: { assignmentId: a.id },
        orderBy: [{ submittedAt: 'desc' }, { startedAt: 'desc' }],
        select: {
            id: true, studentName: true, groupName: true, startedAt: true, submittedAt: true,
            correctCount: true, total: true, score: true, _count: { select: { answers: true } },
        },
    });

    // Savollar bo'yicha: nechta yakunlangan urinishda javob berilgan, nechtasi to'g'ri, variantlar taqsimoti
    const answers = await prisma.assignmentAnswer.findMany({
        where: { attempt: { assignmentId: a.id, submittedAt: { not: null } } },
        select: { questionIndex: true, selected: true, isCorrect: true },
    });
    const stats = questions.map((q, i) => {
        const mine = answers.filter(x => x.questionIndex === i);
        return {
            index: i,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            answered: mine.length,
            correct: mine.filter(x => x.isCorrect).length,
            choices: [0, 1, 2, 3].map(k => mine.filter(x => x.selected === k).length),
            timeouts: mine.filter(x => x.selected === -1).length,
        };
    });

    const { questions: _q, ...rest } = a;
    return NextResponse.json({
        assignment: { ...rest, questionCount: questions.length, url: publicUrl(a.code) },
        attempts: attempts.map(({ _count, ...t }) => ({ ...t, answeredCount: _count.answers })),
        stats,
    });
}

const PatchSchema = AssignmentSettingsSchema.partial().extend({
    status: z.enum(['ACTIVE', 'CLOSED']).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const { assignment: a, error } = await loadOwned(params.id, await getServerSession(authOptions));
    if (error) return error;

    const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Maʼlumot notoʻgʻri" }, { status: 400 });
    const data = parsed.data;
    const opensAt = data.opensAt !== undefined ? data.opensAt : a.opensAt;
    const closesAt = data.closesAt !== undefined ? data.closesAt : a.closesAt;
    if (opensAt && closesAt && closesAt <= opensAt) {
        return NextResponse.json({ error: 'Tugash vaqti boshlanish vaqtidan keyin boʻlishi kerak' }, { status: 400 });
    }

    const updated = await prisma.assignment.update({ where: { id: a.id }, data, select: { id: true } });
    return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const { assignment: a, error } = await loadOwned(params.id, await getServerSession(authOptions));
    if (error) return error;
    await prisma.assignment.delete({ where: { id: a.id } });
    return NextResponse.json({ ok: true });
}
