import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 50);

    try {
        const users = await prisma.user.findMany({
            orderBy: { xp: 'desc' },
            take: limit,
            select: {
                id: true,
                name: true,
                image: true,
                xp: true,
                streak: true,
                totalGamesPlayed: true,
            },
        });

        return NextResponse.json({ leaderboard: users });
    } catch {
        return NextResponse.json({ leaderboard: [] });
    }
}
