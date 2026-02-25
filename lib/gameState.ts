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


export interface GameRoom {
    pin: string;
    teacherChannelId: string;
    quizTitle: string;
    questions: Question[];
    players: Player[];
    currentQuestionIndex: number;
    status: 'lobby' | 'question' | 'leaderboard' | 'ended';
    questionStartTime?: number;
    answeredPlayerIds: string[];
    // Team mode
    teamMode?: boolean;
    teamCount?: number;
    teams?: Team[];
    customTeamNames?: string[]; // Pro: teacher-set names
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

/** Assign players to teams round-robin after shuffling */
export function assignTeams(players: Player[], teams: Team[]): void {
    // Fisher-Yates shuffle player order for fairness
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffled.forEach((p, i) => {
        const team = teams[i % teams.length];
        p.teamId = team.id;
    });
    // Populate team member lists
    teams.forEach(t => { t.answeredCorrectly = []; t.answeredTotal = []; });
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

