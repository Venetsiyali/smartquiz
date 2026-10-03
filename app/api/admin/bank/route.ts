import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

type View = 'queue' | 'unverified' | 'approved' | 'rejected';

function whereFor(view: View): Prisma.BankQuestionWhereInput {
    switch (view) {
        case 'queue':
            // Tekshiruvchi shubha bildirganlar yoki o'qituvchilar shikoyat qilganlar
            return {
                status: { not: 'REJECTED' },
                OR: [
                    { status: 'PENDING', verifiedAt: { not: null } },
                    { reports: { some: { resolved: false } } },
                ],
            };
        case 'unverified':
            return { status: 'PENDING', verifiedAt: null };
        case 'approved':
            return { status: 'APPROVED' };
        case 'rejected':
            return { status: 'REJECTED' };
    }
}

async function getStats() {
    const [byStatus, queue, unverified, reported, bySubject, served] = await Promise.all([
        prisma.bankQuestion.groupBy({ by: ['status'], _count: true }),
        prisma.bankQuestion.count({ where: whereFor('queue') }),
        prisma.bankQuestion.count({ where: whereFor('unverified') }),
        prisma.bankQuestion.count({ where: { reports: { some: { resolved: false } } } }),
        prisma.bankQuestion.groupBy({ by: ['subject'], where: { status: 'APPROVED' }, _count: true, orderBy: { subject: 'asc' } }),
        prisma.bankQuestion.aggregate({ _sum: { timesShown: true } }),
    ]);
    const count = (s: string) => byStatus.find(b => b.status === s)?._count ?? 0;
    return {
        approved: count('APPROVED'),
        pending: count('PENDING'),
        rejected: count('REJECTED'),
        queue,
        unverified,
        reported,
        served: served._sum.timesShown ?? 0,
        bySubject: bySubject.map(s => ({ subject: s.subject, count: s._count })),
    };
}

export async function GET(req: Request) {
    if (!(await requireModerator())) {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const viewParam = searchParams.get('view');
    const view: View = viewParam === 'unverified' || viewParam === 'approved' || viewParam === 'rejected' ? viewParam : 'queue';
    const subject = searchParams.get('subject');
    const q = searchParams.get('q')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

    const where: Prisma.BankQuestionWhereInput = {
        AND: [
            whereFor(view),
            ...(subject ? [{ subject }] : []),
            ...(q ? [{ text: { contains: q, mode: 'insensitive' as const } }] : []),
        ],
    };

    const [total, items, stats] = await Promise.all([
        prisma.bankQuestion.count({ where }),
        prisma.bankQuestion.findMany({
            where,
            orderBy: view === 'queue' ? [{ reportCount: 'desc' }, { createdAt: 'asc' }] : [{ updatedAt: 'desc' }],
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            include: { reports: { where: { resolved: false }, select: { reason: true, createdAt: true }, orderBy: { createdAt: 'desc' } } },
        }),
        searchParams.get('stats') === '1' ? getStats() : Promise.resolve(null),
    ]);

    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE, stats });
}
