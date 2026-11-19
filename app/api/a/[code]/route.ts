import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { availability, normalizeCode } from '@/lib/assignments';

export const dynamic = 'force-dynamic';

// Ochiq maʼlumot: topshiriq nomi va qoidalari. Savollar va javoblar bu yerda qaytarilmaydi.
export async function GET(_req: Request, { params }: { params: { code: string } }) {
    const a = await prisma.assignment.findUnique({
        where: { code: normalizeCode(params.code) },
        select: {
            title: true, description: true, questions: true, opensAt: true, closesAt: true, status: true,
            maxAttempts: true, timePerQuestion: true, showAnswers: true, teacher: { select: { name: true } },
        },
    });
    if (!a) return NextResponse.json({ error: 'Topshiriq topilmadi. Kodni tekshiring.' }, { status: 404 });

    const { open, reason } = availability(a);
    return NextResponse.json({
        title: a.title,
        description: a.description,
        teacherName: a.teacher.name ?? '',
        questionCount: Array.isArray(a.questions) ? a.questions.length : 0,
        opensAt: a.opensAt,
        closesAt: a.closesAt,
        maxAttempts: a.maxAttempts,
        timePerQuestion: a.timePerQuestion,
        showAnswers: a.showAnswers,
        open,
        reason: reason ?? null,
    }, { headers: { 'Cache-Control': 'no-store' } });
}
