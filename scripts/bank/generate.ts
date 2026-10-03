// Savollar omborini taksonomiya bo'yicha AI orqali to'ldiradi. Natija PENDING holatida yoziladi —
// o'yinga chiqishi uchun `npm run bank:verify` dan o'tishi kerak.
//
// Ishga tushirish:
//   npm run bank:generate -- --limit=300                  (shu ishga tushirishda ko'pi bilan 300 ta yangi savol)
//   npm run bank:generate -- --target=30 --subjects=Fizika,Kimyo
//
// Holat bazada saqlanadi: qayta ishga tushirilsa, faqat to'lmagan kataklar (fan × mavzu × qiyinlik) to'ldiriladi.
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { prisma } from '@/lib/prisma';
import { callLLM, configuredProviderIds, LLMUnavailableError } from '@/lib/llm/pool';
import { extractJsonArray } from '@/lib/llm/json';
import { OPTION_BALANCE_RULES, qualityIssues, similarityScore } from '@/lib/questionQuality';
import { contentHash } from '@/lib/questionBank/bank';
import { shuffle } from '@/lib/shuffle';
import { TAXONOMY, type TaxonomyTopic } from '@/lib/questionBank/taxonomy';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
}));
const LIMIT = parseInt(args.limit ?? '200', 10);
const TARGET = parseInt(args.target ?? '15', 10);
const BATCH = parseInt(args.batch ?? '10', 10);
const SUBJECTS = args.subjects ? args.subjects.split(',').map((s: string) => s.trim()) : null;

const DIFFICULTY_LABEL: Record<number, string> = {
    1: "oson — asosiy tushuncha va ta'riflarni bilish",
    2: "o'rta — tushunish va qo'llash, oddiy misol yoki hisob",
    3: "qiyin — tahlil, sabab-oqibat, ko'p bosqichli fikrlash",
};

const SYSTEM_PROMPT = `Siz O'zbekiston maktablari uchun test savollari tuzadigan tajribali o'qituvchisiz. Faqat JSON massiv qaytaring, boshqa hech narsa yozmang.

QOIDALAR:
1. Faktlar aniq va maktab darsliklariga mos bo'lsin. Shubhali, munozarali yoki tekshirib bo'lmaydigan faktlardan qoching.
2. Har bir savolda 4 ta variant, faqat bittasi to'g'ri. "Hech biri", "Hammasi", "A va B", "Ikkalasi" kabi variantlar TAQIQLANADI.
3. Variantlar boshida harf yoki raqam (A), 1.) bo'lmasin.
4. Savol mustaqil tushunarli bo'lsin — rasm, jadval yoki matnga tayanmasin.
5. "explanation" — nega bu javob to'g'ri ekanini 1-2 jumlada tushuntiring. "hint" — javobni aytmasdan yo'naltiruvchi 1 jumla.
6. O'zbek lotin imlosiga to'liq amal qiling. Sodda, to'g'ri o'zbekcha gaplar tuzing; mavjud bo'lmagan so'z yoki uydirma atama ishlatmang.
7. Ism va atamalarni o'zbekcha shaklda yozing ("Botuxon", "Amir Temur" — "Batu Khan", "Tamerlan" emas). Ingliz tili fanidan tashqari inglizcha so'z ishlatmang.
8. Faqat BITTA variant to'g'ri bo'lsin: noto'g'ri variantlar qisman yoki boshqa ta'rifda ham to'g'ri bo'lib qolmasin.
9. Biror faktga ishonchingiz komil bo'lmasa — o'sha savolni umuman yozmang, boshqa savol tuzing.
10. Savollar mavzuning TURLI jihatlarini qamrab olsin, bir-birini takrorlamasin.

${OPTION_BALANCE_RULES}

JSON sxemasi:
[{"question":"Savol matni?","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","hint":"..."}]`;

