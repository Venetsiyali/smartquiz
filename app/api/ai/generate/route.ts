import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { prisma } from '@/lib/prisma';

// ─── Fisher-Yates shuffle ────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Levenshtein distance ────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function similarityScore(a: string, b: string): number {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;
    return 1 - levenshtein(s1, s2) / maxLen;
}

// ─── Topic Shuffler — keng kategoriyalarni quyi mavzularga yo'naltiradi ──────
const TOPIC_NICHES: Record<string, string[]> = {
    tarix: ["O'rta asrlar davri", "Qadimgi sivilizatsiyalar", "Buyuk kashfiyotlar va sayohatchilar",
        "Inqiloblar va urushlar", "Buyuk imperiyalar", "O'zbekiston tarixi", "Ikkinchi Jahon urushi",
        "Renessans davri", "Mustaqillik harakatlari", "Buyuk ipak yo'li"],
    matematika: ["Algebra va tenglamalar", "Geometriya va shakllar", "Arifmetika amallar",
        "Trigonometriya", "Ehtimollar nazariyasi", "Statistika va grafiklar", "Sonlar nazariyasi"],
    biologiya: ["Hujayra biologiyasi", "Genetika va irsiyat", "Evolyutsiya nazariyasi",
        "Ekotizimlar va ekologiya", "Inson anatomiyasi", "O'simliklar fiziologiyasi",
        "Mikrobiologiya", "Genetik muhandislik"],
    fizika: ["Mexanika va harakat", "Elektr va magnit", "Optika va yorug'lik",
        "Termodinamika", "Kvant fizikasi", "Nisbiylik nazariyasi", "Yadro fizikasi"],
    kimyo: ["Organik kimyo", "Anorganik birikmalar", "Kimyoviy reaksiyalar",
        "Davriy jadval", "Elektrolitlar va kislotalar", "Polimer kimyo"],
    geografiya: ["Materiklar va okeanlar", "Iqlim va ob-havo", "Tabiat zonalari",
        "Aholishunoslik", "Iqtisodiy geografiya", "O'zbekiston geografiyasi"],
    informatika: ["Algoritmlar va dasturlash", "Ma'lumotlar tuzilmasi", "Tarmoqlar va internet",
        "Sun'iy intellekt", "Kiberhavfsizlik", "Ma'lumotlar bazasi", "Veb-texnologiyalar"],
    adabiyot: ["O'zbek klassik adabiyoti", "Jahon adabiyoti", "She'riyat va janrlar",
        "Yozuvchilar tarjimai holi", "Adabiy tahlil", "Folklor va dostonlar"],
    ingliz: ["Grammar and tenses", "Vocabulary and idioms", "British literature",
        "American English vs British English", "Phrasal verbs", "Academic writing"],
    rus: ["Русская классическая литература", "Грамматика русского языка", "Великие писатели",
        "История России", "Фразеологизмы", "Лексика и словообразование"],
};

function pickTopicNiche(topic: string): string {
    const key = Object.keys(TOPIC_NICHES).find(k =>
        topic.toLowerCase().includes(k) || k.includes(topic.toLowerCase())
    );
    if (!key) return topic;
    const niches = TOPIC_NICHES[key];
    return niches[Math.floor(Math.random() * niches.length)];
}

// ─── JSON extractor ──────────────────────────────────────────────────────────
function extractJson(raw: string): any {
    let text = raw.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();
    const start = text.indexOf('{');
    if (start === -1) throw new Error('JSON topilmadi');
    let depth = 0, inString = false, escape = false, end = -1;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) throw new Error('JSON yopilmagan');
    let jsonStr = text.slice(start, end + 1)
        .replace(/[\u201c\u201d\u201e\u00ab\u00bb]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(jsonStr);
}

// ─── DB dan mavjud savollarni olish ─────────────────────────────────────────
async function fetchExistingQuestions(topic: string, gameType: string): Promise<string[]> {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: {
                title: { contains: topic, mode: 'insensitive' },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { questions: true },
        });

        const texts: string[] = [];
        for (const quiz of quizzes) {
            const qs = quiz.questions as any[];
            if (!Array.isArray(qs)) continue;
            for (const q of qs) {
                const text = q.text || q.statement || q.word || '';
                if (text && text.length > 5) texts.push(text);
                if (texts.length >= 50) break;
            }
            if (texts.length >= 50) break;
        }
        return texts;
    } catch {
        // DB xatoligi bo'lsa, himoya mexanizmi ishlamasligini ta'minlaymiz
        return [];
    }
}

