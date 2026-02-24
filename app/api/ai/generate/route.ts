import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Fisher-Yates shuffle — returns new array
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function POST(req: Request) {
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

Mavzu: "${topic}"
${count} ta test savoli tuz.

QAT'IY QOIDALAR:
1. Har bir savolda TO'G'RI javobni HAR XIL pozitsiyaga qo'y.
   - 1-savol: to'g'ri javob indeksi 2 (C)
   - 2-savol: to'g'ri javob indeksi 0 (A)
   - 3-savol: to'g'ri javob indeksi 3 (D)
   - 4-savol: to'g'ri javob indeksi 1 (B)
   - 5-savol: to'g'ri javob indeksi 2 (C)
   ... va hokazo. HECH QACHON to'g'ri javobni ketma-ket bir xil pozitsiyaga qo'yma.
2. Noto'g'ri javoblar real va ishonchli ko'rinsin — o'quvchinni chalg'itsin.
3. Savollar qiyin va o'ylantiruvchi bo'lsin.
4. Har bir savol uchun "explanation" — qisqa izoh (1-2 jumla) yoz: nima uchun to'g'ri javob to'g'riligini tushuntir.

Faqat quyidagi JSON formatda javob ber, boshqa hech narsa yozma:
{
  "questions": [
    {
      "text": "Savol matni?",
      "options": ["variant0", "variant1", "variant2", "variant3"],
      "correctOptions": [to'g'ri_variant_indeksi],
      "explanation": "Bu to'g'ri, chunki..."
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
                        "Sen ta'lim sohasida mukammal test savollari tuzuvchi AI yordamchisisiz. Faqat so'ralgan JSON formatda javob ber, boshqa hech narsa qo'shma. TO'G'RI JAVOBNI HAR DOIM HAR XIL POZITSIYAGA QO'Y — A, B, C, D pozitsiyalari teng taqsimlansin.",
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

        // Shuffle options server-side to guarantee varied correct answer positions
        // regardless of AI behavior
        const questions = parsed.questions.map((q: any) => {
            const opts: string[] = q.options || [];
            const correctIdxs: number[] = q.correctOptions || [0];
            const correctTexts = new Set(correctIdxs.map((i: number) => opts[i]));

            const shuffled = shuffle(opts);
            const newCorrectOptions = shuffled
                .map((o, i) => (correctTexts.has(o) ? i : -1))
                .filter(i => i !== -1);

            return { text: q.text, options: shuffled, correctOptions: newCorrectOptions };
        });

        return NextResponse.json({ questions });
    } catch (err: any) {
        console.error('Groq error:', err);
        return NextResponse.json(
            { error: err?.message || 'AI xatoligi' },
            { status: 500 }
        );
    }
}
