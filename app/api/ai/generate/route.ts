import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
    // Instantiate inside handler — prevents build-time crash when env var isn't set
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const { topic, count = 5, language = 'uz' } = await req.json();

    if (!topic || topic.trim().length < 2) {
        return NextResponse.json({ error: 'Mavzu kiriting' }, { status: 400 });
    }

    const langInstruction =
        language === 'uz'
            ? "O'zbek tilida yoz. Savollar va javoblar o'zbek tilida bo'lsin."
            : language === 'ru'
                ? 'Пиши на русском языке.'
                : 'Write in English.';

    const prompt = `${langInstruction}

Quyidagi mavzu bo'yicha ${count} ta test savoli tuz: "${topic}"

Har bir savol uchun:
- 1 ta savol matni
- 4 ta javob varianti (A, B, C, D)
- To'g'ri javobning indeksi (0=A, 1=B, 2=C, 3=D)

Faqat quyidagi JSON formatda qaytar, boshqa hech narsa yozma:
{
  "questions": [
    {
      "text": "Savol matni?",
      "options": ["A variant", "B variant", "C variant", "D variant"],
      "correctOptions": [0]
    }
  ]
}`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content:
                        "Sen ta'lim sohasida test savollari tuzuvchi AI yordamchisisiz. Faqat so'ralgan JSON formatda javob ber, boshqa hech narsa qo'shma.",
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 2048,
        });

        const raw = completion.choices[0]?.message?.content || '';

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: "AI javob formati noto'g'ri" }, { status: 500 });
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            return NextResponse.json({ error: "AI savollarni to'g'ri formatlamadi" }, { status: 500 });
        }

        return NextResponse.json({ questions: parsed.questions });
    } catch (err: any) {
        console.error('Groq error:', err);
        return NextResponse.json(
            { error: err?.message || 'AI xatoligi' },
            { status: 500 }
        );
    }
}
