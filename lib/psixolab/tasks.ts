// "Topshiriq" rejimi: oʻqituvchi havola beradi, talaba ism-familiya va guruh bilan kirib mustaqil bajaradi.
// Saqlash — Redis (bazaga migratsiya kerak emas):
//   task:{id}        — topshiriq (mavzu, til, oʻqituvchi kaliti)
//   task:{id}:subs   — hash: subId → talaba natijasi
//   task:index       — sorted set: barcha topshiriqlar (admin paneli uchun)

import { redis } from '../gameState';
import { audTopic, CASE_MAX, type AudLang } from './auditoriya';

export const TASK_TTL = 60 * 60 * 24 * 200; // ~semestr

export interface Task {
    id: string;
    topicId: string;
    lang: AudLang;
    title: string;
    teacherKey: string;
    createdAt: number;
}

export interface Submission {
    id: string;
    name: string;
    group: string;
    submittedAt: number;
    durationSec: number;
    test: { answers: number[]; correct: number; max: number };
    match: { mistakes: number; score: number; max: number; timeSec: number };
    caseText: string;
    caseGrade: number | null;      // 0–10, oʻqituvchi qoʻyadi
    total: number | null;          // keys baholangach hisoblanadi
}

const taskKey = (id: string) => `task:${id}`;
const subsKey = (id: string) => `task:${id}:subs`;
const parse = <T>(v: unknown): T => (typeof v === 'string' ? JSON.parse(v) : v) as T;

export async function getTask(id: string): Promise<Task | null> {
    const v = await redis.get(taskKey(id));
    return v ? parse<Task>(v) : null;
}

export async function saveTask(t: Task) {
    await redis.set(taskKey(t.id), JSON.stringify(t), { ex: TASK_TTL });
    await redis.zadd('task:index', { score: t.createdAt, member: t.id });
}

export async function getSubmissions(id: string): Promise<Submission[]> {
    const all = await redis.hgetall<Record<string, unknown>>(subsKey(id));
    return Object.values(all ?? {}).map(v => parse<Submission>(v)).sort((a, b) => a.submittedAt - b.submittedAt);
}

export async function saveSubmission(taskId: string, s: Submission) {
    await redis.hset(subsKey(taskId), { [s.id]: JSON.stringify(s) });
    await redis.expire(subsKey(taskId), TASK_TTL);
}

export async function getSubmission(taskId: string, subId: string): Promise<Submission | null> {
    const v = await redis.hget(subsKey(taskId), subId);
    return v ? parse<Submission>(v) : null;
}

export const countSubmissions = (id: string) => redis.hlen(subsKey(id));

/** Talabaga yuboriladigan topshiriq — toʻgʻri javoblarsiz. */
export function publicTask(t: Task) {
    const topic = audTopic(t.topicId);
    if (!topic) return null;
    const L = t.lang;
    return {
        id: t.id, lang: L, topicId: topic.id, kind: topic.kind, title: topic.title[L],
        explain: topic.explain[L], concepts: topic.concepts[L],
        tests: topic.tests.map(x => ({ q: x.q[L], options: x.options.map(o => o[L]) })),
        pairs: { left: topic.pairs.map(p => p.left[L]), right: topic.pairs.map(p => p.right[L]) },
        caseTask: topic.caseTask[L],
    };
}

/**
 * Avtomatik tekshiruv. Test: kanonik variant indekslari. Moslashtirish: talabaning urinishlari
 * ketma-ketligi [chap, oʻng] — server oʻzi qayta hisoblaydi (xatolar soni va toʻliqligi).
 */
export function gradeAuto(topicId: string, testAnswers: unknown, attempts: unknown) {
    const topic = audTopic(topicId)!;
    const answers = topic.tests.map((_, i) => {
        const a = Array.isArray(testAnswers) ? Number(testAnswers[i]) : -1;
        return Number.isInteger(a) && a >= 0 && a < 4 ? a : -1;
    });
    const correct = answers.filter((a, i) => a === topic.tests[i].answer).length;

    const n = topic.pairs.length;
    const matched = new Set<number>();
    let mistakes = 0;
    for (const at of Array.isArray(attempts) ? attempts.slice(0, 200) : []) {
        const [l, r] = Array.isArray(at) ? at.map(Number) : [NaN, NaN];
        if (!Number.isInteger(l) || !Number.isInteger(r) || l < 0 || l >= n || matched.has(l)) continue;
        if (l === r) matched.add(l); else mistakes++;
    }
    // Moslanmay qolgan juftlar ham xato sifatida hisoblanadi
    const missing = n - matched.size;
    const score = Math.max(0, n - mistakes - missing);
    return {
        test: { answers, correct, max: topic.tests.length },
        match: { mistakes: mistakes + missing, score, max: n },
        correctAnswers: topic.tests.map(t => t.answer),
    };
}

export const totalOf = (s: Pick<Submission, 'test' | 'match' | 'caseGrade'>) =>
    s.caseGrade === null ? null : s.test.correct + s.match.score + s.caseGrade;

export const maxTotal = (topicId: string) => {
    const t = audTopic(topicId)!;
    return t.tests.length + t.pairs.length + CASE_MAX;
};
