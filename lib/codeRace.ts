// "Kod Cho'qqisi" — jonli Python musobaqasi.
// Kod talabaning brauzerida (Pyodide) ishlaydi; server faqat kim qaysi masalani yechganini saqlaydi.
//
// Redis kalitlari (har biri 4 soat yashaydi):
//   cr:{pin}          — o'yin (masalalar, holat) — faqat o'qituvchi yozadi
//   cr:{pin}:players  — hash: playerId → CodeRacer JSON. Har bir o'quvchi faqat o'z maydonini yozadi,
//                       shuning uchun 100 kishi bir vaqtda topshirsa ham qulf kerak emas.
//   cr:{pin}:code     — hash: "{playerId}:{task}" → yechim kodi (o'qituvchi ko'rib chiqishi uchun)

import { redis } from './gameState';

export const CR_TTL = 60 * 60 * 4;

export interface CodeTest { args: unknown[]; expected: unknown }

export interface CodeTask {
    title: string;
    prompt: string;
    functionName: string;
    starter: string;
    tests: CodeTest[];     // birinchi 2 tasi o'quvchiga misol sifatida ko'rsatiladi
}

export interface CodeRace {
    pin: string;
    title: string;
    hostKey: string;       // o'yinni boshqarish huquqi (faqat o'qituvchi brauzerida saqlanadi)
    tasks: CodeTask[];
    kind?: 'code' | 'english';   // yo'q bo'lsa — 'code' (Kod Cho'qqisi)
    questions?: import('./engRace').EngQuestion[];
    goal?: number;               // english: finishga yetish uchun nechta to'g'ri javob kerak
    durationSec: number;
    status: 'lobby' | 'running' | 'ended';
    startedAt?: number;
    endedAt?: number;
    xpAwarded?: boolean;
}

export interface CodeRacer {
    id: string;
    nickname: string;
    avatar: string;
    userId?: string;
    solved: number;        // nechta masala yechildi (= hozirgi pog'ona)
    solvedAt: number[];    // har bir masala yechilgan vaqt (ms, o'yin boshidan)
    attempts: number;
    joinedAt: number;
}

const raceKey = (pin: string) => `cr:${pin}`;
const playersKey = (pin: string) => `cr:${pin}:players`;
const codeKey = (pin: string) => `cr:${pin}:code`;

const parse = <T>(raw: unknown): T | null =>
    raw == null ? null : (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;

export async function getRace(pin: string): Promise<CodeRace | null> {
    return parse<CodeRace>(await redis.get(raceKey(pin)));
}

export async function saveRace(race: CodeRace): Promise<void> {
    await redis.set(raceKey(race.pin), JSON.stringify(race), { ex: CR_TTL });
}

export async function getRacers(pin: string): Promise<CodeRacer[]> {
    const all = await redis.hgetall<Record<string, unknown>>(playersKey(pin));
    return all ? Object.values(all).map(v => parse<CodeRacer>(v)!).filter(Boolean) : [];
}

export async function getRacer(pin: string, id: string): Promise<CodeRacer | null> {
    return parse<CodeRacer>(await redis.hget(playersKey(pin), id));
}

export async function saveRacer(pin: string, racer: CodeRacer): Promise<void> {
    await redis.hset(playersKey(pin), { [racer.id]: JSON.stringify(racer) });
    await redis.expire(playersKey(pin), CR_TTL);
}

export async function saveSolution(pin: string, playerId: string, task: number, code: string): Promise<void> {
    await redis.hset(codeKey(pin), { [`${playerId}:${task}`]: code.slice(0, 20_000) });
    await redis.expire(codeKey(pin), CR_TTL);
}

export async function getSolutions(pin: string): Promise<Record<string, string>> {
    return (await redis.hgetall<Record<string, string>>(codeKey(pin))) ?? {};
}

/** Ko'p masala yechgan yuqorida; teng bo'lsa — oxirgi masalani tezroq yechgan. */
export function rankRacers(racers: CodeRacer[]): CodeRacer[] {
    return [...racers].sort((a, b) =>
        b.solved - a.solved
        || (a.solvedAt[a.solved - 1] ?? Infinity) - (b.solvedAt[b.solved - 1] ?? Infinity)
        || a.joinedAt - b.joinedAt);
}

export const publicRacer = (r: CodeRacer) => ({
    id: r.id, nickname: r.nickname, avatar: r.avatar, solved: r.solved,
    lastSolvedAt: r.solvedAt[r.solved - 1] ?? null, attempts: r.attempts,
});

/** Finishgacha nechta pog'ona: kod — masalalar soni, ingliz tili — maqsad (goal). */
export const raceSteps = (race: CodeRace) => race.kind === 'english' ? (race.goal ?? 15) : race.tasks.length;

/** O'quvchiga yuboriladigan masala: kodni tekshirish uchun testlar ham kerak (tekshiruv brauzerda). */
export const publicTasks = (race: CodeRace) => race.status === 'lobby' || race.kind === 'english' ? [] : race.tasks;

export async function generateRacePin(): Promise<string> {
    for (let i = 0; i < 20; i++) {
        const pin = String(Math.floor(100000 + Math.random() * 900000));
        // Oddiy o'yin xonasi bilan ham to'qnashmasin — /play sahifasi ikkalasini bitta PIN maydonidan qabul qiladi
        const [a, b] = await Promise.all([redis.exists(raceKey(pin)), redis.exists(`room:${pin}`)]);
        if (!a && !b) return pin;
    }
    throw new Error("PIN yaratib bo'lmadi, qayta urinib ko'ring");
}

/** O'qituvchi kiritgan masalalarni tekshiradi va tozalaydi. */
export function sanitizeTasks(input: unknown): { tasks: CodeTask[]; error?: string } {
    if (!Array.isArray(input) || input.length === 0) return { tasks: [], error: "Kamida 1 ta masala kerak" };
    if (input.length > 30) return { tasks: [], error: "Ko'pi bilan 30 ta masala" };
    const tasks: CodeTask[] = [];
    for (const [i, t] of input.entries()) {
        const n = i + 1;
        const fn = String(t?.functionName ?? '').trim();
        if (!String(t?.prompt ?? '').trim()) return { tasks: [], error: `${n}-masala: shart yozilmagan` };
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(fn)) return { tasks: [], error: `${n}-masala: funksiya nomi noto'g'ri ("${fn}")` };
        if (!Array.isArray(t?.tests) || t.tests.length === 0) return { tasks: [], error: `${n}-masala: kamida 1 ta test kerak` };
        const tests: CodeTest[] = [];
        for (const test of t.tests.slice(0, 20)) {
            if (!Array.isArray(test?.args) || !('expected' in test)) return { tasks: [], error: `${n}-masala: test formati noto'g'ri` };
            tests.push({ args: test.args, expected: test.expected });
        }
        tasks.push({
            title: String(t.title ?? `${n}-masala`).slice(0, 80),
            prompt: String(t.prompt).slice(0, 2000),
            functionName: fn,
            starter: String(t.starter || `def ${fn}():\n    pass\n`).slice(0, 2000),
            tests,
        });
    }
    return { tasks };
}
