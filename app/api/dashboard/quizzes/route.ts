import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const filter = searchParams.get('filter') ?? 'all'; // all | public | private
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
        const limit = 10;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { userId: session.user.id };
        if (search) where.title = { contains: search, mode: 'insensitive' };
        if (filter === 'public') where.isPublic = true;
        if (filter === 'private') where.isPublic = false;

        const [quizzes, total] = await Promise.all([
            prisma.quiz.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    isPublic: true,
                    createdAt: true,
                    updatedAt: true,
                    questions: true,
                },
            }),
            prisma.quiz.count({ where }),
        ]);

        const quizzesWithCount = quizzes.map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            isPublic: q.isPublic,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
            questionCount: Array.isArray(q.questions) ? (q.questions as unknown[]).length : 0,
        }));

        return NextResponse.json({
            quizzes: quizzesWithCount,
            total,
            pages: Math.ceil(total / limit),
            page,
        });
    } catch (error) {
        console.error('Dashboard quizzes error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const quiz = await prisma.quiz.findFirst({ where: { id, userId: session.user.id } });
        if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.quiz.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Dashboard delete quiz error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
