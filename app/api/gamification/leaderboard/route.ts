import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GUEST_TEACHER_EMAIL } from '@/lib/wheel/authz';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 50);

    try {
        const users = await prisma.user.findMany({
            // Mehmon o'qituvchi akkaunti (G'ildirak loginsiz rejimi) reytingda ko'rinmasin
            where: { OR: [{ email: null }, { email: { not: GUEST_TEACHER_EMAIL } }] },
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
