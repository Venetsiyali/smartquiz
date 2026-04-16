import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getQuestionCount } from '@/lib/quizUtils';

// Returns weekly quiz creation activity for the analytics chart
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Last 7 days of quiz activity — single query instead of 7 separate counts
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);

        const recentCreated = await prisma.quiz.findMany({
            where: { userId, createdAt: { gte: weekAgo } },
            select: { createdAt: true },
        });

        // Bucket into day slots client-side (max 7 iterations × small array)
        const daySlots: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(day.getDate() - i);
            day.setHours(0, 0, 0, 0);
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);
            daySlots.push({
                date: day.toLocaleDateString('uz-UZ', { weekday: 'short', month: 'short', day: 'numeric' }),
                count: recentCreated.filter(q => q.createdAt >= day && q.createdAt < nextDay).length,
            });
        }
        const days = daySlots;

        // All quizzes for CSV export
        const allQuizzes = await prisma.quiz.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                isPublic: true,
                createdAt: true,
                questions: true,
            },
        });

        const csvRows = allQuizzes.map(q => ({
            id: q.id,
            title: q.title,
            description: q.description ?? '',
            isPublic: q.isPublic ? 'Ha' : "Yo'q",
            questionCount: getQuestionCount(q.questions),
            createdAt: new Date(q.createdAt).toLocaleDateString('uz-UZ'),
        }));

        return NextResponse.json({ weekly: days, csvData: csvRows }, {
            headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
        });
    } catch (error) {
        console.error('Dashboard sessions error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
