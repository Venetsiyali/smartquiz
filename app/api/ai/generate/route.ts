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

function extractJson(raw: string): any {
    // Remove markdown code blocks if present
    let cleaned = raw.trim();
    const mdMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (mdMatch) cleaned = mdMatch[1].trim();
    // Extract first JSON object
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!objMatch) throw new Error("JSON topilmadi");
    // Fix common smart-quote issues
    return JSON.parse(objMatch[0].replace(/[„""]/g, '"'));
}

// ─── System prompt - Zukkoo Elite Educational Architect ─────────────────────
const SYSTEM_PROMPT = `# ROLE: ELITE EDUCATIONAL ARCHITECT
Siz Zukkoo.uz platformasining bosh pedagogik muhandisisiz. Vazifangiz — o'quvchilarning tanqidiy fikrlashini o'stiradigan, akademik jihatdan aniq va metodik jihatdan to'g'ri bo'lgan kontent yaratish.
Faqat JSON formatida javob bering. Hech qanday kirish so'zi, markdown yoki qo'shimcha matn yozmang.

# PEDAGOGICAL GUIDELINES
1. Accuracy First: Savollar ilmiy manbalarga va darsliklarga asoslangan bo'lishi shart. Noaniq yoki munozarali faktlardan qoching.
2. Growth Mindset: Savollar o'quvchini qidirishga, tahlil qilishga undashi kerak.
3. Language: O'zbek tili grammatikasi va imlo qoidalariga 100% amal qiling. Til sodda, lekin ilmiy saviyada bo'lsin. Agar boshqa til so'ralsa, o'sha tilning standartlariga to'liq rioya qiling.
4. Depth over Breadth: Shunchaki yillarni yoki nomlarni so'ramang — jarayonlarning sabab va oqibatlarini so'raydigan savollarga urg'u bering.

# BANNED CONTENT
- Siyosiy, diniy, etikaga zid yoki ta'limga aloqasiz (shou-biznes va h.k.) mavzularni aralashtirmang.
- Savollarda "Hech biri", "Hamma javob to'g'ri" kabi oson qochish yo'llarini ishlatmang.
- Variantlarni boshida "A)", "B)" kabi harflar bilan boshlamang.

# GAME TYPE RULES (qat'iy bajarish shart)
1. classic/multiple/team → Savol + 4 variant, 1 to'g'ri javob. correctOptions: [indeks]. hint va explanation majburiy.
2. truefalse → "isTrue": true/false. Biroz o'ylantiradigan tasdiqlar. hint va explanation majburiy.
3. order → "items": [...] massivida elementlar TO'G'RI tartibda joylashtirilsin. hint majburiy.
4. match → "pairs": [{term, definition}] kamida 6 juft. Izohlar qisqa (max 10 so'z). hint majburiy.
5. anagram → "word": "KATTA_HARF", "hint": "Qisqa ishora". Faqat ilmiy/texnik terminlar.

# OUTPUT STRUCTURE
Har bir savol uchun quyidagi qo'shimcha maydonlarni ham kiriting:
- "learning_objective": Bu savol o'quvchiga nimani o'rgatadi? (1 jumla)
- "hint": To'g'ri javobni emas, to'g'ri yo'lni ko'rsatuvchi ishora (1 jumla)
- "explanation": Savol yechilgandan keyin chiqadigan chuqurroq tushuntirish (2-3 jumla)`;

// ─── Per-game-type user prompt builder ──────────────────────────────────────
function buildPrompt(topic: string, gameType: string, count: number, language: string): string {
    const lang = language === 'uz' ? "O'zbek tilida" : language === 'ru' ? 'na russkom yazyke' : 'in English';

    switch (gameType) {
        case 'multiple':
        case 'classic':
        case 'team':
            return `${lang}. Mavzu: "${topic}". ${count} ta klassik test savoli tuz.
JSON sxemasi:
{"questions":[{"text":"Savol?","options":["A","B","C","D"],"correctOptions":[2],"explanation":"Izoh..."}]}`;

        case 'truefalse':
            return `${lang}. Mavzu: "${topic}". ${count} ta Ha/Yo'q (True/False) savol tuz. Savollar biroz o'ylantiradigan bo'lsin.
JSON sxemasi:
{"questions":[{"text":"Tasdiq gap.","isTrue":true,"explanation":"Izoh..."}]}`;

        case 'order':
            return `${lang}. Mavzu: "${topic}". ${count} ta mantiqiy tartib (Sorting) topshirig'i tuz. Har biri uchun 4-6 element bering. Elementlar items massivida TO'G'RI tartibda bo'lishi shart.
JSON sxemasi:
{"questions":[{"text":"Quyidagilarni to'g'ri tartibga soling:","items":["1-qadam","2-qadam","3-qadam","4-qadam"]}]}`;

        case 'match':
            return `${lang}. Mavzu: "${topic}". ${count} ta moslik (Matching) to'plami tuz. Har to'plamda kamida 6 ta term-definition juftligi bo'lsin. Izohlar qisqa va aniq bo'lsin (max 10 so'z).
JSON sxemasi:
{"questions":[{"text":"Ushbu atamalarni ta'riflari bilan moslang:","pairs":[{"term":"Atama","definition":"Ta'rifi"}]}]}`;

        case 'anagram':
            return `${lang}. Mavzu: "${topic}". ${count} ta yashirin so'z (Anagram) topshirig'i tuz. Faqat texnik/ilmiy terminlar ishlat. So'z katta harfda.
JSON sxemasi:
{"questions":[{"word":"ALGORITM","hint":"Dasturning mantiqiy ketma-ketligi"}]}`;

        default:
            return `${lang}. Mavzu: "${topic}". ${count} ta klassik test savoli tuz.
{"questions":[{"text":"Savol?","options":["A","B","C","D"],"correctOptions":[2],"explanation":""}]}`;
    }
}

