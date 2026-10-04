import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBankCatalog } from '@/lib/questionBank/bank';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Tayyor savollar omboridan foydalanish uchun tizimga kiring' }, { status: 401 });
    }
    return NextResponse.json({ subjects: await getBankCatalog() });
}
