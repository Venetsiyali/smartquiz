import { prisma } from '@/lib/prisma';

export interface BadgeDef {
    key: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    bg: string;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
    {
        key: 'first_step',
        name: "Birinchi Qadam",
        description: "Birinchi quizda qatnashdi",
        icon: '🎯',
        color: '#00E676',
        bg: 'rgba(0,230,118,0.12)',
    },
    {
        key: 'week_star',
        name: "Hafta Yulduzi",
        description: "7 kunlik streak erishdi",
        icon: '⭐',
        color: '#FFD700',
        bg: 'rgba(255,215,0,0.12)',
    },
    {
        key: 'perfect_score',
        name: "Tez O'quvchi",
        description: "Quizni 100% to'g'ri javob bilan tugatdi",
        icon: '💯',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
    },
    {
        key: 'marathon',
        name: "Maraton",
        description: "1 kunda 10+ quiz o'ynadi",
        icon: '🏃',
        color: '#f97316',
        bg: 'rgba(249,115,22,0.12)',
    },
];

export function getBadgeDef(key: string): BadgeDef | undefined {
    return BADGE_DEFINITIONS.find(b => b.key === key);
}

export async function checkAndAwardBadge(userId: string, badgeKey: string): Promise<boolean> {
    try {
        const exists = await prisma.userBadge.findUnique({
            where: { userId_badgeKey: { userId, badgeKey } },
        });
        if (exists) return false;

        await prisma.userBadge.create({ data: { userId, badgeKey } });
        return true;
    } catch {
        return false;
    }
}

export async function getUserBadges(userId: string): Promise<(BadgeDef & { earnedAt: Date })[]> {
    try {
        const rows = await prisma.userBadge.findMany({
            where: { userId },
            orderBy: { earnedAt: 'desc' },
        });
        return rows
            .map(r => {
                const def = getBadgeDef(r.badgeKey);
                if (!def) return null;
                return { ...def, earnedAt: r.earnedAt };
            })
            .filter(Boolean) as (BadgeDef & { earnedAt: Date })[];
    } catch {
        return [];
    }
}

// Seed badges to DB (idempotent)
export async function seedBadges() {
    for (const badge of BADGE_DEFINITIONS) {
        await prisma.badge.upsert({
            where: { key: badge.key },
            update: { name: badge.name, description: badge.description, icon: badge.icon, color: badge.color },
            create: { key: badge.key, name: badge.name, description: badge.description, icon: badge.icon, color: badge.color },
        });
    }
}
