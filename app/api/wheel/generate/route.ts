import { NextResponse } from 'next/server';
import { requireTeacherId } from '@/lib/wheel/authz';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { callLLM } from '@/lib/llm/pool';
import { isProviderId } from '@/lib/llm/providers';
import { extractJsonArray } from '@/lib/llm/json';
import { shuffle } from '@/lib/shuffle';
import { WheelGenerateBodySchema, WheelAIQuestionSchema } from '@/lib/wheel/schema';
import { OPTION_BALANCE_RULES, pickBalanced, withBalanceBuffer } from '@/lib/questionQuality';
import { getFallbackQuestions, fallbackNotice, saveGeneratedToBank } from '@/lib/questionBank/bank';
import { parseDifficulty, parseGrade } from '@/lib/questionBank/subjects';

export const maxDuration = 60;

const generateLimiter = rateLimit({ windowMs: 60 * 60_000, max: 30 });

const SYSTEM_PROMPT = `Siz Zukkoo.uz platformasining bosh pedagogik muhandisisiz. "Bilimlar g'ildiragi" o'yini uchun test savollari yaratasiz.
Faqat JSON massiv qaytaring. Hech qanday kirish so'zi, markdown yoki qo'shimcha matn yozmang.

QOIDALAR:
1. Foydalanuvchi so'ragan sondagi savolni AYNAN shuncha yarating.
2. Har bir savolda 4 ta variant bo'lsin, ulardan faqat bittasi to'g'ri.
3. Noto'g'ri variantlar ishonchli, ammo aniq noto'g'ri bo'lsin. "Hech biri" kabi qochish variantlaridan foydalanmang.
4. Har bir savol uchun "explanation" — nega bu javob to'g'ri ekanini 1-2 jumlada tushuntiring.
5. O'zbek tili grammatikasiga 100% amal qiling, agar boshqa til so'ralsa o'sha til qoidalariga rioya qiling.

${OPTION_BALANCE_RULES}

JSON sxemasi (massiv):
[{"question":"Savol matni?","options":["Variant A","Variant B","Variant C","Variant D"],"correctIndex":2,"explanation":"To'g'ri javob izohi."}]`;

const AI_BUDGET_MS = 40_000;

export async function POST(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const limitCheck = generateLimiter(ip);
    if (!limitCheck.success) {
        return NextResponse.json({ error: `Juda ko'p so'rov. ${Math.ceil(limitCheck.retryAfter / 60)} daqiqadan so'ng urinib ko'ring.` }, { status: 429 });
    }

    const parsedBody = WheelGenerateBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsedBody.success) {
        return NextResponse.json({ error: 'Mavzu kiriting (kamida 2 ta belgi)' }, { status: 400 });
    }
    const { topic, grade, count, difficulty, provider } = parsedBody.data;
    const gradeNum = parseGrade(grade);
    const difficultyNum = parseDifficulty(difficulty);

    const gradeLine = grade ? `Sinf/daraja: ${grade}.` : '';
    const requestCount = withBalanceBuffer(count);
    const userPrompt = `Mavzu: "${topic}". ${gradeLine} Qiyinlik darajasi: ${difficulty}.
DIQQAT: Qat'iy ravishda AYNAN ${requestCount} ta savol yarating! Massiv uzunligi aniq ${requestCount} ga teng bo'lishi SHART!`;

    const startTime = Date.now();
    const skip: string[] = [];

    for (let attempt = 0; attempt < 2; attempt++) {
        let result;
        try {
            result = await callLLM({
                system: SYSTEM_PROMPT,
                user: userPrompt,
                preferred: isProviderId(provider) ? provider : undefined,
                budgetMs: AI_BUDGET_MS - (Date.now() - startTime),
                skip,
            });
        } catch (err: any) {
            console.warn('[Wheel Generate] AI mavjud emas:', err?.message);
            break;
        }

        const normalized = (() => {
            try {
                return extractJsonArray(result.text).map((q: any) => {
                    const opts: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
                    const correctText = opts[q.correctIndex ?? 0];
                    const shuffled = shuffle(opts);
                    return {
                        question: q.question || q.text || '',
                        options: shuffled,
                        correctIndex: shuffled.indexOf(correctText),
                        explanation: q.explanation || '',
                    };
                });
            } catch {
                return null;
            }
        })();

        const valid = (normalized ?? []).flatMap(q => {
            const r = WheelAIQuestionSchema.safeParse(q);
            return r.success ? [r.data] : [];
        });
        if (valid.length === 0) {
            skip.push(`${result.provider}/${result.model}`);
            console.warn(`[Wheel Generate] ${result.provider}/${result.model} yaroqsiz JSON qaytardi`);
            continue;
        }

        const questions = pickBalanced(valid, count, q => q);
        await saveGeneratedToBank(
            questions.map(q => ({ text: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })),
            { topic, grade: gradeNum, difficulty: difficultyNum },
        );
        return NextResponse.json({ questions, source: 'ai' });
    }

    // AI ishlamadi — tayyor savollar omboridan
    try {
        const bank = await getFallbackQuestions({ topic, count, grade: gradeNum, difficulty: difficultyNum });
        if (bank.questions.length > 0) {
            return NextResponse.json({
                questions: bank.questions.map(q => ({ question: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })),
                source: 'bank',
                fallback: true,
                notice: fallbackNotice(bank),
            });
        }
    } catch (err: any) {
        console.warn('[Wheel Generate] ombordan olishda xato:', err?.message);
    }

    return NextResponse.json({ error: "AI hozircha javob bermayapti va omborda mos savol topilmadi. Birozdan so'ng qayta urinib ko'ring yoki savollarni qo'lda kiriting." }, { status: 503 });
}
