import { randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { shuffle } from '@/lib/shuffle';

// Chalkashadigan belgilarsiz (0/O, 1/I/L) — QR ishlamasa kodni qo'lda terish oson bo'lsin
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export const ASSIGNMENT_QUESTION_LIMIT = 100;

export const AssignmentQuestionSchema = z.object({
    text: z.string().trim().min(3).max(1000),
    options: z.array(z.string().trim().min(1).max(300)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().trim().max(1000).default(''),
});
export type AssignmentQuestion = z.infer<typeof AssignmentQuestionSchema>;

export const AssignmentSettingsSchema = z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(1000).default(''),
    opensAt: z.coerce.date().nullable().default(null),
    closesAt: z.coerce.date().nullable().default(null),
    maxAttempts: z.number().int().min(0).max(20).default(1),
    timePerQuestion: z.number().int().min(0).max(600).default(0),
    shuffle: z.boolean().default(true),
    showAnswers: z.enum(['AFTER_SUBMIT', 'AFTER_CLOSE', 'NEVER']).default('AFTER_SUBMIT'),
});

export const CreateAssignmentSchema = AssignmentSettingsSchema.extend({
    questions: z.array(AssignmentQuestionSchema).min(1).max(ASSIGNMENT_QUESTION_LIMIT),
});

export function newToken(): string {
    return randomBytes(24).toString('base64url');
}

export async function generateCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
        const code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
        const exists = await prisma.assignment.findUnique({ where: { code }, select: { id: true } });
        if (!exists) return code;
    }
    throw new Error("Kod yaratib bo'lmadi, qayta urinib ko'ring");
}

