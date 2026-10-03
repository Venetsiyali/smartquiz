import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { probeProviders } from '@/lib/llm/pool';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Faqat ADMIN: har bir so'rov AI kvotasini sarflaydi.
export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    const models = await probeProviders();
    const working = Object.values(models).filter(m => m.ok).length;
    return NextResponse.json({ working, total: Object.keys(models).length, models });
}
