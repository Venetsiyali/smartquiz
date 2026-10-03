// PENDING savollarni mustaqil tekshiradi: savolni yaratgan provayderdan BOSHQA provayder savolni javobsiz yechadi.
//   - javobi kalit bilan mos va muammo topilmasa → APPROVED (o'yinga chiqadi)
//   - mos kelmasa yoki muammo ko'rsatilsa → PENDING qoladi, reviewNote'da sababi (admin ko'rib chiqadi)
//
// Ishga tushirish: npm run bank:verify -- --limit=200
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { prisma } from '@/lib/prisma';
import { callLLM, configuredProviderIds, LLMUnavailableError } from '@/lib/llm/pool';
import { extractJsonArray } from '@/lib/llm/json';
import { isProviderId, type ProviderId } from '@/lib/llm/providers';
import { shuffle } from '@/lib/shuffle';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
}));
const LIMIT = parseInt(args.limit ?? '200', 10);
const BATCH = parseInt(args.batch ?? '8', 10);
const LETTERS = ['A', 'B', 'C', 'D'];

const SYSTEM_PROMPT = `Siz qat'iy test ekspertisiz. Sizga test savollari beriladi — har birini MUSTAQIL yeching va sifatini baholang.
Har bir savol uchun:
- "answer": to'g'ri variant harfi (A, B, C yoki D). Ishonchingiz komil bo'lmasa ham eng to'g'ri deb bilganingizni tanlang.
- "issue": savolda muammo bo'lsa, qisqa (o'zbekcha) yozing: faktik xato, bir nechta to'g'ri javob, to'g'ri javob yo'q, savol noaniq,
  grammatik xato, mavjud bo'lmagan yoki buzilgan so'z, g'aliz/tabiiy bo'lmagan o'zbekcha gap, ism va atamalarning inglizcha yozilishi
  (masalan "Batu Khan" — o'zbekcha "Botuxon" bo'lishi kerak; Ingliz tili fanidagi inglizcha matnlar bundan mustasno). Muammo bo'lmasa "".
O'quvchilar uchun sifat muhim: shubha bo'lsa, muammoni yozing.
Faqat JSON massiv qaytaring: [{"n":1,"answer":"B","issue":""}]`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface Row { id: string; text: string; options: string[]; correctIndex: number; generatedBy: string }

async function verifyBatch(rows: Row[], allowed: ProviderId[]) {
    // Har savolda variantlar qayta aralashtiriladi — tekshiruvchi o'rin bo'yicha taxmin qila olmasin
    const presented = rows.map(r => {
        const order = shuffle(r.options.map((_, i) => i));
        return { row: r, order };
    });
    const userPrompt = presented.map((p, idx) =>
        `${idx + 1}. ${p.row.text}\n${p.order.map((orig, k) => `   ${LETTERS[k]}) ${p.row.options[orig]}`).join('\n')}`
    ).join('\n\n');

    const result = await callLLM({ system: SYSTEM_PROMPT, user: userPrompt, temperature: 0, providers: allowed, budgetMs: 120_000 });
    const verifier = `${result.provider}/${result.model}`;
    const answers = new Map<number, { answer: string; issue: string }>();
    for (const a of extractJsonArray(result.text)) {
        const n = Number(a.n);
        if (Number.isInteger(n)) answers.set(n, { answer: String(a.answer ?? '').trim().toUpperCase().slice(0, 1), issue: String(a.issue ?? '').trim() });
    }

    let approved = 0, flagged = 0, missing = 0;
    const now = new Date();
    await prisma.$transaction(presented.flatMap((p, idx) => {
        const a = answers.get(idx + 1);
        if (!a || !LETTERS.includes(a.answer)) { missing++; return []; }
        const chosenOriginal = p.order[LETTERS.indexOf(a.answer)];
        const agrees = chosenOriginal === p.row.correctIndex;
        if (agrees && !a.issue) {
            approved++;
            return [prisma.bankQuestion.update({
                where: { id: p.row.id },
                data: { status: 'APPROVED', verifiedAt: now, reviewNote: `tasdiqladi: ${verifier}` },
            })];
        }
        flagged++;
        const note = !agrees
            ? `rozi emas (${verifier}): tekshiruvchi "${p.row.options[chosenOriginal]}" deb javob berdi, kalit "${p.row.options[p.row.correctIndex]}"${a.issue ? `; ${a.issue}` : ''}`
            : `muammo (${verifier}): ${a.issue}`;
        return [prisma.bankQuestion.update({ where: { id: p.row.id }, data: { verifiedAt: now, reviewNote: note.slice(0, 500) } })];
    }));
    return { approved, flagged, missing, verifier };
}

