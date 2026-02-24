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
}

export interface Question {
    id: string;
    type?: 'multiple' | 'truefalse';
    text: string;
    options: string[];
    correctOptions: number[];
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
        badges.push({ nickname: topStreak.nickname, avatar: topStreak.avatar, badge: 'To\'xtatib Bo\'lmas', icon: '🔥', desc: `${topStreak.longestStreak} ketma-ket to'g'ri` });
    }

    return badges;
}
