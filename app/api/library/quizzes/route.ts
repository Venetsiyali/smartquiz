import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const revalidate = 60; // 60 soniyada bir kesh yangilanadi
export const fetchCache = 'default-cache';

const ALLOWED_ROLES = ['MODERATOR', 'ADMIN'];

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const all = searchParams.get('all') === 'true';

    // Admin mode: return all quizzes + stats
    if (all) {
        const session = await getServerSession(authOptions);
        if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
        }

        const quizzes = await prisma.libraryQuiz.findMany({
            orderBy: { created_at: 'desc' },
        });

        const total = quizzes.length;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonth = quizzes.filter(q => new Date(q.created_at) >= monthStart).length;
        const totalPlays = quizzes.reduce((s, q) => s + q.play_count, 0);
        const rated = quizzes.filter(q => q.rating > 0);
        const avgRating = rated.length > 0
            ? parseFloat((rated.reduce((s, q) => s + q.rating, 0) / rated.length).toFixed(1))
            : 0;

        return NextResponse.json({
            quizzes,
            stats: { total, thisMonth, totalPlays, avgRating },
        });
    }

    // Public mode: return carousel selection (up to 5 slots with algorithm)
    const baseWhere = {
        is_active: true,
        ...(subject ? { subject } : {}),
    };

    type LibraryQuiz = Awaited<ReturnType<typeof prisma.libraryQuiz.findFirst>>;
    const selected: LibraryQuiz[] = [];
    const excludeIds = () => selected.filter(Boolean).map(q => q!.id);

    // Slot 1: pinned quiz
    const pinned = await prisma.libraryQuiz.findFirst({
        where: { ...baseWhere, is_pinned: true },
        orderBy: { play_count: 'desc' },
    });
    if (pinned) selected.push(pinned);

    // Slots 2–3: recent 7 days, highest play_count
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await prisma.libraryQuiz.findMany({
        where: {
            ...baseWhere,
            created_at: { gte: sevenDaysAgo },
            ...(excludeIds().length > 0 ? { id: { notIn: excludeIds() } } : {}),
        },
        orderBy: { play_count: 'desc' },
        take: 2,
    });
    selected.push(...recent);

    // Slot 4: highest rated (rating > 4.7)
    const highRated = await prisma.libraryQuiz.findFirst({
        where: {
            ...baseWhere,
            rating: { gt: 4.7 },
            ...(excludeIds().length > 0 ? { id: { notIn: excludeIds() } } : {}),
        },
        orderBy: { rating: 'desc' },
    });
    if (highRated) selected.push(highRated);

    // Slot 5: seasonal quiz
    const seasonal = await prisma.libraryQuiz.findFirst({
        where: {
            ...baseWhere,
            is_seasonal: true,
            ...(excludeIds().length > 0 ? { id: { notIn: excludeIds() } } : {}),
        },
    });
    if (seasonal) selected.push(seasonal);

    // Fill up to 5 from general pool
    if (selected.length < 5) {
        const fill = await prisma.libraryQuiz.findMany({
            where: {
                ...baseWhere,
                ...(excludeIds().length > 0 ? { id: { notIn: excludeIds() } } : {}),
            },
            orderBy: { play_count: 'desc' },
            take: 5 - selected.length,
        });
        selected.push(...fill);
    }

    return NextResponse.json({ quizzes: selected.filter(Boolean) }, {
        headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, subject, grade, game_type, badge_type, is_pinned, is_seasonal, questions } = body;

        if (!title || !subject || !questions?.length) {
            return NextResponse.json({ error: "Sarlavha, fan va savollar majburiy" }, { status: 400 });
        }

        const quiz = await prisma.libraryQuiz.create({
            data: {
                title,
                subject,
                grade: grade || 'Barcha',
                game_type: game_type || 'Klassik',
                badge_type: badge_type || "Yangi qo'shildi",
                is_pinned: !!is_pinned,
                is_seasonal: !!is_seasonal,
                questions,
            },
        });

        return NextResponse.json({ quiz });
    } catch (err) {
        return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
    }
}
