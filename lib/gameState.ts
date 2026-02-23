import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ROOM_TTL = 60 * 60 * 2; // 2 hours

export interface Player {
    id: string;
    nickname: string;
    score: number;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctOptions: number[];
    timeLimit: number;
    imageUrl?: string;
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
        .slice(0, 5)
        .map((p, i) => ({ nickname: p.nickname, score: p.score, rank: i + 1 }));
}

export function calculateScore(
    isCorrect: boolean,
    timeRemainingMs: number,
    totalTimeLimitMs: number
): number {
    if (!isCorrect) return 0;
    const speedFactor = timeRemainingMs / totalTimeLimitMs;
    return Math.round(200 + 800 * Math.max(0, Math.min(1, speedFactor)));
}
