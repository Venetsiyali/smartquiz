/** JSON qiymatini Python ko'rinishida yozadi: true → True, null → None. */
export function pyRepr(v: unknown): string {
    if (v === null || v === undefined) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (typeof v === 'string') return JSON.stringify(v).replace(/^"|"$/g, "'").replace(/\\"/g, '"');
    if (Array.isArray(v)) return `[${v.map(pyRepr).join(', ')}]`;
    if (typeof v === 'object') return `{${Object.entries(v as Record<string, unknown>).map(([k, x]) => `'${k}': ${pyRepr(x)}`).join(', ')}}`;
    return String(v);
}

export const callRepr = (fn: string, args: unknown[]) => `${fn}(${args.map(pyRepr).join(', ')})`;

export function formatClock(ms: number): string {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const AVATARS = ['🧑‍💻', '👩‍💻', '🦊', '🐼', '🐯', '🦁', '🐸', '🐙', '🦄', '🐲', '🚀', '🤖', '👾', '🧠', '⚡', '🔥'];

export interface RacerView { id: string; nickname: string; avatar: string; solved: number; lastSolvedAt: number | null }
