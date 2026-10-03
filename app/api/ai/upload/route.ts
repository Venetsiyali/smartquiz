import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { callLLM, LLMUnavailableError } from '@/lib/llm/pool';
import { isProviderId } from '@/lib/llm/providers';
import { OPTION_BALANCE_RULES, pickBalanced, withBalanceBuffer } from '@/lib/questionQuality';

export const maxDuration = 60; // Vercel serverless timeout: 60 soniya

const uploadLimiter = rateLimit({ windowMs: 60 * 60_000, max: 20 }); // Soatiga 20 ta so'rov qat'iy cheklov

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function extractText(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf')) {
        // pdf-parse is a CJS module; use require() to avoid TS "no call signatures" error
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


export async function POST(req: Request) {
    const ip = getClientIp(req);
    const limitCheck = uploadLimiter(ip);
    if (!limitCheck.success) {
        return NextResponse.json({ error: `Juda ko'p so'rov. ${Math.ceil(limitCheck.retryAfter / 60)} daqiqadan so'ng urinib ko'ring.` }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const count = parseInt(formData.get('count') as string || '5', 10);
    const language = (formData.get('language') as string) || 'uz';
    const timeLimit = parseInt(formData.get('timeLimit') as string || '20', 10);
    const provider = (formData.get('provider') as string) || 'groq';

    if (!file) {
        return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
    }

    // Security: Fayl o'lchamini tekshirish (Masalan: 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Fayl hajmi 5MB dan oshmasligi kerak' }, { status: 400 });
    }

    // Security: File extension qat'iy tekshiruvi (Directory Traversal himoyasi)
    const allowedExtensions = ['.pdf', '.docx'];
    const fileName = file.name.toLowerCase();
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
        return NextResponse.json({ error: 'Faqat PDF yoki DOCX fayllarga ruxsat berilgan' }, { status: 400 });
    }

    // Extract text from file
    let extractedText = '';
    try {
        extractedText = await extractText(file);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Fayl o\'qishda xatolik' }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length < 50) {
        return NextResponse.json({ error: "Faylda yetarli matn topilmadi" }, { status: 400 });
    }

    // Truncate to avoid token limit
    const truncated = extractedText.slice(0, 8000);

    const langInstruction =
        language === 'uz'
            ? "Barcha savollar, javoblar va ishora (hint) faqat O'ZBEK tilida bo'lishi shart."
            : language === 'ru'
                ? 'Все вопросы, варианты ответов и подсказки должны быть ИСКЛЮЧИТЕЛЬНО НА РУССКОМ ЯЗЫКЕ.'
                : 'All questions, options, and hints MUST BE STRICTLY IN ENGLISH. No Uzbek language.';

    const prompt = `${langInstruction}

Quyidagi matn asosida ${withBalanceBuffer(count)} ta test savoli tuz. Savollar faqat matndan kelib chiqsin.

MATN:
"""
${truncated}
"""

QAT'IY QOIDALAR:
1. Har bir savolda TO'G'RI javobni HAR XIL pozitsiyaga qo'y (0,1,2,3 rotatsiya bilan).
2. Noto'g'ri javoblar ishonchli va chalg'ituvchi bo'lsin.
3. Har bir savol uchun qisqa "hint" (1 jumla yo'naltiruvchi ishora) yoz.

${OPTION_BALANCE_RULES}

Faqat quyidagi JSON formatda javob ber, boshqa hech narsa yozma:
{
  "questions": [
    {
      "text": "Savol?",
      "options": ["A", "B", "C", "D"],
      "correctOptions": [2],
      "hint": "To'g'ri javob tomonga ishora"
    }
  ]
}`;

    const systemPrompt =
        language === 'ru'
            ? "Вы — профессиональный ИИ-ассистент по созданию образовательных тестов на основе текста. Вы отвечаете СТРОГО на РУССКОМ языке. Выдавайте результат ТОЛЬКО в формате JSON."
            : language === 'en'
                ? "You are a professional educational test generator AI assistant. You answer STRICTLY in ENGLISH. Output ONLY valid JSON."
                : "Sen matn asosida test savollari tuzuvchi AI yordamchisisiz. Faqat JSON formatda javob ber.";

    try {
        let raw = '';
        try {
            ({ text: raw } = await callLLM({
                system: systemPrompt,
                user: prompt,
                temperature: 0.6,
                preferred: isProviderId(provider) ? provider : undefined,
            }));
        } catch (err) {
            if (err instanceof LLMUnavailableError && err.allRateLimited) {
                return NextResponse.json({ rateLimited: true, retryAfter: err.retryAfterSec }, { status: 429 });
            }
            console.warn('[Upload] AI mavjud emas:', (err as Error).message);
            return NextResponse.json({ error: "AI hozircha javob bermayapti. Birozdan so'ng qayta urinib ko'ring." }, { status: 503 });
        }

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return NextResponse.json({ error: "AI javob formati noto'g'ri" }, { status: 500 });

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            return NextResponse.json({ error: "AI savollarni to'g'ri formatlamadi" }, { status: 500 });
        }

        // Shuffle + normalize + add timeLimit
        const balanced = pickBalanced(parsed.questions as any[], count, (q: any) => ({
            options: q.options || [],
            correctIndex: (q.correctOptions || [0])[0],
        }));
        const questions = balanced.map((q: any) => {
            const opts: string[] = q.options || [];
            const correctIdxs: number[] = q.correctOptions || [0];
            const correctTexts = new Set(correctIdxs.map((i: number) => opts[i]));
            const shuffled = shuffle(opts);
            const newCorrect = shuffled.map((o, i) => correctTexts.has(o) ? i : -1).filter(i => i !== -1);
            return {
                text: q.text,
                options: shuffled,
                correctOptions: newCorrect,
                explanation: q.explanation || '',
                timeLimit,
            };
        });

        return NextResponse.json({ questions, fileInfo: { name: file.name, chars: truncated.length } });
    } catch (err: any) {
        console.error('Upload AI error:', err);
        return NextResponse.json({ error: err?.message || 'AI xatoligi' }, { status: 500 });
    }
}
