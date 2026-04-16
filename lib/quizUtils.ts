import { Prisma } from '@prisma/client';

/** Returns the number of questions in a quiz's JSON field. */
export function getQuestionCount(questions: Prisma.JsonValue): number {
    return Array.isArray(questions) ? (questions as unknown[]).length : 0;
}
