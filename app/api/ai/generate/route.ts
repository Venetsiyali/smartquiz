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
            ? "Generate all content strictly in O'zbek language."
            : language === 'ru'
                ? "Generate all content strictly in Russian language."
                : "Generate questions strictly in English.";

    const systemPrompt = `Role: You are the "Zukkoo AI Content Engine," a sophisticated educational tool designed for the Zukkoo.uz platform. Your task is to generate high-quality, engaging, and pedagogically sound questions for 6 specific game modes.
Language Rule: You MUST detect the requested language (${language}) and generate all content strictly in that language.
Game Specifications:
Quiz Arena (Classic): 1 question, 4 options (A, B, C, D), 1 correct answer index.
Logic Chain (Sorting): Arrange 4-6 concepts in a logical or chronological sequence.
Battle of Terms (Matching): Pair 5-8 terms with their correct definitions.
Blitz-Watch (True/False): Quick assertions where the user must decide if it's "True" or "False".
Hidden Code (Anagrams): 1 key term with 1 helpful hint.
Team Rescue (Advanced): High-difficulty quiz questions for collaborative solving.

Format Requirements:
Output ONLY valid JSON using standard double quotes ("). No markdown or explanations outside JSON.`;

    const prompt = `${langInstruction}

Topic: "${topic}"
Generate ${count} questions.

STRICT RULES:
1. Mix correct answer positions.
2. Plausible distractors.
3. Challenging questions.
4. 1-2 sentences explanation.

Respond ONLY in JSON:
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
