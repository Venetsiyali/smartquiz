/**
 * Standart test formatidagi matnni regex bilan ajratib olishga urinadi:
 *   1. Savol matni?
 *   A) variant 1
 *   B) variant 2
 *   C) variant 3
 *   D) variant 4
 *   Javob: B
 *
 * Raqam/harf ajratuvchilari ".", ")" bo'lishi mumkin, harflar katta/kichik bo'lishi mumkin.
 * Format aniqlanmasa (savollarning kamida yarmi to'liq parse bo'lmasa) — bo'sh massiv qaytaradi,
 * shu holatda chaqiruvchi tomon matnni AI'ga yo'naltirishi kerak.
 */

export interface ParsedTestQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

const QUESTION_START = /^\s*(\d{1,3})[.)]\s+/;
const OPTION_LINE = /^\s*([A-Da-d])[.)]\s*(.+?)\s*$/;
const ANSWER_LINE = /^\s*(?:javob|to'g'ri\s*javob|javоб)\s*[:\-]?\s*([A-Da-d])\b/i;

export function parseStructuredTest(rawText: string): ParsedTestQuestion[] {
    const lines = rawText.split(/\r?\n/).map(l => l.trimEnd());

    // Matnni har bir savol bloki bo'yicha bo'lib olamiz
    const blocks: string[][] = [];
    let current: string[] | null = null;
    for (const line of lines) {
        if (QUESTION_START.test(line)) {
            if (current) blocks.push(current);
            current = [line];
        } else if (current) {
            current.push(line);
        }
    }
    if (current) blocks.push(current);

    if (blocks.length === 0) return [];

    const results: ParsedTestQuestion[] = [];

    for (const block of blocks) {
        const questionLines: string[] = [];
        const options: { letter: string; text: string }[] = [];
        let answerLetter: string | null = null;

        for (const line of block) {
            const optMatch = line.match(OPTION_LINE);
            const ansMatch = line.match(ANSWER_LINE);
            if (ansMatch) {
                answerLetter = ansMatch[1].toUpperCase();
            } else if (optMatch) {
                options.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
            } else if (options.length === 0) {
                // Hali variant boshlanmagan — savol matniga tegishli qator
                questionLines.push(line.replace(QUESTION_START, '').trim());
            }
        }

        const questionText = questionLines.join(' ').trim();
        const validOptions = options.filter(o => o.text.length > 0);

        if (questionText && validOptions.length === 4 && answerLetter) {
            const correctIndex = validOptions.findIndex(o => o.letter === answerLetter);
            if (correctIndex !== -1) {
                results.push({
                    question: questionText,
                    options: validOptions.map(o => o.text),
                    correctIndex,
                    explanation: '',
                });
            }
        }
    }

    // Format "aniqlangan" deb hisoblanishi uchun bloklarning kamida yarmi muvaffaqiyatli parse bo'lishi shart
    if (results.length === 0 || results.length < blocks.length / 2) {
        return [];
    }

    return results;
}
