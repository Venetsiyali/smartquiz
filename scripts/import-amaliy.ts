/**
 * RTI amaliy mashg'ulot testlarini Zukkoo "Topshiriq" (assignment) sifatida import qilish.
 *
 *   npx tsx scripts/import-amaliy.ts --dir <arxiv papkasi> [--only 1] [--dry] [--teacher email] [--out report.json]
 *
 * - Faqat <dir>/testlar_amaliy/<N>-amaliy.txt o'qiladi; nom links_amaliy.csv dagi mavzudan olinadi.
 * - Har bir fayl Zukkoo'ning o'z parseri (saytdagi fayl yuklash bilan bir xil) orqali o'qiladi va
 *   mustaqil, oddiy o'quvchi bilan belgima-belgi solishtiriladi + kalitlar/javoblar_kaliti_amaliy.csv bilan.
 * - Bir xil nomli topshiriq shu o'qituvchida bo'lsa — qayta yaratilmaydi (dublikat yo'q).
 * - --dry: bazaga hech narsa yozilmaydi.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseTextFormat } from '@/lib/questionBank/importParser';
import { CreateAssignmentSchema, generateCode, publicUrl, type AssignmentQuestion } from '@/lib/assignments';
import { prisma } from '@/lib/prisma';

const arg = (name: string) => {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
};
const DIR = arg('dir');
const ONLY = arg('only');
const TEACHER = arg('teacher') ?? 'zukkoo.uz@gmail.com';
const OUT = arg('out');
const DRY = process.argv.includes('--dry');
if (!DIR) throw new Error('--dir kerak');

/** Oddiy CSV (vergul ichida qo'shtirnoqli maydonlar bilan) */
function readCsv(path: string): Record<string, string>[] {
    const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
    const rows: string[][] = [];
    let row: string[] = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') q = false;
            else cell += c;
        } else if (c === '"') q = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(cell); rows.push(row); row = []; cell = '';
        } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const [head, ...body] = rows.filter(r => r.some(x => x !== ''));
    return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

/** Mustaqil o'quvchi: 7 qatorli bloklar (savol, A–D, Javob, Izoh) */
function readRaw(path: string): AssignmentQuestion[] {
    const blocks = readFileSync(path, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/);
    return blocks.map((b, bi) => {
        const l = b.split('\n');
        if (l.length !== 7) throw new Error(`${path}: ${bi + 1}-blok ${l.length} qator`);
        const text = l[0].replace(/^\d+\.\s*/, '');
        const options = l.slice(1, 5).map((x, k) => {
            if (!x.startsWith(`${'ABCD'[k]}) `)) throw new Error(`${path}: ${bi + 1}-savol variant ${'ABCD'[k]}`);
            return x.slice(3);
        });
        const ans = l[5].match(/^Javob: ([ABCD])$/);
        const exp = l[6].match(/^Izoh: (.*)$/);
        if (!ans || !exp) throw new Error(`${path}: ${bi + 1}-savol Javob/Izoh`);
        return { text, options, correctIndex: 'ABCD'.indexOf(ans[1]), explanation: exp[1] };
    });
}