interface Cell extends TaxonomyTopic { difficulty: number; have: number }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function gradeLabel(grades: [number, number] | null): string {
    if (!grades) return 'barcha yoshdagi o\'quvchilar';
    return grades[0] === grades[1] ? `${grades[0]}-sinf` : `${grades[0]}–${grades[1]}-sinflar`;
}

async function buildCells(): Promise<Cell[]> {
    const counts = await prisma.bankQuestion.groupBy({
        by: ['subject', 'topic', 'difficulty'],
        where: { status: { not: 'REJECTED' }, language: 'uz' },
        _count: true,
    });
    const countOf = new Map(counts.map(c => [`${c.subject}|${c.topic}|${c.difficulty}`, c._count]));
    return TAXONOMY
        .filter(t => !SUBJECTS || SUBJECTS.includes(t.subject))
        .flatMap(t => [1, 2, 3].map(difficulty => ({
            ...t,
            difficulty,
            have: countOf.get(`${t.subject}|${t.topic}|${difficulty}`) ?? 0,
        })))
        .filter(c => c.have < TARGET);
}

const subjectTextsCache = new Map<string, string[]>();
async function subjectTexts(subject: string): Promise<string[]> {
    if (!subjectTextsCache.has(subject)) {
        const rows = await prisma.bankQuestion.findMany({ where: { subject, language: 'uz' }, select: { text: true }, take: 3000 });
        subjectTextsCache.set(subject, rows.map(r => r.text));
    }
    return subjectTextsCache.get(subject)!;
}

async function generateForCell(cell: Cell, need: number): Promise<{ added: number; model: string } | null> {
    const existing = await prisma.bankQuestion.findMany({
        where: { subject: cell.subject, topic: cell.topic },
        select: { text: true },
        orderBy: { createdAt: 'desc' },
        take: 25,
    });
    const avoid = existing.length > 0
        ? `\n\nQuyidagi savollar omborda BOR — ularni va ularga o'xshashlarini takrorlamang:\n${existing.map(e => `- ${e.text.slice(0, 120)}`).join('\n')}`
        : '';
    const ask = need + Math.max(2, Math.ceil(need * 0.3));
    const userPrompt = `Fan: ${cell.subject}. Mavzu: "${cell.topic}". Kimlar uchun: ${gradeLabel(cell.grades)}.
Qiyinlik: ${DIFFICULTY_LABEL[cell.difficulty]}.
AYNAN ${ask} ta savol yarating.${avoid}`;

    const skip: string[] = [];
    for (let attempt = 0; attempt < 3; attempt++) {
        let result;
        try {
            result = await callLLM({ system: SYSTEM_PROMPT, user: userPrompt, temperature: 0.8, budgetMs: 120_000, skip });
        } catch (err) {
            if (err instanceof LLMUnavailableError) throw err;
            return null;
        }

        let raw: any[];
        try {
            raw = extractJsonArray(result.text);
        } catch {
            skip.push(`${result.provider}/${result.model}`);
            continue;
        }

        const known = await subjectTexts(cell.subject);
        const accepted: any[] = [];
        let rejected = 0;
        for (const q of raw) {
            const item = {
                question: String(q.question ?? q.text ?? '').trim(),
                options: Array.isArray(q.options) ? q.options.map((o: unknown) => String(o).trim()) : [],
                correctIndex: Number(q.correctIndex),
                explanation: String(q.explanation ?? '').trim(),
                hint: String(q.hint ?? '').trim(),
            };
            const tooSimilar = [...known, ...accepted.map(a => a.question)].some(t => similarityScore(t, item.question) >= 0.8);
            if (qualityIssues(item).length > 0 || tooSimilar) { rejected++; continue; }
            accepted.push(item);
            if (accepted.length >= need) break;
        }

        const model = `${result.provider}/${result.model}`;
        if (accepted.length === 0) {
            skip.push(model);
            continue;
        }

        const res = await prisma.bankQuestion.createMany({
            data: accepted.map(q => ({
                subject: cell.subject,
                topic: cell.topic,
                grade: cell.grades ? cell.grades[0] : null,
                difficulty: cell.difficulty,
                language: 'uz',
                text: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                hint: q.hint,
                status: 'PENDING' as const,
                source: 'AI' as const,
                contentHash: contentHash(q.question),
                generatedBy: model,
            })),
            skipDuplicates: true,
        });
        known.push(...accepted.map(a => a.question));
        if (rejected > 0) console.log(`      (${rejected} ta savol sifat filtridan o'tmadi)`);
        return { added: res.count, model };
    }
    return null;
}