// ─── Response normalizer: AI raw → platform Question format ─────────────────
function normalizeQuestions(parsed: any, gameType: string, timeLimit: number): any[] {
    const raw = parsed.questions || parsed.pairs || parsed.items || [];
    if (!Array.isArray(raw)) return [];

    switch (gameType) {
        case 'truefalse':
            return raw.map((q: any) => ({
                text: q.text || q.statement || '',
                options: ["To'g'ri ✅", "Noto'g'ri ❌"],
                correctOptions: [q.isTrue === true ? 0 : 1],
                explanation: q.explanation || q.detailed_explanation || '',
                hint: q.hint || '',
                learning_objective: q.learning_objective || '',
                timeLimit,
            }));

        case 'order':
            return raw.map((q: any) => {
                const items: string[] = q.items || [];
                return {
                    text: q.text || q.question || 'Tartibga soling:',
                    options: items,
                    correctOptions: items.map((_: any, i: number) => i),
                    hint: q.hint || '',
                    learning_objective: q.learning_objective || '',
                    timeLimit,
                };
            });

        case 'match':
            return raw.map((q: any) => {
                const pairs = q.pairs || [];
                return {
                    text: q.text || q.question || 'Moslang:',
                    options: [],
                    correctOptions: [],
                    pairs: pairs.map((p: any) => ({
                        term: p.term || '',
                        definition: p.definition || '',
                    })),
                    hint: q.hint || '',
                    learning_objective: q.learning_objective || '',
                    timeLimit,
                };
            });

        case 'anagram':
            return raw.map((q: any) => ({
                text: q.hint || q.clue || '',
                options: [(q.word || '').toUpperCase().trim()],
                correctOptions: [],
                learning_objective: q.learning_objective || '',
                timeLimit,
            }));

        default: // classic, multiple, team
            return raw.map((q: any) => {
                const opts: string[] = q.options || [];
                const correctIdxs: number[] = q.correctOptions ?? (q.correctIndex !== undefined ? [q.correctIndex] : [0]);
                const correctTexts = new Set(correctIdxs.map((i: number) => opts[i]));
                const shuffled = shuffle(opts);
                const newCorrect = shuffled.map((o, i) => correctTexts.has(o) ? i : -1).filter(i => i !== -1);
                return {
                    text: q.text || q.question || '',
                    options: shuffled,
                    correctOptions: newCorrect.length > 0 ? newCorrect : [0],
                    explanation: q.explanation || q.detailed_explanation || '',
                    hint: q.hint || '',
                    learning_objective: q.learning_objective || '',
                    timeLimit,
                };
            });
    }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const { topic, count = 5, language = 'uz', gameType = 'multiple', timeLimit = 20 } = await req.json();

    if (!topic || topic.trim().length < 2) {
        return NextResponse.json({ error: 'Mavzu kiriting (kamida 2 ta belgi)' }, { status: 400 });
    }

    const userPrompt = buildPrompt(topic, gameType, count, language);

    let lastError = '';
    // Retry up to 2 times for robustness
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.65,
                max_tokens: 4096,
            });

            const raw = completion.choices[0]?.message?.content || '';
            const parsed = extractJson(raw);
            const questions = normalizeQuestions(parsed, gameType, timeLimit);

            if (!questions || questions.length === 0) {
                lastError = "AI savollarni to'g'ri formatlamadi";
                continue;
            }

            return NextResponse.json({ questions, gameType });
        } catch (err: any) {
            lastError = err?.message || 'AI xatoligi';
            console.error(`AI attempt ${attempt + 1} failed:`, err);
        }
    }

    return NextResponse.json({ error: lastError }, { status: 500 });
}