export function normalizeCode(code: string): string {
    return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export interface OrderEntry { q: number; o: number[] }

/** Har bir o'quvchi uchun savollar va variantlar tartibi (aralashtirish yoqilgan bo'lsa — tasodifiy). */
export function buildOrder(count: number, doShuffle: boolean): OrderEntry[] {
    const qs = Array.from({ length: count }, (_, i) => i);
    return (doShuffle ? shuffle(qs) : qs).map(q => ({ q, o: doShuffle ? shuffle([0, 1, 2, 3]) : [0, 1, 2, 3] }));
}

type AssignmentRow = { status: string; opensAt: Date | null; closesAt: Date | null };

/** Topshiriq hozir yechish uchun ochiqmi; yopiq bo'lsa sababi. */
export function availability(a: AssignmentRow, now = new Date()): { open: boolean; reason?: string } {
    if (a.status !== 'ACTIVE') return { open: false, reason: "O'qituvchi bu topshiriqni yopgan" };
    if (a.opensAt && now < a.opensAt) return { open: false, reason: 'Topshiriq hali ochilmagan' };
    if (a.closesAt && now > a.closesAt) return { open: false, reason: 'Topshiriq muddati tugagan' };
    return { open: true };
}

/** To'g'ri javoblarni ko'rsatish mumkinmi (urinish yakunlangan bo'lishi shart). */
export function canRevealAnswers(a: AssignmentRow & { showAnswers: string }, now = new Date()): boolean {
    if (a.showAnswers === 'AFTER_SUBMIT') return true;
    if (a.showAnswers === 'AFTER_CLOSE') return a.status !== 'ACTIVE' || (!!a.closesAt && now > a.closesAt);
    return false;
}

export function scorePercent(correct: number, total: number): number {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}

// ─── O'quvchi urinishi ────────────────────────────────────────────────────────

const TIME_GRACE_MS = 3_000; // tarmoq kechikishi uchun

export function tokenMatches(expected: string, given: string | null): boolean {
    if (!given) return false;
    const a = Buffer.from(expected), b = Buffer.from(given);
    return a.length === b.length && timingSafeEqual(a, b);
}

/** Urinishni yakunlaydi: javob berilmagan savollar noto'g'ri hisoblanadi. */
export async function finalizeAttempt(attemptId: string) {
    const attempt = await prisma.assignmentAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    if (attempt.submittedAt) return attempt;
    const correct = await prisma.assignmentAnswer.count({ where: { attemptId, isCorrect: true } });
    return prisma.assignmentAttempt.update({
        where: { id: attemptId },
        data: { submittedAt: new Date(), correctCount: correct, score: scorePercent(correct, attempt.total) },
    });
}

/** Vaqti tugagan savolni "vaqt tugadi" deb yozadi. */
async function recordTimeout(attemptId: string, questionIndex: number, timeMs: number) {
    await prisma.assignmentAnswer.upsert({
        where: { attemptId_questionIndex: { attemptId, questionIndex } },
        create: { attemptId, questionIndex, selected: -1, isCorrect: false, timeMs },
        update: {},
    });
}

type FullAttempt = NonNullable<Awaited<ReturnType<typeof loadAttempt>>>;

export function loadAttempt(id: string) {
    return prisma.assignmentAttempt.findUnique({ where: { id }, include: { assignment: true } });
}

/**
 * O'quvchining joriy holati: navbatdagi savol (to'g'ri javobsiz) yoki yakuniy natija.
 * Savol birinchi marta ko'rsatilganda vaqti yoziladi — sahifani yangilash taymerni qayta boshlamaydi.
 */
export async function attemptState(attempt: FullAttempt) {
    const a = attempt.assignment;
    const questions = a.questions as AssignmentQuestion[];
    const order = attempt.order as unknown as OrderEntry[];
    const limitMs = a.timePerQuestion * 1000;

    if (!attempt.submittedAt) {
        // Topshiriq yopilgan bo'lsa — urinish shu holicha yakunlanadi
        if (!availability(a).open) {
            await finalizeAttempt(attempt.id);
            return attemptState((await loadAttempt(attempt.id))!);
        }

        for (;;) {
            const answered = await prisma.assignmentAnswer.count({ where: { attemptId: attempt.id } });
            if (answered >= order.length) {
                await finalizeAttempt(attempt.id);
                return attemptState((await loadAttempt(attempt.id))!);
            }
            const entry = order[answered];
            let servedAt = attempt.servedAt;
            if (attempt.servedIndex !== answered || !servedAt) {
                servedAt = new Date();
                await prisma.assignmentAttempt.update({ where: { id: attempt.id }, data: { servedIndex: answered, servedAt } });
                attempt.servedIndex = answered;
                attempt.servedAt = servedAt;
            }
            const elapsed = Date.now() - servedAt.getTime();
            if (limitMs > 0 && elapsed > limitMs + TIME_GRACE_MS) {
                // O'quvchi uzoq vaqt chiqib ketgan — bu savol vaqti tugagan, keyingisiga o'tamiz
                await recordTimeout(attempt.id, entry.q, elapsed);
                attempt.servedAt = null;
                continue;
            }
            const q = questions[entry.q];
            return {
                finished: false as const,
                title: a.title,
                position: answered,
                total: order.length,
                question: { text: q.text, options: entry.o.map(k => q.options[k]) },
                timeLeftMs: limitMs > 0 ? Math.max(0, limitMs - elapsed) : null,
            };
        }
    }

    const reveal = canRevealAnswers(a);
    let review = null;
    if (reveal) {
        const answers = await prisma.assignmentAnswer.findMany({ where: { attemptId: attempt.id } });
        const byQ = new Map(answers.map(x => [x.questionIndex, x]));
        review = order.map(entry => {
            const q = questions[entry.q];
            const ans = byQ.get(entry.q);
            return {
                text: q.text,
                options: entry.o.map(k => q.options[k]),
                correct: entry.o.indexOf(q.correctIndex),
                selected: ans && ans.selected >= 0 ? entry.o.indexOf(ans.selected) : -1,
                explanation: q.explanation,
            };
        });
    }
    return {
        finished: true as const,
        title: a.title,
        studentName: attempt.studentName,
        correctCount: attempt.correctCount,
        total: attempt.total,
        score: attempt.score,
        revealLater: !reveal && a.showAnswers === 'AFTER_CLOSE',
        review,
    };
}

/** O'quvchi javobini qabul qiladi (variant o'quvchiga ko'rsatilgan tartibdagi indeksda keladi). */
export async function submitAnswer(attempt: FullAttempt, position: number, shownIndex: number) {
    const a = attempt.assignment;
    if (attempt.submittedAt) return { status: 409, error: 'Topshiriq allaqachon yakunlangan' };
    if (!availability(a).open) {
        await finalizeAttempt(attempt.id);
        return { status: 409, error: availability(a).reason };
    }
    const order = attempt.order as unknown as OrderEntry[];
    const answered = await prisma.assignmentAnswer.count({ where: { attemptId: attempt.id } });
    if (position !== answered || attempt.servedIndex !== position || !attempt.servedAt) {
        return { status: 409, error: 'Savol eskirgan, sahifa yangilanadi' };
    }

    const entry = order[position];
    const q = (a.questions as AssignmentQuestion[])[entry.q];
    const timeMs = Date.now() - attempt.servedAt.getTime();
    const late = a.timePerQuestion > 0 && timeMs > a.timePerQuestion * 1000 + TIME_GRACE_MS;
    const selected = late ? -1 : entry.o[shownIndex];

    try {
        await prisma.assignmentAnswer.create({
            data: { attemptId: attempt.id, questionIndex: entry.q, selected, isCorrect: selected === q.correctIndex, timeMs },
        });
    } catch (err: any) {
        if (err?.code !== 'P2002') throw err; // ikki marta bosilgan — birinchi javob saqlangan
    }
    if (position + 1 >= order.length) await finalizeAttempt(attempt.id);
    return { status: 200, late };
}

export function publicUrl(code: string): string {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zukkoo.uz').replace(/\/$/, '');
    return `${base}/v/${code}`;
}