async function main() {
    const providers = configuredProviderIds();
    if (providers.length === 0) throw new Error("Hech qanday AI kaliti topilmadi (.env)");
    console.log(`Provayderlar: ${providers.join(', ')} | limit=${LIMIT}, target=${TARGET}/katak, batch=${BATCH}`);

    // Fanlar navbatma-navbat (har fandan bittadan), har fan ichida kam to'lgan kataklar birinchi —
    // cheklangan ishga tushirish ham barcha fanlarni teng qamrab olsin
    const bySubject = new Map<string, Cell[]>();
    for (const c of await buildCells()) bySubject.set(c.subject, [...(bySubject.get(c.subject) ?? []), c]);
    const queues = Array.from(bySubject.values()).map(list => shuffle(list).sort((a, b) => a.have - b.have));
    const cells: Cell[] = [];
    while (queues.some(q => q.length > 0)) {
        for (const q of queues) if (q.length > 0) cells.push(q.shift()!);
    }
    console.log(`To'lmagan kataklar: ${cells.length}\n`);

    let total = 0;
    let consecutiveOutages = 0;
    const exhausted = new Set<Cell>(); // yaroqli savol bermagan kataklar — shu ishga tushirishda qayta urinilmaydi

    // Kataklar bo'ylab navbatma-navbat (har o'tishda har katakka bitta partiya)
    outer: while (total < LIMIT) {
        const round = cells.filter(c => c.have < TARGET && !exhausted.has(c));
        if (round.length === 0) break;
        for (let i = 0; i < round.length && total < LIMIT; i++) {
            const cell = round[i];
            const need = Math.min(BATCH, TARGET - cell.have, LIMIT - total);
            const label = `${cell.subject} · ${cell.topic} · ${['', 'oson', "o'rta", 'qiyin'][cell.difficulty]}`;
            try {
                const r = await generateForCell(cell, need);
                consecutiveOutages = 0;
                if (r && r.added > 0) {
                    cell.have += r.added;
                    total += r.added;
                    console.log(`[${total}/${LIMIT}] ${label} → +${r.added} (${cell.have}/${TARGET}) [${r.model}]`);
                } else {
                    exhausted.add(cell);
                    console.log(`[${total}/${LIMIT}] ${label} → yaroqli yangi savol chiqmadi, o'tkazildi`);
                }
            } catch (err) {
                if (!(err instanceof LLMUnavailableError)) throw err;
                consecutiveOutages++;
                if (consecutiveOutages >= 4) {
                    console.log(`\nAI kvotalari vaqtincha tugadi. Keyinroq qayta ishga tushiring — skript qolgan joyidan davom etadi.`);
                    break outer;
                }
                const wait = Math.min(Math.max(err.retryAfterSec ?? 30, 10), 120);
                console.log(`   AI band (${err.message}). ${wait}s kutilmoqda...`);
                await sleep(wait * 1000);
                i--; // shu katakni qayta urinamiz
            }
        }
    }

    const pending = await prisma.bankQuestion.count({ where: { status: 'PENDING', verifiedAt: null } });
    console.log(`\nBu safar qo'shildi: ${total} ta. Tekshiruv kutayotganlar: ${pending} ta → npm run bank:verify`);
}

main()
    .catch(err => { console.error(err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
