import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateAssignmentSchema, generateCode, publicUrl } from '@/lib/assignments';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Tizimga kiring" }, { status: 401 });

    const rows = await prisma.assignment.findMany({
        where: { teacherId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, code: true, title: true, status: true, opensAt: true, closesAt: true, createdAt: true, questions: true,
            _count: { select: { attempts: { where: { submittedAt: { not: null } } } } },
        },
    });

    return NextResponse.json({
        assignments: rows.map(({ questions, _count, ...a }) => ({
            ...a,
            questionCount: Array.isArray(questions) ? questions.length : 0,
            submittedCount: _count.attempts,
            url: publicUrl(a.code),
        })),
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Topshiriq yaratish uchun tizimga kiring" }, { status: 401 });

    const parsed = CreateAssignmentSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json({ error: `Maʼlumot notoʻgʻri: ${issue?.path.join('.') || ''} ${issue?.message ?? ''}`.trim() }, { status: 400 });
    }
    const data = parsed.data;
    if (data.opensAt && data.closesAt && data.closesAt <= data.opensAt) {
        return NextResponse.json({ error: 'Tugash vaqti boshlanish vaqtidan keyin boʻlishi kerak' }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
        data: { ...data, code: await generateCode(), teacherId: session.user.id },
        select: { id: true, code: true },
    });

    return NextResponse.json({ ...assignment, url: publicUrl(assignment.code) });
}
