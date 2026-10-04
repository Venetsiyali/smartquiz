import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { shuffle } from '@/lib/shuffle';
import { GENERAL_SUBJECT, detectSubject, normalizeText, topicWords } from './subjects';

export type MatchLevel = 'topic' | 'subject' | 'general';

export interface BankQuestionOut {
    id: string;
    subject: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint: string;
}

export interface FallbackResult {
    questions: BankQuestionOut[];
    matchLevel: MatchLevel;
    subject: string | null;
}

/** Bir xil savolni ikkinchi marta saqlamaslik uchun (seed skripti ham aynan shu algoritmdan foydalanadi). */
export function contentHash(text: string, language = 'uz'): string {
    const norm = normalizeText(text).replace(/[^\p{L}\p{N} ]/gu, '');
    return createHash('sha256').update(`${language}|${norm}`).digest('hex');
}

interface Pick { id: string; difficulty: number }

async function sampleIds(where: object, count: number, exclude: Set<string>, difficulty?: number): Promise<string[]> {
    if (count <= 0) return [];
    const rows: Pick[] = await prisma.bankQuestion.findMany({
        where: { ...where, ...(exclude.size > 0 ? { id: { notIn: Array.from(exclude) } } : {}) },
        select: { id: true, difficulty: true },
        take: 2000,
    });
    // Tasodifiy, lekin so'ralgan qiyinlikdagilar birinchi
    const ordered = shuffle(rows).sort((a, b) =>
        difficulty == null ? 0 : Number(a.difficulty !== difficulty) - Number(b.difficulty !== difficulty)
    );
    return ordered.slice(0, count).map(r => r.id);
}

/**
 * AI ishlamaganda ombordan tasodifiy, tasdiqlangan savollar.
 * Zinapoya: aniq mavzu → fan (+qo'shni sinflar) → fan → umumiy bilim → istalgan fan.
 */
export async function getFallbackQuestions(params: {
    topic: string;
    count: number;
    grade?: number | null;
    difficulty?: number;
    language?: string;
}): Promise<FallbackResult> {
    const { topic, count, grade, difficulty, language = 'uz' } = params;
    const subject = detectSubject(topic);
    const base = { status: 'APPROVED' as const, language };
    const picked = new Set<string>();
    let matchLevel: MatchLevel = 'topic';

    const add = async (where: object, level: MatchLevel) => {
        const need = count - picked.size;
        if (need <= 0) return;
        const ids = await sampleIds({ ...base, ...where }, need, picked, difficulty);
        if (ids.length > 0) {
            ids.forEach(id => picked.add(id));
            matchLevel = level;
        }
    };

    if (subject) {
        const words = topicWords(topic, subject);
        if (words.length > 0) {
            await add({
                subject,
                OR: words.flatMap(w => [
                    { topic: { contains: w, mode: 'insensitive' } },
                    { text: { contains: w, mode: 'insensitive' } },
                ]),
            }, 'topic');
        }
        if (grade != null) {
            await add({ subject, OR: [{ grade: null }, { grade: { gte: grade - 1, lte: grade + 1 } }] }, 'subject');
        }
        await add({ subject }, 'subject');
    }
    await add({ subject: GENERAL_SUBJECT }, 'general');
    await add({}, 'general');

    if (picked.size === 0) return { questions: [], matchLevel: 'general', subject };
    return { questions: await loadForGame(Array.from(picked)), matchLevel, subject };
}

/** Tanlangan savollarni o'yin uchun yuklaydi: variantlar aralashtiriladi, "berilgan" hisobi oshiriladi. */
async function loadForGame(ids: string[]): Promise<BankQuestionOut[]> {
    const rows = await prisma.bankQuestion.findMany({ where: { id: { in: ids } } });
    await prisma.bankQuestion.updateMany({ where: { id: { in: ids } }, data: { timesShown: { increment: 1 } } });

    const byId = new Map(rows.map(r => [r.id, r]));
    return ids.flatMap(id => {
        const r = byId.get(id);
        if (!r) return [];
        const options = r.options as string[];
        const correctText = options[r.correctIndex];
        const shuffledOptions = shuffle(options);
        return [{
            id: r.id,
            subject: r.subject,
            text: r.text,
            options: shuffledOptions,
            correctIndex: shuffledOptions.indexOf(correctText),
            explanation: r.explanation,
            hint: r.hint,
        }];
    });
}

