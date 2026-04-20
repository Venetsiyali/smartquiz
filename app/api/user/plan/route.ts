import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Always reads from DB — bypasses JWT cache so admin PRO grants show immediately
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ plan: 'FREE' });
    }
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true, proUntil: true },
    });
    const plan = user?.plan ?? 'FREE';
    // If proUntil is set and expired, treat as FREE
    const expired = user?.proUntil && new Date(user.proUntil) < new Date();
    return NextResponse.json({ plan: expired ? 'FREE' : plan });
}
