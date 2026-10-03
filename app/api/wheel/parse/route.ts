import { NextResponse } from 'next/server';
import { requireTeacherId } from '@/lib/wheel/authz';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { callAIPool, extractJsonArray, shuffle } from '@/lib/wheel/aiPool';
import { parseStructuredTest } from '@/lib/wheel/regexParser';
import { WheelAIQuestionListSchema } from '@/lib/wheel/schema';
import { OPTION_BALANCE_RULES, pickBalanced, withBalanceBuffer } from '@/lib/questionQuality';

export const maxDuration = 60;

const parseLimiter = rateLimit({ windowMs: 60 * 60_000, max: 20 });

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function extractText(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf')) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
        const result = await pdfParse(buffer);
        return result.text;
    }
    if (name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    throw new Error('Faqat PDF yoki DOCX fayl qabul qilinadi');
}

const AI_SYSTEM_PROMPT = `Siz matn asosida test savollari tuzuvchi AI yordamchisisiz. Faqat JSON massiv qaytaring, boshqa hech narsa yozmang.
Har bir savolda 4 variant va faqat 1 to'g'ri javob bo'lsin. "explanation" maydonida to'g'ri javob nega to'g'ri ekanini qisqa tushuntiring.

${OPTION_BALANCE_RULES}

JSON sxemasi: [{"question":"Savol?","options":["A","B","C","D"],"correctIndex":2,"explanation":"Izoh."}]`;

export async function POST(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const limitCheck = parseLimiter(ip);
    if (!limitCheck.success) {
        return NextResponse.json({ error: `Juda ko'p so'rov. ${Math.ceil(limitCheck.retryAfter / 60)} daqiqadan so'ng urinib ko'ring.` }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const count = Math.min(parseInt((formData.get('count') as string) || '10', 10) || 10, 30);

    if (!file) {
        return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Fayl hajmi 5MB dan oshmasligi kerak" }, { status: 400 });
    }
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
        return NextResponse.json({ error: 'Faqat PDF yoki DOCX fayllarga ruxsat berilgan' }, { status: 400 });
    }

    let extractedText = '';
    try {
        extractedText = await extractText(file);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Fayl o'qishda xatolik" }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length < 50) {
        return NextResponse.json({ error: 'Faylda yetarli matn topilmadi' }, { status: 400 });
    }

    // 1) Avval aniq test formatini regex bilan aniqlashga urinamiz
    const structured = parseStructuredTest(extractedText);
    if (structured.length > 0) {
        const withShuffle = structured.map(q => {
            const correctText = q.options[q.correctIndex];
            const shuffled = shuffle(q.options);
            return {
                question: q.question,
                options: shuffled,
                correctIndex: shuffled.indexOf(correctText),
                explanation: q.explanation,
            };
        });
        return NextResponse.json({ questions: withShuffle, method: 'regex' });
    }

    // 2) Format aniqlanmadi — matnni AI'ga beramiz
    const truncated = extractedText.slice(0, 8000);
    const requestCount = withBalanceBuffer(count);
    const userPrompt = `Quyidagi matn asosida ${requestCount} ta test savoli tuz. Savollar faqat matndan kelib chiqsin.

MATN:
"""
${truncated}
"""

DIQQAT: AYNAN ${requestCount} ta savol yarat, massiv uzunligi aniq shunga teng bo'lishi shart.`;

    try {
        const raw = await callAIPool(AI_SYSTEM_PROMPT, userPrompt, 'groq');
        const rawArr = extractJsonArray(raw);

        const normalized = rawArr.map((q: any) => {
            const opts: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
            while (opts.length < 4) opts.push('—');
            const correctText = opts[q.correctIndex ?? 0];
            const shuffled = shuffle(opts);
            const newCorrectIndex = shuffled.indexOf(correctText);
            return {
                question: q.question || q.text || '',
                options: shuffled,
                correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
                explanation: q.explanation || '',
            };
        });

        const validated = WheelAIQuestionListSchema.safeParse(normalized);
        if (!validated.success) {
            return NextResponse.json({ error: "AI matndan savol yaratolmadi, qayta urinib ko'ring" }, { status: 502 });
        }

        return NextResponse.json({ questions: pickBalanced(validated.data, count, q => q), method: 'ai', fileInfo: { name: file.name, chars: truncated.length } });
    } catch (err: any) {
        console.error('[Wheel Parse] AI xatoligi:', err?.message);
        return NextResponse.json({ error: 'AI hozircha javob bermayapti. Birozdan so\'ng qayta urinib ko\'ring.' }, { status: 503 });
    }
}
