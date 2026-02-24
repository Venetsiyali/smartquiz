import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

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
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const count = parseInt(formData.get('count') as string || '5', 10);
    const language = (formData.get('language') as string) || 'uz';
    const timeLimit = parseInt(formData.get('timeLimit') as string || '20', 10);

    if (!file) {
        return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
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
            ? "O'zbek tilida yoz."
            : language === 'ru'
                ? 'Пиши на русском языке.'
                : 'Write in English.';

    const prompt = `${langInstruction}

Quyidagi matn asosida ${count} ta test savoli tuz. Savollar faqat matndan kelib chiqsin.

MATN:
"""
${truncated}
"""

QAT'IY QOIDALAR:
1. Har bir savolda TO'G'RI javobni HAR XIL pozitsiyaga qo'y (0,1,2,3 rotatsiya bilan).
2. Noto'g'ri javoblar ishonchli va chalg'ituvchi bo'lsin.
3. Har bir savol uchun qisqa "explanation" (izoh, 1-2 jumlа) yoz — nima uchun to'g'ri javob to'g'riligini tushuntir.

Faqat quyidagi JSON formatda javob ber, boshqa hech narsa yozma:
{
  "questions": [
    {
      "text": "Savol?",
      "options": ["A", "B", "C", "D"],
      "correctOptions": [2],
      "explanation": "Bu to'g'ri chunki..."
    }
  ]
}`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: "Sen matn asosida test savollari tuzuvchi AI yordamchisisiz. Faqat JSON formatda javob ber.",
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 4096,
        });

        const raw = completion.choices[0]?.message?.content || '';
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
        return NextResponse.json({ error: err?.message || 'AI xatoligi' }, { status: 500 });
    }
}
