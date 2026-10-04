import { z } from 'zod';

// AI/fayldan qaytgan xom savol — 4 ta variant va to'g'ri javob indeksi bilan.
export const WheelAIQuestionSchema = z.object({
    question: z.string().min(3),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().default(''),
});

export const WheelAIQuestionListSchema = z.array(WheelAIQuestionSchema).min(1);

export type WheelAIQuestion = z.infer<typeof WheelAIQuestionSchema>;

// Sessiyaga saqlash uchun kelayotgan savol (source ko'rsatilgan holda).
export const WheelSaveQuestionSchema = WheelAIQuestionSchema.extend({
    source: z.enum(['AI', 'FILE', 'MANUAL', 'BANK']).default('MANUAL'),
});

export const WheelSaveQuestionsBodySchema = z.object({
    sessionId: z.string().min(1),
    questions: z.array(WheelSaveQuestionSchema).min(1),
});

export const WheelGenerateBodySchema = z.object({
    topic: z.string().min(2),
    grade: z.string().optional().default(''),
    count: z.number().int().min(1).max(30).default(10),
    difficulty: z.enum(['oson', "o'rta", 'qiyin']).default("o'rta"),
    provider: z.string().optional(),
});

export const WheelPlayersBodySchema = z.object({
    sessionId: z.string().min(1),
    names: z.array(z.string().trim().min(1)).min(1),
});

export const WheelAnswerBodySchema = z.object({
    questionId: z.string().min(1),
    playerId: z.string().min(1),
    selectedIndex: z.number().int().min(0).max(3),
});