export interface BankCatalogSubject {
    subject: string;
    count: number;
    topics: { topic: string; count: number }[];
}

/** O'qituvchi tanlashi uchun: tasdiqlangan savollar fan va mavzular bo'yicha. */
export async function getBankCatalog(language = 'uz'): Promise<BankCatalogSubject[]> {
    const groups = await prisma.bankQuestion.groupBy({
        by: ['subject', 'topic'],
        where: { status: 'APPROVED', language },
        _count: true,
    });
    const bySubject = new Map<string, BankCatalogSubject>();
    for (const g of groups) {
        const s = bySubject.get(g.subject) ?? { subject: g.subject, count: 0, topics: [] };
        s.count += g._count;
        if (g.topic) s.topics.push({ topic: g.topic, count: g._count });
        bySubject.set(g.subject, s);
    }
    return Array.from(bySubject.values())
        .map(s => ({ ...s, topics: s.topics.sort((a, b) => a.topic.localeCompare(b.topic)) }))
        .sort((a, b) => a.subject.localeCompare(b.subject));
}

/** O'qituvchi tanlagan filtr bo'yicha tasdiqlangan savollardan tasodifiy tanlov (yetmasa — borini qaytaradi). */
export async function getBankQuestions(params: {
    subject: string;
    topic?: string;
    grade?: number | null;
    difficulty?: number;
    count: number;
    language?: string;
}): Promise<BankQuestionOut[]> {
    const { subject, topic, grade, difficulty, count, language = 'uz' } = params;
    const where = {
        status: 'APPROVED' as const,
        language,
        subject,
        ...(topic ? { topic } : {}),
        ...(grade != null ? { OR: [{ grade: null }, { grade: { gte: grade - 1, lte: grade + 1 } }] } : {}),
    };
    const ids = await sampleIds(where, count, new Set(), difficulty);
    return ids.length > 0 ? loadForGame(ids) : [];
}

export function fallbackNotice(result: FallbackResult): string {
    if (result.matchLevel === 'general') {
        return "AI hozir band. Bu mavzu bo'yicha ombor savollari topilmadi — tayyor umumiy savollar berildi.";
    }
    return "AI hozir band — savollar tayyor savollar omboridan tanlandi.";
}

/**
 * Muvaffaqiyatli AI generatsiyasini omborga PENDING holatida yozadi (tekshiruvdan keyin o'yinga chiqadi).
 * Fan aniqlanmasa saqlanmaydi. Xato bo'lsa jim o'tadi — asosiy javobga ta'sir qilmasin.
 */
export async function saveGeneratedToBank(
    questions: { text: string; options: string[]; correctIndex: number; explanation?: string; hint?: string }[],
    meta: { topic: string; grade?: number | null; difficulty?: number; language?: string; generatedBy?: string },
): Promise<void> {
    const subject = detectSubject(meta.topic);
    if (!subject) return;
    const language = meta.language ?? 'uz';
    try {
        await prisma.bankQuestion.createMany({
            data: questions
                .filter(q => q.text && q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4)
                .map(q => ({
                    subject,
                    topic: meta.topic.slice(0, 200),
                    grade: meta.grade ?? null,
                    difficulty: meta.difficulty ?? 2,
                    language,
                    text: q.text,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation ?? '',
                    hint: q.hint ?? '',
                    status: 'PENDING' as const,
                    source: 'AI' as const,
                    contentHash: contentHash(q.text, language),
                    generatedBy: meta.generatedBy ?? '',
                })),
            skipDuplicates: true,
        });
    } catch (err: any) {
        console.warn('[Bank] AI savollarini saqlashda xato:', err?.message?.slice(0, 160));
    }
}
