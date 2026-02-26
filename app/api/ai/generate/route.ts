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
            ? "Barcha savollar, javoblar va izohlar faqat O'ZBEK tilida bo'lishi shart."
            : language === 'ru'
                ? 'Все вопросы, варианты ответов и объяснения должны быть ИСКЛЮЧИТЕЛЬНО НА РУССКОМ ЯЗЫКЕ. Никакого узбекского языка.'
                : 'All questions, options, and explanations MUST BE STRICTLY IN ENGLISH. No Uzbek language.';

    const prompt = `${langInstruction}

Mavzu/Topic/Тема: "${topic}"
${count} ta test savoli tuz. (Generate ${count} questions / Создай ${count} вопросов)

QAT'IY QOIDALAR (STRICT RULES):
1. Har bir savolda TO'G'RI javobni HAR XIL pozitsiyaga qo'y (Mix correct answer positions).
2. Noto'g'ri javoblar real va ishonchli ko'rinsin (Plausible distractors).
3. Savollar qiyin va o'ylantiruvchi bo'lsin (Challenging questions).
4. Har bir savol uchun "explanation" — qisqa izoh yoz (1-2 sentences explanation).

Faqat quyidagi JSON formatda javob ber (Respond ONLY in JSON):
{
  "questions": [
    {
      "text": "Question text?",
      "options": ["variant0", "variant1", "variant2", "variant3"],
      "correctOptions": [correct_index],
      "explanation": "Explanation here..."
    }
  ]
}`;

    const systemPrompt =
        language === 'ru'
            ? "Вы — профессиональный ИИ-ассистент по созданию образовательных тестов. Вы отвечаете СТРОГО на РУССКОМ языке. Выдавайте результат ТОЛЬКО в формате JSON, используя только стандартные двойные кавычки (\"), без дополнительного текста."
            : language === 'en'
                ? "You are a professional educational test generator AI assistant. You answer STRICTLY in ENGLISH. Output ONLY valid JSON using standard double quotes (\"), with absolutely no markdown or surrounding text."
                : "Sen ta'lim sohasida mukammal test savollari tuzuvchi AI yordamchisisiz. Faqat so'ralgan JSON formatda javob ber, doim standart qo'shtirnoq (\") ishlating („“ ishlatmang).";

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 3500, // increased max tokens to allow for 30 questions
        });

        const raw = completion.choices[0]?.message?.content || '';

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: "AI javob formati noto'g'ri" }, { status: 500 });
        }

        let jsonString = jsonMatch[0];
        // Replace typographic smart quotes which break JSON.parse
        jsonString = jsonString.replace(/[„“”]/g, '"');

        const parsed = JSON.parse(jsonString);

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
