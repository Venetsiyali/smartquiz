import { parseTextFormat, stripMarkdown } from './questionBank/importParser';
import { GENERAL_SUBJECT } from './questionBank/subjects';
import type { EngQuestion } from './engRace';

/**
 * O'qituvchi formatidagi matnni (1. Savol / A) … D) / Javob: B / Izoh: … / Mavzu: …) poyga savollariga aylantiradi.
 * Savollar ombori importidagi parser bilan bir xil — Word/ChatGPT'dan nusxalangan matn ham o'qiladi.
 */
export function textToQuestions(text: string): { questions: EngQuestion[]; errors: { ref: string; reason: string }[] } {
    const { questions, errors } = parseTextFormat(stripMarkdown(text), { subject: GENERAL_SUBJECT });
    return {
        questions: questions.map(q => ({
            q: q.text,
            options: q.options,
            answer: q.options[q.correctIndex],
            explain: q.explanation || undefined,
            topic: q.topic || undefined,
        })),
        errors,
    };
}
