import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { redis } from '@/lib/gameState';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sanitizeQuestions, normalize, type EngQuestion } from '@/lib/engRace';

export const dynamic = 'force-dynamic';

/**
 * "Boshqalarning savollari" — o'qituvchilar tashqi AI orqali yoki qo'lda kiritgan savollar yig'iladigan
 * umumiy ombor. Tayyor to'plamlardan alohida, yo'nalish (theme) va til bo'yicha alohida Redis hash'ida saqlanadi:
 *   community:{theme}:{lang}  →  { [savol hash'i]: JSON }  — bir xil savol ikki marta qo'shilmaydi.
 */
const THEMES = ['it', 'grammar'] as const;
const LANGS = ['uz', 'ru'] as const;
const MAX_PER_BANK = 5000;
const MAX_PER_REQUEST = 100;
const RETURN_LIMIT = 500;
const limiter = rateLimit({ windowMs: 60_000, max: 10 });

type Stored = EngQuestion & { addedAt: number };

function bankKey(theme: unknown, lang: unknown): string | null {
    if (!THEMES.includes(theme as any) || !LANGS.includes(lang as any)) return null;
    return `community:${theme}:${lang}`;
}

const questionHash = (q: EngQuestion) =>
    createHash('sha1').update(`${normalize(q.q)}|${normalize(q.answer)}`).digest('hex').slice(0, 20);

export async function GET(req: Request) {
    const url = new URL(req.url);
    const key = bankKey(url.searchParams.get('theme'), url.searchParams.get('lang'));
    if (!key) return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

    // Faqat son kerak bo'lsa (tugmadagi hisoblagich) — butun omborni yubormaymiz
    if (url.searchParams.get('count') === '1') {
        return NextResponse.json({ count: await redis.hlen(key) });
    }
    const all = await redis.hgetall<Record<string, Stored | string>>(key);
    const questions = Object.values(all ?? {})
        .map(v => (typeof v === 'string' ? JSON.parse(v) : v) as Stored)
        .sort((a, b) => b.addedAt - a.addedAt)
        .slice(0, RETURN_LIMIT)
        .map(({ addedAt, ...q }) => q);
    return NextResponse.json({ questions, count: Object.keys(all ?? {}).length });
}

export async function POST(req: Request) {
    if (!limiter(getClientIp(req)).success) {
        return NextResponse.json({ error: "Juda ko'p urinish" }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const key = bankKey(body.theme, body.lang);
    if (!key) return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });

    const list = Array.isArray(body.questions) ? body.questions.slice(0, MAX_PER_REQUEST) : [];
    // Yaroqsiz savollarni bittalab tashlab yuboramiz — bitta xato butun to'plamni rad etmasin
    const valid = list.flatMap((q: unknown) => {
        const r = sanitizeQuestions([q, q, q]);
        return r.error ? [] : [r.questions[0]];
    }) as EngQuestion[];
    if (valid.length === 0) return NextResponse.json({ added: 0 });

    if ((await redis.hlen(key)) >= MAX_PER_BANK) return NextResponse.json({ added: 0, full: true });

    const now = Date.now();
    const results = await Promise.all(valid.map(q =>
        redis.hsetnx(key, questionHash(q), JSON.stringify({ ...q, addedAt: now } satisfies Stored))));
    return NextResponse.json({ added: results.filter(Boolean).length });
}
