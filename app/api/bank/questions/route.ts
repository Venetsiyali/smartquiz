import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { getBankQuestions } from '@/lib/questionBank/bank';

export const dynamic = 'force-dynamic';

// Ombor platformaning boyligi — bitta foydalanuvchi uni tez sur'atda "ko'chirib" ololmasin
const limiter = rateLimit({ windowMs: 60 * 60_000, max: 60 });

const QuerySchema = z.object({
    subject: z.string().min(1).max(100),
    topic: z.string().max(200).optional(),
    grade: z.coerce.number().int().min(1).max(12).optional(),
    difficulty: z.coerce.number().int().min(1).max(3).optional(),
    count: z.coerce.number().int().min(1).max(30).default(10),
});

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Tayyor savollar omboridan foydalanish uchun tizimga kiring' }, { status: 401 });
    }
    const limit = limiter(`bank:${session.user.id}`);
    if (!limit.success) {
        return NextResponse.json({ error: `Juda ko'p so'rov. ${Math.ceil(limit.retryAfter / 60)} daqiqadan so'ng urinib ko'ring.` }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(Array.from(searchParams.entries()).filter(([, v]) => v !== '')));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Fanni tanlang' }, { status: 400 });
    }

    const questions = await getBankQuestions(parsed.data);
    return NextResponse.json({ questions });
}
