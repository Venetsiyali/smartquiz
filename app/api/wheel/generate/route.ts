import { NextResponse } from 'next/server';
import { requireTeacherId } from '@/lib/wheel/authz';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { callAIPool, extractJsonArray, shuffle } from '@/lib/wheel/aiPool';
import { WheelGenerateBodySchema, WheelAIQuestionListSchema } from '@/lib/wheel/schema';
import { OPTION_BALANCE_RULES, pickBalanced, withBalanceBuffer } from '@/lib/questionQuality';

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

    const gradeLine = grade ? `Sinf/daraja: ${grade}.` : '';
    const requestCount = withBalanceBuffer(count);
    const userPrompt = `Mavzu: "${topic}". ${gradeLine} Qiyinlik darajasi: ${difficulty}.
DIQQAT: Qat'iy ravishda AYNAN ${requestCount} ta savol yarating! Massiv uzunligi aniq ${requestCount} ga teng bo'lishi SHART!`;

    try {
        const raw = await callAIPool(SYSTEM_PROMPT, userPrompt, provider);
        const rawArr = extractJsonArray(raw);

        const normalized = rawArr.map((q: any) => {
            const opts: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
            while (opts.length < 4) opts.push('—');
            const correctText = opts[q.correctIndex ?? 0];
            const shuffled = shuffle(opts);
            const newCorrectIndex = shuffled.indexOf(correctText);
            return {
                question: q.question || q.text || '',
                options: shuffled,
                correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
                explanation: q.explanation || '',
            };
        });

        const validated = WheelAIQuestionListSchema.safeParse(normalized);
        if (!validated.success) {
            return NextResponse.json({ error: "AI savollarni to'g'ri formatlamadi, qayta urinib ko'ring" }, { status: 502 });
        }

        return NextResponse.json({ questions: pickBalanced(validated.data, count, q => q) });
    } catch (err: any) {
        console.error('[Wheel Generate] xatolik:', err?.message);
        return NextResponse.json({ error: "AI hozircha javob bermayapti. Birozdan so'ng qayta urinib ko'ring." }, { status: 503 });
    }
}
