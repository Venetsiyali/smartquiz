import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateStreak, getStreak } from '@/lib/gamification/streak';

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await updateStreak(session.user.id);
    return NextResponse.json(result);
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ streak: 0 });

    const streak = await getStreak(session.user.id);
    return NextResponse.json({ streak });
}
