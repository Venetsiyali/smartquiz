import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserBadges, checkAndAwardBadge, seedBadges } from '@/lib/gamification/badges';

// GET — foydalanuvchi badgelari
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ badges: [] });

    const badges = await getUserBadges(session.user.id);
    return NextResponse.json({ badges });
}

// POST — badge berish { badgeKey: string }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { badgeKey } = await req.json();
    if (!badgeKey) return NextResponse.json({ error: 'badgeKey required' }, { status: 400 });

    // Seed badges to DB (idempotent — xavfsiz)
    await seedBadges();

    const awarded = await checkAndAwardBadge(session.user.id, badgeKey);
    return NextResponse.json({ awarded });
}
