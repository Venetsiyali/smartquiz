import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { parseTable, parseTextFormat, stripMarkdown, type ImportDefaults } from '@/lib/questionBank/importParser';
import { readImportFile } from '@/lib/questionBank/importFile';
import { GENERAL_SUBJECT } from '@/lib/questionBank/subjects';
import { qualityIssues } from '@/lib/questionQuality';

export const maxDuration = 30;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 200_000;
const MAX_QUESTIONS = 100;
const limiter = rateLimit({ windowMs: 60_000, max: 20 });

/**
 * Oddiy foydalanuvchi uchun import: tashqi AI (ChatGPT, Gemini...) da tayyorlangan savollarni
 * matn yoki fayldan o'qib, quizga qo'shish uchun qaytaradi. Omborga yozmaydi va platforma AI'sini ishlatmaydi.
 */
export async function POST(req: Request) {
    // Login shart emas — tizimga kirmagan o'qituvchi ham foydalana oladi; cheklov IP bo'yicha
    const session = await getServerSession(authOptions).catch(() => null);
    const { success, retryAfter } = limiter(session?.user?.email || getClientIp(req));
    if (!success) return NextResponse.json({ error: `Juda ko'p urinish. ${retryAfter} soniyadan keyin qayta urining.` }, { status: 429 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const text = String(form.get('text') ?? '');
    // Fan majburiy emas — quiz uchun faqat savol, variantlar va javob kerak
    const defaults: ImportDefaults = { subject: GENERAL_SUBJECT, difficulty: 2 };

    let parsed;
    try {
        if (file && file.size > 0) {
            if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Fayl hajmi 5MB dan oshmasligi kerak' }, { status: 400 });
            const content = await readImportFile(file.name, Buffer.from(await file.arrayBuffer()));
            parsed = content.kind === 'text' ? parseTextFormat(stripMarkdown(content.text), defaults) : parseTable(content.rows, defaults);
        } else if (text.trim()) {
            if (text.length > MAX_TEXT_LENGTH) return NextResponse.json({ error: 'Matn juda uzun' }, { status: 400 });
            parsed = parseTextFormat(stripMarkdown(text), defaults);
        } else {
            return NextResponse.json({ error: 'Matn kiriting yoki fayl tanlang' }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Faylni o'qib bo'lmadi" }, { status: 400 });
    }

    const errors = [...parsed.errors];
    const seen = new Set<string>();
    const questions = [];
    for (const q of parsed.questions) {
        const key = q.text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const issues = qualityIssues({ question: q.text, options: q.options, correctIndex: q.correctIndex });
        questions.push({ ref: q.ref, text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, warnings: issues });
    }

    return NextResponse.json({
        questions: questions.slice(0, MAX_QUESTIONS),
        total: questions.length,
        errors: errors.slice(0, 50),
        errorCount: errors.length,
    });
}
