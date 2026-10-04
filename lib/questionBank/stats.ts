import { prisma } from '@/lib/prisma';
import { contentHash } from './bank';

// Shuncha javobdan keyin statistikaga ishonsa bo'ladi
const MIN_ANSWERS = 30;
// Bundan kam to'g'ri javob — kalit noto'g'ri bo'lishi ehtimoli katta
const SUSPICIOUS_RATE = 0.15;

function difficultyFor(rate: number): number {
    if (rate >= 0.85) return 1;
    if (rate < 0.4) return 3;
    return 2;
}

/**
 * O'yindagi javob natijalarini ombordagi savolga yozadi (savol matni bo'yicha topiladi;
 * ombordan bo'lmagan savollar e'tiborsiz qoldiriladi). Xato asosiy o'yinga ta'sir qilmasin.
 */
export async function recordAnswerStats(text: string, answered: number, correct: number): Promise<void> {
    if (answered <= 0) return;
    try {
        const q = await prisma.bankQuestion.findUnique({ where: { contentHash: contentHash(text) } });
        if (!q) return;

        const timesAnswered = q.timesAnswered + answered;
        const timesCorrect = q.timesCorrect + correct;
        const rate = timesCorrect / timesAnswered;
        const enough = timesAnswered >= MIN_ANSWERS;
        const suspicious = enough && rate < SUSPICIOUS_RATE && q.status === 'APPROVED';
        const pct = Math.round(rate * 100);

        await prisma.bankQuestion.update({
            where: { id: q.id },
            data: {
                timesAnswered: { increment: answered },
                timesCorrect: { increment: correct },
                ...(suspicious
                    ? {
                        status: 'PENDING',
                        verifiedAt: q.verifiedAt ?? new Date(),
                        reviewNote: `${timesAnswered} ta javobdan atigi ${pct}% to'g'ri — kalit xato bo'lishi mumkin`,
                    }
                    : enough && difficultyFor(rate) !== q.difficulty
                        ? { difficulty: difficultyFor(rate) }
                        : {}),
            },
        });
    } catch (err: any) {
        console.warn('[Bank stats] yozishda xato:', err?.message?.slice(0, 160));
    }
}