async function main() {
    const configured = configuredProviderIds();
    console.log(`Provayderlar: ${configured.join(', ')} | limit=${LIMIT}, batch=${BATCH}`);

    const rows = (await prisma.bankQuestion.findMany({
        where: { status: 'PENDING', verifiedAt: null, language: 'uz' },
        orderBy: { createdAt: 'asc' },
        take: LIMIT,
        select: { id: true, text: true, options: true, correctIndex: true, generatedBy: true },
    })).map(r => ({ ...r, options: r.options as string[] }));
    console.log(`Tekshiriladigan savollar: ${rows.length}\n`);

    // Generator provayderi bo'yicha guruhlaymiz — tekshiruvchi doim boshqa provayderdan
    const groups = new Map<string, Row[]>();
    for (const r of rows) {
        const gen = r.generatedBy.split('/')[0];
        const key = isProviderId(gen) ? gen : '';
        groups.set(key, [...(groups.get(key) ?? []), r]);
    }

    const totals = { approved: 0, flagged: 0, missing: 0 };
    for (const [genProvider, list] of groups) {
        const allowed = configured.filter(p => p !== genProvider);
        if (allowed.length === 0) {
            console.log(`⚠ ${list.length} ta savol (${genProvider}) — mustaqil tekshiruvchi yo'q (boshqa provayder kaliti kerak), o'tkazildi`);
            continue;
        }
        for (let i = 0; i < list.length; i += BATCH) {
            const batch = list.slice(i, i + BATCH);
            let attempts = 0;
            while (true) {
                try {
                    const r = await verifyBatch(batch, allowed);
                    totals.approved += r.approved; totals.flagged += r.flagged; totals.missing += r.missing;
                    console.log(`[${genProvider || '?'} → ${r.verifier}] +${r.approved} tasdiqlandi, ${r.flagged} shubhali${r.missing ? `, ${r.missing} javobsiz` : ''}`);
                    break;
                } catch (err: any) {
                    attempts++;
                    if (attempts >= 4) {
                        console.log(`   Bu partiya o'tkazildi: ${err?.message}`);
                        break;
                    }
                    const wait = err instanceof LLMUnavailableError ? Math.min(Math.max(err.retryAfterSec ?? 30, 10), 120) : 5;
                    console.log(`   Xato (${err?.message}). ${wait}s kutilmoqda...`);
                    await sleep(wait * 1000);
                }
            }
        }
    }

    const byStatus = await prisma.bankQuestion.groupBy({ by: ['status'], _count: true });
    const reviewQueue = await prisma.bankQuestion.count({ where: { status: 'PENDING', verifiedAt: { not: null } } });
    console.log(`\nNatija: ${totals.approved} tasdiqlandi, ${totals.flagged} admin ko'rib chiqishiga qoldi, ${totals.missing} javobsiz (keyingi safar qayta tekshiriladi)`);
    console.log(`Ombor: ${byStatus.map(s => `${s.status} ${s._count}`).join(', ')} | ko'rib chiqish navbati: ${reviewQueue}`);
}

main()
    .catch(err => { console.error(err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
