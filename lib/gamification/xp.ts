import { prisma } from '@/lib/prisma';

export const XP_REWARDS = {
    QUIZ_PARTICIPATION: 10,
    CORRECT_ANSWER: 5,
    PERFECT_SCORE_BONUS: 20,
} as const;

export interface LevelDef {
    min: number;
    max: number;
    name: string;
    color: string;
    icon: string;
}

export const LEVELS: LevelDef[] = [
    { min: 0,    max: 100,      name: 'Yangi Zukko',  color: '#00E676', icon: '🌱' },
    { min: 100,  max: 300,      name: 'Bilimdon',     color: '#3b82f6', icon: '📚' },
    { min: 300,  max: 600,      name: 'Tadqiqotchi',  color: '#8b5cf6', icon: '🔬' },
    { min: 600,  max: 1000,     name: 'Ekspert',      color: '#f97316', icon: '🏆' },
    { min: 1000, max: Infinity, name: 'Ustoz',        color: '#FFD700', icon: '⭐' },
];

export function getLevelFromXP(xp: number): LevelDef {
    return LEVELS.find(l => xp >= l.min && xp < l.max) ?? LEVELS[LEVELS.length - 1];
}

export function getXPProgressPercent(xp: number): number {
    const level = getLevelFromXP(xp);
    if (level.max === Infinity) return 100;
    const range = level.max - level.min;
    return Math.min(100, Math.floor(((xp - level.min) / range) * 100));
}

export async function addXP(
    userId: string,
    amount: number,
): Promise<{ newXP: number; levelUp: boolean; newLevelName: string }> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
        if (!user) return { newXP: 0, levelUp: false, newLevelName: '' };

        const oldLevel = getLevelFromXP(user.xp);
        const newXP = user.xp + amount;
        const newLevel = getLevelFromXP(newXP);

        await prisma.user.update({ where: { id: userId }, data: { xp: newXP } });

        return {
            newXP,
            levelUp: newLevel.name !== oldLevel.name,
            newLevelName: newLevel.name,
        };
    } catch {
        return { newXP: 0, levelUp: false, newLevelName: '' };
    }
}

export async function getXP(userId: string): Promise<number> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
        return user?.xp ?? 0;
    } catch {
        return 0;
    }
}
