import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ROOM_TTL = 60 * 60 * 2; // 2 hours

export interface Player {
    id: string;
    nickname: string;
    avatar: string;          // emoji avatar
    score: number;
    streak: number;          // current consecutive correct answers
    longestStreak: number;   // best streak in this game
    correctCount: number;    // total correct answers
    totalAnswers: number;    // total questions answered
    totalResponseMs: number; // sum of response times in ms (for avg speed badge)
    fastestAnswerMs: number; // fastest single answer in ms
    teamId?: string;         // team mode: which team this player belongs to
    hintsUsed?: number;      // anagram: accumulated hints used
    userId?: string;         // tizimga kirgan o'quvchi — o'yin oxirida XP shu akkauntga yoziladi
}

/** One team in team-mode */
export interface Team {
    id: string;               // 'team_a', 'team_b', ...
    name: string;             // 'Koderlar', 'Hakerlar', ... (customisable via Pro)
    emoji: string;            // rocket emoji themed per team
    color: string;            // hex accent color
    score: number;            // running total (sum of members)
    health: number;           // 0-100, loses 10 on each wrong answer by a member
    comboCount: number;       // how many times all members answered correctly
    shieldActiveUntil: number;// ms timestamp (0 = no shield)
    shieldUsed: boolean;      // can only use once per game
    answeredCorrectly: string[]; // playerIds who got current question RIGHT
    answeredTotal: string[];     // playerIds who answered current question
}

export interface MatchPair {
    term: string;
    definition: string;
    termImage?: string;       // Pro: image for the term card
    definitionImage?: string; // Pro: image for the definition card
}

export interface Question {
    id: string;
    type?: 'multiple' | 'truefalse' | 'order' | 'match' | 'blitz' | 'anagram';
    text: string;
    options: string[];        // for 'order': stored in CORRECT sequence
    optionImages?: string[];  // Pro: optional image URL per option (order type)
    correctOptions: number[]; // for 'order': [0,1,2,...] correct indices
    pairs?: MatchPair[];      // for 'match' type
    timeLimit: number;
    imageUrl?: string;
    explanation?: string;    // "Did you know?" text shown after question
}

/**
 * Ko'p tanlovli savollarda variantlar tartibini aralashtiradi (correctOptions mos ravishda qayta hisoblanadi).
 * Manba (AI, kutubxona, qo'lda) to'g'ri javobni doim bir xil o'ringa qo'ygan bo'lsa ham o'quvchi buni sezmaydi.
 */
export function shuffleChoiceOptions(questions: Question[]): Question[] {
    return questions.map(q => {
        const isChoice = (q.type ?? 'multiple') === 'multiple';
        if (!isChoice || !Array.isArray(q.options) || q.options.length < 3) return q;

        const order = q.options.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        const correct = new Set(q.correctOptions ?? []);
        return {
            ...q,
            options: order.map(i => q.options[i]),
            optionImages: q.optionImages ? order.map(i => q.optionImages![i]) : undefined,
            correctOptions: order.map((oldIdx, newIdx) => (correct.has(oldIdx) ? newIdx : -1)).filter(i => i !== -1),
        };
    });
}


export interface GameRoom {
    pin: string;
    teacherChannelId: string;
    quizTitle: string;
    questions: Question[];
    players: Player[];
    currentQuestionIndex: number;
    status: 'lobby' | 'question' | 'leaderboard' | 'ended';
    xpAwarded?: boolean;        // XP bir o'yin uchun faqat bir marta beriladi
    questionStartTime?: number;
    answeredPlayerIds: string[];
    // Joriy savol bo'yicha to'g'ri javoblar soni (index boshqa bo'lsa — eski savolniki, 0 deb hisoblanadi)
    questionStats?: { index: number; correct: number };
    // Team mode
    teamMode?: boolean;
    teamCount?: number;
    teams?: Team[];
    customTeamNames?: string[]; // Pro: teacher-set names
    gameMode?: 'classic' | 'tezkor';
    // Joriy savolda o'quvchilarga ko'rsatilgan holat — ballash va qayta ulanish shu bilan bir xil bo'lsin
    currentOrder?: number[];          // 'order': ko'rsatilgan tartib (asl indekslar)
    currentScramble?: string | null;  // 'anagram': aralashtirilgan so'z
}

