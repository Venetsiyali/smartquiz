import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { character, teamCount, teams, timePerQ, economyOn, questions } = body;

    if (!questions || questions.length === 0) {
        return NextResponse.json({ error: 'Savollar kiritilishi shart' }, { status: 400 });
    }

    const gameSession = await prisma.bozorSession.create({
        data: {
            character: character || 'polvon',
            teamCount: teamCount || 2,
            timePerQ: timePerQ || 20,
            economyOn: economyOn !== false,
            questions,
            teams: {
                create: (teams as { name: string }[]).slice(0, teamCount).map((t, i) => ({
                    teamIndex: i,
                    name: t.name || `${i + 1}-jamoa`,
                })),
            },
        },
        include: { teams: { orderBy: { teamIndex: 'asc' } } },
    });

    return NextResponse.json({ id: gameSession.id });
}