(async () => {
    const teacher = await prisma.user.findUnique({ where: { email: TEACHER }, select: { id: true } });
    if (!teacher) throw new Error(`O'qituvchi topilmadi: ${TEACHER}`);
    const links = readCsv(join(DIR, 'links_amaliy.csv'));
    const key = readCsv(join(DIR, 'kalitlar', 'javoblar_kaliti_amaliy.csv'));
    const report: Record<string, unknown>[] = [];

    for (const link of links) {
        const n = link.amaliy;
        if (ONLY && n !== ONLY) continue;
        const file = join(DIR, 'testlar_amaliy', `${n}-amaliy.txt`);
        const raw = readRaw(file);
        const parsed = parseTextFormat(readFileSync(file, 'utf8'), { subject: 'Umumiy bilim', lenientSubject: true });
        if (parsed.errors.length) throw new Error(`${n}: parser xatolari ${JSON.stringify(parsed.errors)}`);

        const questions: AssignmentQuestion[] = parsed.questions.map(q => ({
            text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation ?? '',
        }));
        const k = key.filter(r => r.amaliy === n).sort((a, b) => Number(a.savol) - Number(b.savol));
        const problems: string[] = [];
        if (questions.length !== 30) problems.push(`savollar soni ${questions.length}`);
        if (raw.length !== questions.length) problems.push(`mustaqil o'quvchi ${raw.length} ta savol topdi`);
        if (k.length !== 30) problems.push(`kalitda ${k.length} qator`);
        questions.forEach((q, i) => {
            const r = raw[i];
            if (!r) return;
            if (q.text !== r.text) problems.push(`${i + 1}: savol matni farq qiladi`);
            q.options.forEach((o, j) => { if (o !== r.options[j]) problems.push(`${i + 1}: ${'ABCD'[j]} varianti farq qiladi`); });
            if (q.explanation !== r.explanation) problems.push(`${i + 1}: izoh farq qiladi`);
            if (q.correctIndex !== r.correctIndex) problems.push(`${i + 1}: javob faylga mos emas`);
            if ('ABCD'[q.correctIndex] !== k[i]?.javob) problems.push(`${i + 1}: javob ${'ABCD'[q.correctIndex]}, kalitda ${k[i]?.javob}`);
            if (!q.explanation) problems.push(`${i + 1}: izoh boʻsh`);
        });
        const special = (s: string) => (s.match(/[ʻʼ„“–]/g) ?? []).length;
        const srcSpecial = special(readFileSync(file, 'utf8'));
        const dbSpecial = questions.reduce((s, q) => s + special(q.text) + q.options.reduce((a, o) => a + special(o), 0) + special(q.explanation), 0);
        if (srcSpecial !== dbSpecial) problems.push(`maxsus belgilar soni: faylda ${srcSpecial}, importda ${dbSpecial}`);

        const data = CreateAssignmentSchema.parse({
            title: `RTI ${n}-amaliy mashgʻulot – ${link.mavzu}`,
            description: `„Raqamli texnologiya va innovatsiyalar“ fani · ${n}-amaliy mashgʻulot boʻyicha test`,
            questions,
            // Foydalanuvchi tanlovi: har savolga 60 s, 3 urinish, yakunda ball + javoblar + izoh
            maxAttempts: 3, timePerQuestion: 60, shuffle: true, showAnswers: 'AFTER_SUBMIT', opensAt: null, closesAt: null,
        });

        const row: Record<string, unknown> = {
            amaliy: n, title: data.title, questions: questions.length,
            answers: questions.map(q => 'ABCD'[q.correctIndex]).join(''), specialChars: dbSpecial,
            check: problems.length ? problems : 'OK',
        };
        if (problems.length) { report.push({ ...row, status: 'XATO — import qilinmadi' }); continue; }

        const existing = await prisma.assignment.findFirst({ where: { teacherId: teacher.id, title: data.title }, select: { id: true, code: true } });
        if (existing) report.push({ ...row, id: existing.id, code: existing.code, url: publicUrl(existing.code), status: 'avval yaratilgan (oʻtkazib yuborildi)' });
        else if (DRY) report.push({ ...row, status: 'dry-run: yozilmadi' });
        else {
            const a = await prisma.assignment.create({ data: { ...data, code: await generateCode(), teacherId: teacher.id }, select: { id: true, code: true } });
            report.push({ ...row, id: a.id, code: a.code, url: publicUrl(a.code), status: 'yaratildi' });
        }
    }

    console.log(JSON.stringify(report, null, 1));
    if (OUT) writeFileSync(OUT, JSON.stringify(report, null, 1));
    await prisma.$disconnect();
})().catch(async e => { console.error('XATO:', e.message); await prisma.$disconnect(); process.exit(1); });
