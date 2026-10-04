// Savollar omboriga fayldan import — AI'siz, aniq qoidalar bo'yicha.
//
// MATNLI FORMAT (TXT / DOCX / PDF):
//   Fan: Biologiya                 ← sarlavhalar keyingi barcha savollarga qo'llanadi (fayl ichida qayta yozish mumkin;
//                                     "Fan:" o'zgarsa, "Mavzu:" ham qaytadan yoziladi)
//   Mavzu: Fotosintez
//   Sinf: 6
//   Qiyinlik: oson                 ← oson | o'rta | qiyin (yoki 1 | 2 | 3)
//
//   1. Fotosintez qayerda boradi?  ← raqam ixtiyoriy; savol bir necha qatordan iborat bo'lishi mumkin
//   A) Yadroda                     ← aynan 4 ta variant: A B C D (yoki А Б В Г), ajratgich ")" "." ":"
//   B) Xloroplastda
//   C) Mitoxondriyada
//   D) Ribosomada
//   Javob: B                       ← yoki to'g'ri variant oldiga * / + qo'yiladi: "*B) Xloroplastda"
//   Izoh: Fotosintez xloroplastda boradi.   ← ixtiyoriy
//   Ishora: Yashil rangli organoid.         ← ixtiyoriy
//
// JADVAL FORMAT (CSV / XLSX): 1-qator — sarlavha. Ustunlar (tartib ixtiyoriy):
//   Savol | A | B | C | D | Javob | Izoh | Ishora | Fan | Mavzu | Sinf | Qiyinlik

import { SUBJECTS, detectSubject, normalizeText, parseDifficulty, parseGrade } from './subjects';

export interface ImportDefaults {
    subject?: string;
    topic?: string;
    grade?: number | null;
    difficulty?: number;
}

export interface ImportedQuestion {
    ref: string;
    subject: string;
    topic: string;
    grade: number | null;
    difficulty: number;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint: string;
}

export interface ImportError { ref: string; reason: string }
export interface ParseResult { questions: ImportedQuestion[]; errors: ImportError[] }

const LETTERS: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, 'а': 0, 'б': 1, 'в': 2, 'г': 3 };
// Lotin variantli faylda javob kirill klaviaturasida terilgan bo'lsa: shakli bir xil harflar (В ≠ "v", balki B)
const LATIN_LOOKALIKES: Record<string, number> = { 'а': 0, 'в': 1, 'с': 2 };

/** "B", "б", "2", "B)" → 1; tushunarsiz bo'lsa -1. alphabet — fayldagi variant harflari qaysi alifboda. */
export function answerIndex(raw: string, alphabet: 'latin' | 'cyrillic' = 'latin'): number {
    const v = raw.trim().toLowerCase().replace(/[).:\s]+$/, '');
    if (alphabet === 'latin' && v in LATIN_LOOKALIKES) return LATIN_LOOKALIKES[v];
    if (v in LETTERS) return LETTERS[v];
    if (/^[1-4]$/.test(v)) return Number(v) - 1;
    return -1;
}

export function resolveSubject(raw: string | undefined): string | null {
    if (!raw?.trim()) return null;
    const exact = SUBJECTS.find(s => normalizeText(s) === normalizeText(raw));
    return exact ?? detectSubject(raw);
}

const META = /^(fan|mavzu|sinf|qiyinlik)\s*:\s*(.*)$/i;
const ANSWER = /^(javob|to'g'ri javob|to‘g‘ri javob|togri javob|answer|ответ)\s*[:\-]\s*(.+)$/i;
const EXPLANATION = /^(izoh|tushuntirish)\s*[:\-]\s*(.*)$/i;
const HINT = /^(ishora|maslahat)\s*[:\-]\s*(.*)$/i;
const OPTION = /^([*+])?\s*([A-Da-dАБВГабвг])\s*[).:]\s+(.+?)\s*([*+])?$/;
const NUMBERING = /^(\d{1,4})\s*(?:-\s*savol)?\s*[.)\-:]\s*/i;

interface Draft {
    startLine: number;
    number?: string;
    alphabet?: 'latin' | 'cyrillic';
    textLines: string[];
    options: { letter: number; text: string; marked: boolean }[];
    answer: string | null;
    explanation: string;
    hint: string;
}

