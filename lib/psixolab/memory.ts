// Xotira sinovi: vaqt bosqichlari va talaba yozgan soʻzlarni asl roʻyxat bilan solishtirish.

export interface MemoryConfig {
    items: string[];
    kind: 'words' | 'numbers' | 'sentence';
    intervalMs: number;   // har bir soʻz ekranda turadigan vaqt (standart 2000)
    recallSec: number;    // eslab yozish vaqti (standart 60)
    setId?: string;
}

export const GET_READY_MS = 3000;   // boshlanishdan oldingi "Diqqat!" sanog'i
export const SUBMIT_GRACE_MS = 5000; // tarmoq kechikishi uchun qoʻshimcha vaqt

/** Oʻyin boshidan hisoblangan bosqich. */
export function memoryPhase(cfg: MemoryConfig, startedAt: number, now: number) {
    const t = now - startedAt;
    const showEnd = GET_READY_MS + cfg.items.length * cfg.intervalMs;
    const recallEnd = showEnd + cfg.recallSec * 1000;
    if (t < GET_READY_MS) return { phase: 'ready' as const, msLeft: GET_READY_MS - t, index: -1, showEnd, recallEnd };
    if (t < showEnd) {
        const index = Math.floor((t - GET_READY_MS) / cfg.intervalMs);
        return { phase: 'show' as const, msLeft: showEnd - t, index, showEnd, recallEnd };
    }
    if (t < recallEnd) return { phase: 'recall' as const, msLeft: recallEnd - t, index: -1, showEnd, recallEnd };
    return { phase: 'done' as const, msLeft: 0, index: -1, showEnd, recallEnd };
}

/** Oʻyinning umumiy davomiyligi (soniya) — poyga dvigatelining durationSec maydoni uchun. */
export const memoryDurationSec = (cfg: MemoryConfig) =>
    Math.ceil((GET_READY_MS + cfg.items.length * cfg.intervalMs) / 1000) + cfg.recallSec;

/** Katta-kichik harf, ё/е, turli apostroflar (oʻ, o', o`, o‘) va tinish belgilarini bir xil koʻrinishga keltiradi. */
export function normalizeWord(s: string): string {
    return s.toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[ʻʼ'‘’`´]/g, "'")
        .replace(/[.,!?;:«»"()\-–—]/g, '')
        .trim();
}

function levenshtein(a: string, b: string): number {
    const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = dp[0]; dp[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = dp[j];
            dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return dp[b.length];
}

/**
 * Talaba yozgan matndan qaysi pozitsiyadagi elementlar eslanganini aniqlaydi (0 dan).
 * Har bir element bir marta hisoblanadi; 5+ harfli soʻzlarda bitta harf xatosi kechiriladi (sonlarda — yoʻq).
 */
export function matchRecall(items: string[], answer: string): number[] {
    const tokens = answer.split(/[\s,;\n]+/).map(normalizeWord).filter(Boolean);
    const targets = items.map(normalizeWord);
    const used = new Set<number>();
    for (const tok of tokens) {
        let hit = targets.findIndex((t, i) => !used.has(i) && t === tok);
        if (hit < 0) hit = targets.findIndex((t, i) => !used.has(i) && t.length >= 5 && !/^\d+$/.test(t) && levenshtein(t, tok) <= 1);
        if (hit >= 0) used.add(hit);
    }
    return Array.from(used).sort((a, b) => a - b);
}
