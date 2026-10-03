// Savollar omborini mavjud manbalardan to'ldiradi: Bozor ichki savollari + kutubxona quizlari.
// Qayta ishga tushirish xavfsiz — contentHash bo'yicha dublikatlar o'tkazib yuboriladi.
// Ishga tushirish: npm run bank:seed
const { createHash } = require('crypto');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// lib/questionBank/subjects.ts → normalizeText va lib/questionBank/bank.ts → contentHash bilan bir xil bo'lishi SHART
function normalizeText(text) {
    return text.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, ' ').trim();
}
function contentHash(text, language = 'uz') {
    const norm = normalizeText(text).replace(/[^\p{L}\p{N} ]/gu, '');
    return createHash('sha256').update(`${language}|${norm}`).digest('hex');
}

const SUBJECT_MAP = {
    "O'zbek tili": { subject: 'Ona tili va adabiyot' },
    'Ma’lumotlar bazasi': { subject: 'Informatika', topic: "Ma'lumotlar bazasi" },
    'Sun’iy intellekt va Neyron tarmoqlari': { subject: 'Informatika', topic: "Sun'iy intellekt va neyron tarmoqlari" },
    '🌊 Gidrologiya': { subject: 'Geografiya', topic: 'Gidrologiya' },
};
const CANONICAL = ['Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix', 'Geografiya', 'Ona tili va adabiyot', 'Ingliz tili', 'Rus tili', 'Informatika', 'Umumiy bilim'];

function mapSubject(raw) {
    if (SUBJECT_MAP[raw]) return { topic: '', ...SUBJECT_MAP[raw] };
    if (CANONICAL.includes(raw)) return { subject: raw, topic: '' };
    return { subject: 'Umumiy bilim', topic: raw };
}

function parseGrade(raw) {
    if (!raw || raw === 'Barcha') return null;
    if (/kurs/i.test(raw)) return 12;
    const n = parseInt(String(raw).match(/\d+/)?.[0] ?? '', 10);
    return n >= 1 && n <= 11 ? n : null;
}

async function main() {
    const rows = [];

    const builtin = require(path.join(__dirname, '../../lib/questionBank/seed/builtin-uz.json'));
    for (const q of builtin) {
        const { subject, topic } = mapSubject(q.subject);
        rows.push({
            subject, topic, grade: null, difficulty: q.difficulty ?? 2, language: 'uz',
            text: q.text.trim(), options: q.options.map(o => o.trim()), correctIndex: q.correctIndex,
            explanation: q.explanation ?? '', status: 'APPROVED', source: 'SEED',
        });
    }

    const library = await prisma.libraryQuiz.findMany({ where: { is_active: true } });
    let skippedLibrary = 0;
    for (const quiz of library) {
        const { subject, topic } = mapSubject(quiz.subject);
        for (const q of Array.isArray(quiz.questions) ? quiz.questions : []) {
            const wrong = Array.isArray(q.wrongAnswers) ? q.wrongAnswers.map(w => String(w).trim()).filter(Boolean).slice(0, 3) : [];
            if (!q.question || !q.correctAnswer || wrong.length < 3) { skippedLibrary++; continue; }
            rows.push({
                subject, topic: topic || quiz.title, grade: parseGrade(quiz.grade), difficulty: 2, language: 'uz',
                text: String(q.question).trim(), options: [String(q.correctAnswer).trim(), ...wrong], correctIndex: 0,
                explanation: q.explanation ?? '', status: 'APPROVED', source: 'ADMIN',
            });
        }
    }

    const data = rows.map(r => ({ ...r, contentHash: contentHash(r.text, r.language) }));
    const before = await prisma.bankQuestion.count();
    const result = await prisma.bankQuestion.createMany({ data, skipDuplicates: true });
    const after = await prisma.bankQuestion.count();

    console.log(`Manbalar: ichki ${builtin.length}, kutubxona ${data.length - builtin.length} (yaroqsiz ${skippedLibrary})`);
    console.log(`Qo'shildi: ${result.count} ta (dublikat o'tkazib yuborildi: ${data.length - result.count})`);
    console.log(`Ombor: ${before} → ${after} ta savol`);

    const bySubject = await prisma.bankQuestion.groupBy({ by: ['subject', 'status'], _count: true, orderBy: { subject: 'asc' } });
    for (const g of bySubject) console.log(`  ${g.subject} [${g.status}]: ${g._count}`);
}

main()
    .catch(err => { console.error(err); process.exit(1); })
    .finally(() => prisma.$disconnect());
