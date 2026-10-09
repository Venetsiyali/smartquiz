// "Grammar Race" — ingliz tili grammatikasi poygasi. "Kod Cho'qqisi" bilan bir xil saqlash va lobbi tizimidan
// foydalanadi; farqi — javob serverda tekshiriladi (to'g'ri javob o'quvchiga oldindan yuborilmaydi).

import type { CodeRace, CodeRacer } from './codeRace';

export interface EngQuestion {
    q: string;            // gap, bo'sh joy "___" bilan
    options?: string[];   // bo'lsa — variant tanlash, bo'lmasa — o'quvchi o'zi yozadi
    answer: string;       // to'g'ri javob (variantlardan biri yoki yoziladigan so'z)
    accept?: string[];    // yozma javobda qabul qilinadigan boshqa variantlar (masalan, qisqartma)
    explain?: string;     // xato bo'lsa ko'rsatiladigan qisqa izoh
    topic?: string;
}

export const normalize = (s: string) => s.trim().toLowerCase()
    .replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').replace(/[.!?]+$/, '');

export function isCorrect(q: EngQuestion, given: string): boolean {
    const g = normalize(given);
    return [q.answer, ...(q.accept ?? [])].some(a => normalize(a) === g);
}

/** Har o'quvchiga savollar boshqa tartibda — yonidagidan ko'chirib bo'lmaydi. ID'dan barqaror (seeded) aralashtirish. */
export function playerOrder(playerId: string, count: number): number[] {
    let h = 2166136261;
    for (const c of playerId) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
}

/** O'quvchining navbatdagi savoli (racer.attempts — nechta savolga javob bergani; savollar tugasa qaytadan aylanadi). */
export function currentQuestion(race: CodeRace, racer: CodeRacer): EngQuestion | null {
    const qs = race.questions ?? [];
    if (qs.length === 0) return null;
    const order = playerOrder(racer.id, qs.length);
    return qs[order[racer.attempts % qs.length]];
}

/** O'quvchiga to'g'ri javobsiz ko'rinish. Variantlar ham aralashtiriladi. */
export function publicQuestion(q: EngQuestion | null, seed: string) {
    if (!q) return null;
    const options = q.options ? playerOrder(seed + q.q, q.options.length).map(i => q.options![i]) : null;
    return { q: q.q, options, topic: q.topic ?? null };
}

export function sanitizeQuestions(input: unknown): { questions: EngQuestion[]; error?: string } {
    if (!Array.isArray(input) || input.length < 3) return { questions: [], error: 'Kamida 3 ta savol kerak' };
    if (input.length > 200) return { questions: [], error: "Ko'pi bilan 200 ta savol" };
    const questions: EngQuestion[] = [];
    for (const [i, x] of input.entries()) {
        const n = i + 1;
        const q = String(x?.q ?? '').trim();
        const answer = String(x?.answer ?? '').trim();
        if (!q || !answer) return { questions: [], error: `${n}-savol: gap yoki javob yo'q` };
        let options: string[] | undefined;
        if (Array.isArray(x.options) && x.options.length > 0) {
            options = x.options.map((o: unknown) => String(o).trim()).filter(Boolean).slice(0, 6);
            if (options!.length < 2) return { questions: [], error: `${n}-savol: kamida 2 ta variant kerak` };
            if (!options!.some(o => normalize(o) === normalize(answer))) return { questions: [], error: `${n}-savol: javob variantlar orasida yo'q` };
        }
        questions.push({
            q: q.slice(0, 300), answer: answer.slice(0, 100), options,
            accept: Array.isArray(x.accept) ? x.accept.map(String).slice(0, 5) : undefined,
            explain: x.explain ? String(x.explain).slice(0, 300) : undefined,
            topic: x.topic ? String(x.topic).slice(0, 40) : undefined,
        });
    }
    return { questions };
}