function buildQuestion(d: Draft, ctx: ImportDefaults & { subjectRaw?: string }, errors: ImportError[], out: ImportedQuestion[]) {
    const ref = `${d.number ? `${d.number}-savol` : 'Savol'} (${d.startLine}-qator)`;
    const text = d.textLines.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) return errors.push({ ref, reason: "Savol matni yo'q" });
    if (d.options.length !== 4) {
        return errors.push({ ref, reason: d.options.length === 0
            ? "Variantlar topilmadi — har bir variant A), B), C), D) bilan boshlanishi kerak (Word'ning avtomatik ro'yxati o'qilmaydi, harflarni qo'lda yozing)"
            : `Aynan 4 ta variant bo'lishi kerak, ${d.options.length} ta topildi` });
    }
    const letters = d.options.map(o => o.letter);
    if (new Set(letters).size !== 4) return errors.push({ ref, reason: 'Variant harflari takrorlangan (A, B, C, D bir martadan bo\'lsin)' });

    const ordered = [...d.options].sort((a, b) => a.letter - b.letter);
    let correctIndex = -1;
    if (d.answer !== null) {
        correctIndex = answerIndex(d.answer, d.alphabet ?? 'latin');
        if (correctIndex < 0) return errors.push({ ref, reason: `Javob tushunarsiz: "${d.answer}" — A, B, C yoki D yozing` });
    }
    const marked = ordered.findIndex(o => o.marked);
    if (correctIndex < 0) correctIndex = marked;
    if (correctIndex < 0) return errors.push({ ref, reason: "To'g'ri javob ko'rsatilmagan — \"Javob: B\" qatori yoki variant oldiga * qo'ying" });
    if (marked >= 0 && d.answer !== null && marked !== correctIndex) {
        return errors.push({ ref, reason: "Javob qatori va * belgisi turli variantni ko'rsatyapti" });
    }

    const subject = resolveSubject(ctx.subjectRaw ?? ctx.subject);
    if (!subject) return errors.push({ ref, reason: ctx.subjectRaw ? `Fan noma'lum: "${ctx.subjectRaw}"` : "Fan ko'rsatilmagan — faylda \"Fan:\" qatorini yozing yoki formada tanlang" });

    out.push({
        ref,
        subject,
        topic: ctx.topic ?? '',
        grade: ctx.grade ?? null,
        difficulty: ctx.difficulty ?? 2,
        text,
        options: ordered.map(o => o.text.trim()),
        correctIndex,
        explanation: d.explanation.trim(),
        hint: d.hint.trim(),
    });
}

/** TXT / DOCX / PDF dan olingan matnni tahlil qiladi. */
export function parseTextFormat(raw: string, defaults: ImportDefaults): ParseResult {
    const lines = raw.replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/ /g, ' ').trim());
    const ctx: ImportDefaults & { subjectRaw?: string } = { ...defaults };
    const questions: ImportedQuestion[] = [];
    const errors: ImportError[] = [];
    let cur: Draft | null = null;

    const flush = () => {
        if (cur && (cur.textLines.length > 0 || cur.options.length > 0)) buildQuestion(cur, ctx, errors, questions);
        cur = null;
    };
    const fresh = (line: number): Draft => ({ startLine: line, textLines: [], options: [], answer: null, explanation: '', hint: '' });

    lines.forEach((line, i) => {
        const lineNo = i + 1;
        if (!line) return;

        const meta = line.match(META);
        if (meta) {
            flush();
            const [, key, value] = meta;
            const k = key.toLowerCase();
            if (k === 'fan') {
                ctx.subjectRaw = value.trim();
                ctx.subject = undefined;
                ctx.topic = defaults.topic; // boshqa fanning mavzusi yangi fanga o'tib ketmasin
            }
            else if (k === 'mavzu') ctx.topic = value.trim();
            else if (k === 'sinf') ctx.grade = parseGrade(value);
            else if (k === 'qiyinlik') ctx.difficulty = parseDifficulty(value);
            return;
        }

        const ans = line.match(ANSWER);
        if (ans && cur) { cur.answer = ans[2].trim(); return; }
        const exp = line.match(EXPLANATION);
        if (exp && cur) { cur.explanation = exp[2]; return; }
        const hint = line.match(HINT);
        if (hint && cur) { cur.hint = hint[2]; return; }

        const opt = line.match(OPTION);
        if (opt && cur && cur.textLines.length > 0) {
            cur.options.push({ letter: LETTERS[opt[2].toLowerCase()], text: opt[3], marked: !!(opt[1] || opt[4]) });
            cur.alphabet = /[a-d]/i.test(opt[2]) ? 'latin' : 'cyrillic';
            return;
        }

        // Oddiy matn: variantlar boshlangan bo'lsa — yangi savol, aks holda savol matnining davomi
        if (!cur || cur.options.length > 0 || cur.answer !== null) {
            flush();
            cur = fresh(lineNo);
            const num = line.match(NUMBERING);
            if (num) { cur.number = num[1]; line = line.slice(num[0].length); }
        }
        cur.textLines.push(line);
    });
    flush();

    return { questions, errors };
}

