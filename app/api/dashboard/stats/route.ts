import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const [totalQuizzes, publicQuizzes, user, recentQuizzes] = await Promise.all([
            prisma.quiz.count({ where: { userId } }),
            prisma.quiz.count({ where: { userId, isPublic: true } }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { totalGamesPlayed: true, xp: true, streak: true, createdAt: true },
            }),
            prisma.quiz.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, title: true, isPublic: true, createdAt: true, questions: true },
            }),
        ]);

        const recentQuizzesWithCount = recentQuizzes.map(q => ({
            id: q.id,
            title: q.title,
            isPublic: q.isPublic,
            createdAt: q.createdAt,
            questionCount: Array.isArray(q.questions) ? (q.questions as unknown[]).length : 0,
        }));

        return NextResponse.json({
            totalQuizzes,
            publicQuizzes,
            privateQuizzes: totalQuizzes - publicQuizzes,
            totalGamesPlayed: user?.totalGamesPlayed ?? 0,
            xp: user?.xp ?? 0,
            streak: user?.streak ?? 0,
            memberSince: user?.createdAt ?? null,
            recentQuizzes: recentQuizzesWithCount,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