// ─── Atomik yangilash ──────────────────────────────────────────────────────────
// Xona bitta Redis kalitida saqlanadi va route'lar uni o'qib-o'zgartirib-yozadi. 20 ta o'quvchi bir vaqtda
// kirsa yoki javob bersa, qulfsiz yozuvlar bir-birini o'chirib yuboradi (o'yinchi yoki javob yo'qoladi,
// kech kelgan javob xonani oldingi savolga qaytarib yozadi). Shuning uchun har bir o'zgartirish qulf ichida.
// Har bir o'zgartirish ikki Redis so'rovidan iborat: (1) qulf olish + xonani o'qish, (2) xonani yozish + qulfni ochish.
// Ikkalasi ham atomik Lua skripti — qulf ichida vaqt minimal, 20 ta javob tez navbatdan o'tadi.
const LOCK_TTL_MS = 5_000;
const LOCK_WAIT_MS = 8_000;
const ACQUIRE_SCRIPT = `if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  local v = redis.call('GET', KEYS[2])
  if v then return v end
  return ''
end
return false`;
const COMMIT_SCRIPT = `if redis.call('GET', KEYS[1]) == ARGV[1] then
  if ARGV[2] ~= '' then redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3]) end
  redis.call('DEL', KEYS[1])
  return 1
end
return 0`;
const RELEASE_SCRIPT = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`;

/**
 * Xonani qulf ostida o'qib, fn ichida o'zgartirishga beradi va natijani atomik saqlaydi.
 * fn xonani (yoki xona topilmasa null) oladi va uni joyida o'zgartiradi. fn xato tashlasa — hech narsa saqlanmaydi.
 */
export async function withRoom<T>(pin: string, fn: (room: GameRoom | null) => Promise<T> | T): Promise<T> {
    const lockKey = `lock:room:${pin}`;
    const roomKey = `room:${pin}`;
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const deadline = Date.now() + LOCK_WAIT_MS;

    let room: GameRoom | null;
    let delay = 5;
    for (;;) {
        const raw = await redis.eval(ACQUIRE_SCRIPT, [lockKey, roomKey], [token, String(LOCK_TTL_MS)]);
        if (raw !== null && raw !== undefined) {
            room = raw === '' ? null : (typeof raw === 'string' ? JSON.parse(raw) : raw) as GameRoom;
            break;
        }
        if (Date.now() > deadline) throw new Error("O'yin xonasi band, qayta urinib ko'ring");
        await new Promise(r => setTimeout(r, delay + Math.random() * delay));
        delay = Math.min(delay * 1.5, 40);
    }

    let committed = false;
    try {
        const result = await fn(room);
        const ok = await redis.eval(COMMIT_SCRIPT, [lockKey, roomKey], [token, room ? JSON.stringify(room) : '', String(ROOM_TTL)]);
        committed = true;
        if (Number(ok) !== 1) throw new Error("O'yin xonasi band edi, qayta urinib ko'ring");
        return result;
    } finally {
        if (!committed) await redis.eval(RELEASE_SCRIPT, [lockKey], [token]).catch(() => {});
    }
}

function shuffleArr<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Joriy savol uchun o'quvchilarga ko'rsatiladigan tartib/aralashtirishni tayyorlaydi (savol boshlanganda bir marta). */
export function prepareCurrentQuestion(room: GameRoom): void {
    const q = room.questions[room.currentQuestionIndex];
    room.currentOrder = undefined;
    room.currentScramble = undefined;
    if (!q) return;
    if (q.type === 'order') {
        room.currentOrder = shuffleArr(q.options.map((_, i) => i));
    } else if (q.type === 'anagram') {
        const word = q.options[0] || '';
        let scrambled = shuffleArr(word.split('')).join('');
        if (word.length > 1 && scrambled === word) scrambled = shuffleArr(word.split('')).join('');
        room.currentScramble = scrambled;
    }
}

/** O'quvchilarga yuboriladigan joriy savol (to'g'ri javobsiz) — start, next va qayta ulanish uchun bir xil. */
export function questionPayload(room: GameRoom) {
    const q = room.questions[room.currentQuestionIndex];
    if (!q) return null;
    const order = q.type === 'order' ? (room.currentOrder ?? q.options.map((_, i) => i)) : null;
    return {
        questionIndex: room.currentQuestionIndex,
        total: room.questions.length,
        type: q.type || 'multiple',
        text: q.text,
        options: order ? order.map(i => q.options[i]) : q.type === 'anagram' ? [] : q.options,
        optionImages: order && q.optionImages ? order.map(i => q.optionImages![i]) : (q.optionImages || null),
        pairs: q.pairs || null,
        anagramScrambled: q.type === 'anagram' ? (room.currentScramble ?? null) : null,
        anagramWordLength: q.type === 'anagram' ? (q.options[0] || '').length : null,
        timeLimit: q.timeLimit,
        imageUrl: q.imageUrl,
        questionStartTime: room.questionStartTime,
    };
}

export async function getRoom(pin: string): Promise<GameRoom | null> {
    return await redis.get<GameRoom>(`room:${pin}`);
}

export async function saveRoomData(room: GameRoom): Promise<void> {
    await redis.set(`room:${room.pin}`, room, { ex: ROOM_TTL });
}

export async function deleteRoom(pin: string): Promise<void> {
    await redis.del(`room:${pin}`);
}

export function generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Recalculate team.score from sum of members' individual scores */
export function recalcTeamScores(room: GameRoom): void {
    if (!room.teams) return;
    room.teams.forEach(t => {
        t.score = room.players.filter(p => p.teamId === t.id).reduce((s, p) => s + p.score, 0);
    });
}

/** Reset per-question answered tracking on teams */
export function resetTeamQuestion(teams: Team[]): void {
    teams.forEach(t => { t.answeredCorrectly = []; t.answeredTotal = []; });
}

/** Sorted team leaderboard */
export function getTeamLeaderboard(teams: Team[]) {
    return [...teams]
        .sort((a, b) => b.score - a.score)
        .map((t, i) => ({ ...t, rank: i + 1 }));
}

export function getLeaderboard(players: Player[]) {
    return [...players]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((p, i) => ({
            nickname: p.nickname,
            avatar: p.avatar,
            score: p.score,
            streak: p.streak,
            longestStreak: p.longestStreak,
            rank: i + 1,
        }));
}

export function calculateScore(
    isCorrect: boolean,
    timeRemainingMs: number,
    totalTimeLimitMs: number,
    streak: number
): number {
    if (!isCorrect) return 0;
    const speedFactor = timeRemainingMs / totalTimeLimitMs;
    const base = Math.round(200 + 800 * Math.max(0, Math.min(1, speedFactor)));
    // 1.2x multiplier for streak >= 3
    const multiplier = streak >= 3 ? 1.2 : 1;
    return Math.round(base * multiplier);
}

/** Blitz scoring: exponential streak multiplier + speed bonus */
export function calculateBlitzScore(
    isCorrect: boolean,
    streak: number,
    elapsedMs: number,
    timeLimitMs: number
): number {
    if (!isCorrect) return 0;
    const streakMult = Math.pow(1.5, Math.max(0, streak - 1));
    const base = Math.min(1000, Math.round(100 * streakMult));
    const speedBonus = elapsedMs / timeLimitMs < 0.33 ? Math.round(base * 0.2) : 0;
    return base + speedBonus;
}

/** Anagram scoring: word_length × 100 × time_fraction − hint_penalty */
export function calculateAnagramScore(
    isCorrect: boolean,
    wordLength: number,
    completedMs: number,
    timeLimitMs: number,
    hintsUsed: number
): number {
    if (!isCorrect) return 0;
    const timeFrac = Math.max(0.1, (timeLimitMs - completedMs) / timeLimitMs);
    const base = Math.round(wordLength * 100 * timeFrac);
    return Math.max(0, base - hintsUsed * 200);
}

/** Compute post-game award badges from final player list */
export function computeBadges(players: Player[]) {
    if (players.length === 0) return [];
    const badges: { nickname: string; avatar: string; badge: string; icon: string; desc: string }[] = [];

    // "Lightning Fast" — lowest avg response time (with at least 1 answer)
    const withTime = players.filter(p => p.totalAnswers > 0);
    if (withTime.length > 0) {
        const fastest = withTime.reduce((a, b) =>
            a.totalResponseMs / a.totalAnswers < b.totalResponseMs / b.totalAnswers ? a : b);
        badges.push({ nickname: fastest.nickname, avatar: fastest.avatar, badge: 'Chaqmoq Tez', icon: '⚡', desc: 'Eng tez javob beruvchi' });
    }

    // "The Professor" — highest accuracy
    const withAnswers = players.filter(p => p.totalAnswers > 0);
    if (withAnswers.length > 0) {
        const prof = withAnswers.reduce((a, b) =>
            a.correctCount / a.totalAnswers > b.correctCount / b.totalAnswers ? a : b);
        badges.push({ nickname: prof.nickname, avatar: prof.avatar, badge: 'Professor', icon: '🎓', desc: 'Eng yuqori aniqlik' });
    }

    // "Unstoppable" — longest streak
    const topStreak = [...players].sort((a, b) => b.longestStreak - a.longestStreak)[0];
    if (topStreak && topStreak.longestStreak >= 2) {
        badges.push({ nickname: topStreak.nickname, avatar: topStreak.avatar, badge: "To'xtatib Bo'lmas", icon: '🔥', desc: `${topStreak.longestStreak} ketma-ket to'g'ri` });
    }

    // "Comeback King" — player with highest final score whose correctCount ratio
    // was below 50% at some point but finished top 3
    // Approximation: player ranked last by speed (slowest avg) but finished top 3 by score
    const sorted = [...players].sort((a, b) => b.score - a.score);
    if (sorted.length >= 4) {
        // Find fastest scorer (top 3) who had the lowest accuracy mid-game proxy (slowest start)
        const top3 = sorted.slice(0, 3);
        const comingBack = top3.find(p => {
            // Proxy: high score but low initial speed (high totalResponseMs per answer)
            const avgMs = p.totalAnswers > 0 ? p.totalResponseMs / p.totalAnswers : 0;
            const slowThreshold = 6000; // > 6s avg response used as proxy for slow start
            return avgMs > slowThreshold && p.score > 0;
        });
        if (comingBack) {
            badges.push({ nickname: comingBack.nickname, avatar: comingBack.avatar, badge: 'Qaytish Qiroli', icon: '👑', desc: 'Oxirdan birinchiga!' });
        }
    }

    return badges;
}