const COLUMN_ALIASES: Record<string, string[]> = {
    text: ['savol', 'savol matni', 'question', 'вопрос'],
    a: ['a', 'а', 'variant a', 'a variant'],
    b: ['b', 'б', 'variant b', 'b variant'],
    c: ['c', 'в', 'variant c', 'c variant'],
    d: ['d', 'г', 'variant d', 'd variant'],
    answer: ['javob', "to'g'ri javob", 'togri javob', 'answer', 'ответ'],
    explanation: ['izoh', 'tushuntirish', 'explanation'],
    hint: ['ishora', 'maslahat', 'hint'],
    subject: ['fan', 'subject', 'предмет'],
    topic: ['mavzu', 'topic', 'тема'],
    grade: ['sinf', 'grade', 'класс'],
    difficulty: ['qiyinlik', 'difficulty', 'сложность'],
};

/** CSV / XLSX qatorlari (1-qator — sarlavha). */
export function parseTable(rows: string[][], defaults: ImportDefaults): ParseResult {
    const questions: ImportedQuestion[] = [];
    const errors: ImportError[] = [];
    if (rows.length < 2) return { questions, errors: [{ ref: 'Jadval', reason: "Sarlavha va kamida bitta savol qatori bo'lishi kerak" }] };

    const header = rows[0].map(h => normalizeText(String(h ?? '')));
    const col: Record<string, number> = {};
    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
        const idx = header.findIndex(h => aliases.includes(h));
        if (idx >= 0) col[key] = idx;
    }
    const missing = ['text', 'a', 'b', 'c', 'd', 'answer'].filter(k => col[k] === undefined);
    if (missing.length > 0) {
        return { questions, errors: [{ ref: '1-qator (sarlavha)', reason: `Ustunlar topilmadi: ${missing.map(m => (m === 'text' ? 'Savol' : m === 'answer' ? 'Javob' : m.toUpperCase())).join(', ')}` }] };
    }

    rows.slice(1).forEach((row, i) => {
        const cell = (k: string) => (col[k] !== undefined ? String(row[col[k]] ?? '').trim() : '');
        if (row.every(c => !String(c ?? '').trim())) return;
        const lineNo = i + 2;
        const draft: Draft = {
            startLine: lineNo,
            textLines: [cell('text')],
            options: ['a', 'b', 'c', 'd'].map((k, idx) => ({ letter: idx, text: cell(k), marked: false })).filter(o => o.text),
            answer: cell('answer') || null,
            explanation: cell('explanation'),
            hint: cell('hint'),
        };
        const ctx = {
            ...defaults,
            subjectRaw: cell('subject') || undefined,
            topic: cell('topic') || defaults.topic,
            grade: cell('grade') ? parseGrade(cell('grade')) : defaults.grade,
            difficulty: cell('difficulty') ? parseDifficulty(cell('difficulty')) : defaults.difficulty,
        };
        buildQuestion(draft, ctx, errors, questions);
        const last = questions[questions.length - 1];
        if (last && last.ref.endsWith(`(${lineNo}-qator)`)) last.ref = `${lineNo}-qator`;
    });

    return { questions, errors };
}

/** Oddiy CSV parser: qo'shtirnoqlar, "," yoki ";" ajratgich, BOM. */
export function parseCsv(content: string): string[][] {
    const text = content.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (ch === '"') quoted = false;
            else field += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === delim) { row.push(field); field = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field); rows.push(row); row = []; field = '';
        } else field += ch;
    }
    if (field || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
}