// ─── Base system prompt ──────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `# ROLE: ELITE EDUCATIONAL ARCHITECT
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
1. classic/multiple/team → Savol + 4 variant, 1 to'g'ri javob. correctOptions: [indeks]. hint majburiy.
2. truefalse → "isTrue": true/false. Biroz o'ylantiradigan tasdiqlar. hint majburiy.
3. order → "items": [...] massivida elementlar TO'G'RI tartibda joylashtirilsin. hint majburiy.
4. match → "pairs": [{term, definition}] kamida 6 juft. Izohlar qisqa (max 10 so'z). hint majburiy.
5. anagram → "word": "KATTA_HARF", "hint": "Qisqa ishora". Faqat ilmiy/texnik terminlar.

# OUTPUT STRUCTURE
Har bir savol uchun quyidagi qo'shimcha maydonni kiriting:
- "hint": To'g'ri javobni emas, to'g'ri yo'lni ko'rsatuvchi ishora (1 jumla)`;

// ─── Dynamic system prompt builder ──────────────────────────────────────────
function buildSystemPrompt(excludedTexts: string[]): string {
    if (excludedTexts.length === 0) return BASE_SYSTEM_PROMPT;

    // Oxirgi 30 ta eng qisqa, ixcham qilib olamiz (token tejash uchun)
    const sample = excludedTexts.slice(0, 30).map((t, i) => `${i + 1}. ${t.slice(0, 80)}`).join('\n');
    return `${BASE_SYSTEM_PROMPT}

# TAKRORLANISHDAN HIMOYA (MUHIM!)
Quyidagi savollar allaqachon berilgan. Bu mavzular, faktlar yoki o'xshash tuzilmadagi savollarni ASLO takrorlamang.
Mavzuning boshqa jihatlariga (boshqa shaxslar, sanalar, sabab-oqibat munosabatlari, kamroq ma'lum faktlar) e'tibor qarating:
${sample}`;
}

// ─── Per-game-type user prompt builder ──────────────────────────────────────
function buildPrompt(topic: string, gameType: string, count: number, language: string): string {
    const lang = language === 'uz' ? "O'zbek tilida" : language === 'ru' ? 'na russkom yazyke' : 'in English';

    switch (gameType) {
        case 'multiple':
        case 'classic':
        case 'team':
            return `${lang}. Mavzu: "${topic}". ${count} ta klassik test savoli tuz.
Qoidalar: to'g'ri javob 1 ta, qolgan 3 variant ishonchli ammo noto'g'ri bo'lsin. Trivial savollardan qoching. Sabab-oqibat, tahlil ko'nikmalarini sinang.
JSON sxemasi:
{"questions":[{"text":"Savol?","options":["Variant A","Variant B","Variant C","Variant D"],"correctOptions":[2],"hint":"Bir jumla ishora"}]}`;

        case 'truefalse':
            return `${lang}. Mavzu: "${topic}". ${count} ta Ha/Yo'q (True/False) savol tuz.
Qoidalar: (1) Tasdiqlarning yarmi TRUE, yarmi FALSE bo'lsin. (2) FALSE tasdiqlar bir asosiy faktni noto'g'ri ko'rsatsin. (3) Savollar biroz o'ylantirsin.
JSON sxemasi:
{"questions":[{"text":"Aniq tasdiq gap.","isTrue":true,"hint":"Bir jumla ishora"}]}`;

        case 'blitz':
            return `${lang}. Mavzu: "${topic}". ${count} ta BLITZ uslubida To'g'ri/Noto'g'ri savol tuz.
Qoidalar: (1) Har bir tasdiq qisqa va aniq bo'lsin. (2) FALSE tasdiqlar bir asosiy faktni noto'g'ri ko'rsatsin. (3) Tasdiqlarning yarmi TRUE, yarmi FALSE bo'lsin.
JSON sxemasi:
{"questions":[{"text":"Qisqa tasdiq gap.","isTrue":true,"hint":"Bir jumla ishora"}]}`;

        case 'order':
            return `${lang}. Mavzu: "${topic}". ${count} ta mantiqiy tartib (Sorting) topshirig'i tuz.
Qoidalar: (1) Har biri uchun 4-5 element bering. (2) Elementlar items massivida TO'G'RI tartibda bo'lishi shart. (3) Xronologik yoki sabab-oqibat zanjirlarini ishlating.
JSON sxemasi:
{"questions":[{"text":"Quyidagi jarayonni to'g'ri tartibga soling:","items":["1-bosqich","2-bosqich","3-bosqich","4-bosqich"],"hint":"Bir jumla yo'naltiruvchi ishora"}]}`;

        case 'match':
            return `${lang}. Mavzu: "${topic}". ${count} ta moslik (Matching) to'plami tuz.
Qoidalar: (1) Har to'plamda 6 ta juft bo'lsin. (2) term — qisqa atama yoki nom (max 3 so'z). (3) definition — 5-10 so'zli aniq ta'rif. (4) Juftlar o'zaro aralashib ketmasin.
JSON sxemasi:
{"questions":[{"text":"Ushbu atamalarni ta'riflari bilan moslang:","pairs":[{"term":"Atama 1","definition":"Aniq ta'rif 1"},{"term":"Atama 2","definition":"Aniq ta'rif 2"},{"term":"Atama 3","definition":"Aniq ta'rif 3"},{"term":"Atama 4","definition":"Aniq ta'rif 4"},{"term":"Atama 5","definition":"Aniq ta'rif 5"},{"term":"Atama 6","definition":"Aniq ta'rif 6"}],"hint":"Bir jumla ishora"}]}`;

        case 'anagram':
            return `${lang}. Mavzu: "${topic}". ${count} ta yashirin so'z (Anagram) topshirig'i tuz.
Qoidalar: (1) FAQAT texnik/ilmiy terminlar. (2) So'z uzunligi 5–10 harf. (3) hint — so'zning sohasi yoki funksiyasini bildiruvchi ishora. (4) So'z katta harfda, faqat lotin harflari.
JSON sxemasi:
{"questions":[{"word":"ALGORITM","hint":"Muammoni hal qilish uchun qadamba-qadam yo'riqnoma"},{"word":"KOMPILER","hint":"Dastur kodini mashina tiliga o'giruvchi dastur"}]}`;

        default:
            return `${lang}. Mavzu: "${topic}". ${count} ta klassik test savoli tuz.
{"questions":[{"text":"Savol?","options":["A","B","C","D"],"correctOptions":[2],"hint":""}]}`;
    }
}

// ─── Response normalizer ─────────────────────────────────────────────────────
function normalizeQuestions(parsed: any, gameType: string, timeLimit: number): any[] {
    const raw = parsed.questions || parsed.pairs || parsed.items || [];
    if (!Array.isArray(raw)) return [];

    switch (gameType) {
        case 'truefalse':
        case 'blitz':
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
            return raw.map((q: any) => ({
                text: q.text || q.question || 'Moslang:',
                options: [],
                correctOptions: [],
                pairs: (q.pairs || []).map((p: any) => ({
                    term: p.term || '',
                    definition: p.definition || '',
                })),
                hint: q.hint || '',
                learning_objective: q.learning_objective || '',
                timeLimit,
            }));

        case 'anagram':
            return raw.map((q: any) => ({
                text: q.hint || q.clue || '',
                options: [(q.word || '').toUpperCase().trim()],
                correctOptions: [],
                learning_objective: q.learning_objective || '',
                timeLimit,
            }));

        default:
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

// ─── Levenshtein filtr: 80%+ o'xshash savollarni chiqaradi ──────────────────
function filterDuplicates(newQuestions: any[], existingTexts: string[]): any[] {
    if (existingTexts.length === 0) return newQuestions;
    return newQuestions.filter(q => {
        const qText = (q.text || '').trim();
        if (!qText) return true;
        const maxSim = existingTexts.reduce((max, existing) => {
            const score = similarityScore(qText, existing);
            return score > max ? score : max;
        }, 0);
        return maxSim < 0.80; // 80% dan kam o'xshashlik — qabul qilinadi
    });
}

// ─── Retry-after extractor ───────────────────────────────────────────────────
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

// ─── API Key Pool helpers ─────────────────────────────────────────────────────
function getKeys(envVar: string | undefined, fallback: string | undefined): string[] {
    const multi = envVar?.split(',').map(k => k.trim()).filter(Boolean);
    if (multi && multi.length > 0) return multi;
    if (fallback) return [fallback];
    return [];
}

async function callGemini(key: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY valid JSON. No markdown wrappers.` }] }],
                generationConfig: { temperature: 0.85, responseMimeType: 'application/json' },
            }),
        }
    );
    if (!res.ok) {
        const body = await res.text();
        const err: any = new Error(`Gemini xatosi: ${res.status}`);
        err.status = res.status;
        err.details = body;
        throw err;
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(key: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const client = new Groq({ apiKey: key });
    const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        top_p: 1,
        max_tokens: 4096,
    });
    return completion.choices[0]?.message?.content || '';
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const { topic, count = 5, language = 'uz', gameType = 'multiple', timeLimit = 20, provider = 'groq' } = await req.json();

    if (!topic || topic.trim().length < 2) {
        return NextResponse.json({ error: 'Mavzu kiriting (kamida 2 ta belgi)' }, { status: 400 });
    }

    // 1. Topic Shuffler: keng kategoriya bo'lsa, quyi bo'limga yo'naltirish
    const enrichedTopic = pickTopicNiche(topic.trim());

    // 2. DB dan mavjud savollarni olish (parallel, bloklamaydi)
    const existingTexts = await fetchExistingQuestions(topic.trim(), gameType);

    // 3. Dynamic system prompt — excluded context bilan
    const systemPrompt = buildSystemPrompt(existingTexts);
    const userPrompt = buildPrompt(enrichedTopic, gameType, count, language);

    // ─── Multi-Key Pool setup ───────────────────────────────────────────────
    const geminiKeys = getKeys(process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY);
    const groqKeys   = getKeys(process.env.GROQ_API_KEYS,   process.env.GROQ_API_KEY);

    // Build ordered list of (provider, key) pairs to try — chosen provider first
    type ProviderKey = { provider: 'gemini' | 'groq'; key: string };
    const primaryList:   ProviderKey[] = (provider === 'gemini' ? geminiKeys : groqKeys).map(k => ({ provider: provider as 'gemini'|'groq', k })).map(({provider, k}) => ({provider, key: k}));
    const fallbackList:  ProviderKey[] = (provider === 'gemini' ? groqKeys   : geminiKeys).map(k => ({ provider: provider === 'gemini' ? 'groq' : 'gemini', key: k }));
    const allCandidates: ProviderKey[] = [...primaryList, ...fallbackList];

    let lastError = '';

    for (let ci = 0; ci < allCandidates.length; ci++) {
        const { provider: cur, key } = allCandidates[ci];
        // On retry (ci > 0), pick a fresh niche for variety
        const currentTopic      = ci === 0 ? enrichedTopic : pickTopicNiche(topic.trim());
        const currentUserPrompt = ci === 0 ? userPrompt    : buildPrompt(currentTopic, gameType, count, language);

        try {
            let raw = '';
            if (cur === 'gemini') {
                raw = await callGemini(key, systemPrompt, currentUserPrompt);
            } else {
                raw = await callGroq(key, systemPrompt, currentUserPrompt);
            }

            const parsed    = extractJson(raw);
            const questions = normalizeQuestions(parsed, gameType, timeLimit);

            if (!questions || questions.length === 0) {
                lastError = "AI savollarni to'g'ri formatlamadi";
                continue;
            }

            const filtered       = filterDuplicates(questions, existingTexts);
            const finalQuestions = filtered.length >= Math.ceil(questions.length / 2) ? filtered : questions;

            return NextResponse.json({ questions: finalQuestions, gameType });
        } catch (err: any) {
            const status = err?.status ?? 0;
            const isRateLimit = status === 429 || (err?.message && err.message.includes('429'));

            if (isRateLimit) {
                // Try next key / provider
                console.warn(`[AI Pool] ${cur} key #${ci} rate-limited — trying next...`);
                lastError = err?.message || 'Rate limited';
                continue;
            }

            // Non-rate-limit error — log and try next
            lastError = err?.message || 'AI xatoligi';
            console.error(`[AI Pool] ${cur} key #${ci} failed:`, err?.message || err);
        }
    }

    return NextResponse.json({ error: lastError }, { status: 500 });
}
