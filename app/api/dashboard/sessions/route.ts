import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Returns weekly quiz creation activity for the analytics chart
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Last 7 days of quiz activity
        const now = new Date();
        const days: { date: string; count: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(day.getDate() - i);
            day.setHours(0, 0, 0, 0);
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);

            const count = await prisma.quiz.count({
                where: {
                    userId,
                    createdAt: { gte: day, lt: nextDay },
                },
            });

            days.push({
                date: day.toLocaleDateString('uz-UZ', { weekday: 'short', month: 'short', day: 'numeric' }),
                count,
            });
        }

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
            questionCount: Array.isArray(q.questions) ? (q.questions as unknown[]).length : 0,
            createdAt: new Date(q.createdAt).toLocaleDateString('uz-UZ'),
        }));

        return NextResponse.json({ weekly: days, csvData: csvRows });
    } catch (error) {
        console.error('Dashboard sessions error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
