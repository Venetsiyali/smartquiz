import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

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


function parseRetryAfter(err: any): number | null {
    try {
        const header = err?.headers?.get?.('retry-after') ?? err?.headers?.['retry-after'];
        if (header) return Math.ceil(parseInt(String(header), 10));
    } catch {}
    const msg: string = err?.message ?? err?.error?.message ?? JSON.stringify(err?.error ?? '');
    const sec = msg.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
    if (sec) return Math.ceil(parseFloat(sec[1]));
    const min = msg.match(/try again in (\d+(?:\.\d+)?)\s*m/i);
    if (min) return Math.ceil(parseFloat(min[1]) * 60);
    return null;
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

Quyidagi matn asosida ${count} ta test savoli tuz. Savollar faqat matndan kelib chiqsin.

MATN:
"""
${truncated}
"""

QAT'IY QOIDALAR:
1. Har bir savolda TO'G'RI javobni HAR XIL pozitsiyaga qo'y (0,1,2,3 rotatsiya bilan).
2. Noto'g'ri javoblar ishonchli va chalg'ituvchi bo'lsin.
3. Har bir savol uchun qisqa "hint" (1 jumla yo'naltiruvchi ishora) yoz.

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
        // Build key pools
        const geminiMulti1 = (process.env.GEMINI_API_KEYS || '').split(',').map((k: string) => k.trim()).filter(Boolean);
        const geminiMulti2 = (process.env.GEMINI_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean);
        const geminiKeys = Array.from(new Set([...geminiMulti1, ...geminiMulti2]));

        const groqMulti1 = (process.env.GROQ_API_KEYS || '').split(',').map((k: string) => k.trim()).filter(Boolean);
        const groqMulti2 = (process.env.GROQ_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean);
        const groqKeys = Array.from(new Set([...groqMulti1, ...groqMulti2]));

        const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp'];
        const GROQ_MODELS   = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

        type Candidate = { provider: 'gemini' | 'groq'; key: string; model: string };

        const expandGemini = (keys: string[]): Candidate[] =>
            keys.flatMap(k => GEMINI_MODELS.map(m => ({ provider: 'gemini' as const, key: k, model: m })));
        const expandGroq = (keys: string[]): Candidate[] =>
            keys.flatMap(k => GROQ_MODELS.map(m => ({ provider: 'groq' as const, key: k, model: m })));

        const primaryList  = shuffle(provider === 'gemini' ? expandGemini(geminiKeys) : expandGroq(groqKeys));
        const fallbackList = shuffle(provider === 'gemini' ? expandGroq(groqKeys)     : expandGemini(geminiKeys));
        const allCandidates: Candidate[] = [...primaryList, ...fallbackList];

        let raw = '';
        let lastKeyErr = '';
        const startTime = Date.now();

        for (let ci = 0; ci < allCandidates.length; ci++) {
            if (Date.now() - startTime > 55000) {
                console.warn('[Upload AI Pool] 55s time limit reached, aborting pool');
                break;
            }
            const { provider: cur, key, model } = allCandidates[ci];
            
            try {
                if (cur === 'gemini') {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 40000);
                    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}\n\nReturn ONLY valid JSON. No markdown wrappers.` }] }],
                            generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
                        }),
                        signal: controller.signal
                    });
                    clearTimeout(id);
                    if (!geminiRes.ok) {
                        const errObj: any = new Error(`Gemini xatosi: ${geminiRes.status}`);
                        errObj.status = geminiRes.status;
                        throw errObj;
                    }
                    const data = await geminiRes.json();
                    raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                    const groq = new Groq({ apiKey: key, timeout: 40000, maxRetries: 0 });
                    const completion = await groq.chat.completions.create({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt },
                        ],
                        temperature: 0.6,
                        max_tokens: 4096,
                    });
                    raw = completion.choices[0]?.message?.content || '';
                }
                
                if (raw) break; // success — exit key loop
            } catch (err: any) {
                const status = err?.status ?? 0;
                const isRateLimit   = status === 429 || (err?.message && err.message.includes('429'));
                const isUnavailable = status === 503 || status === 502 || status === 529;
                const isTimeout     = err?.name === 'AbortError' || err?.message?.includes('timeout') || err?.message?.includes('aborted');

                lastKeyErr = err?.message || 'xatolik';
                
                if (isRateLimit || isUnavailable || isTimeout) {
                    console.warn(`[Upload AI Pool] ${cur}/${model} #${ci} ${isRateLimit ? 'rate-limited' : (isTimeout ? 'timed out' : 'unavailable')} — trying next...`);
                    continue;
                }
                
                console.error(`[Upload AI Pool] ${cur}/${model} #${ci} failed:`, lastKeyErr);
                if (ci === allCandidates.length - 1) throw new Error(lastKeyErr);
            }
        }

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return NextResponse.json({ error: "AI javob formati noto'g'ri" }, { status: 500 });

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            return NextResponse.json({ error: "AI savollarni to'g'ri formatlamadi" }, { status: 500 });
        }

        // Shuffle + normalize + add timeLimit
        const questions = parsed.questions.map((q: any) => {
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
        if (err?.status === 429) {
            return NextResponse.json(
                { rateLimited: true, retryAfter: parseRetryAfter(err) },
                { status: 429 }
            );
        }
        return NextResponse.json({ error: err?.message || 'AI xatoligi' }, { status: 500 });
    }
}
