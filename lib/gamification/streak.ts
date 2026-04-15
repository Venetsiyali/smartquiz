import { prisma } from '@/lib/prisma';

export async function updateStreak(userId: string): Promise<{ streak: number; increased: boolean }> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { streak: true, lastStreakDate: true },
        });
        if (!user) return { streak: 0, increased: false };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (!user.lastStreakDate) {
            await prisma.user.update({ where: { id: userId }, data: { streak: 1, lastStreakDate: today } });
            return { streak: 1, increased: true };
        }

        const last = new Date(user.lastStreakDate);
        const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
        const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86_400_000);

        if (diffDays === 0) {
            return { streak: user.streak, increased: false };
        } else if (diffDays === 1) {
            const newStreak = user.streak + 1;
            await prisma.user.update({ where: { id: userId }, data: { streak: newStreak, lastStreakDate: today } });
            return { streak: newStreak, increased: true };
        } else {
            await prisma.user.update({ where: { id: userId }, data: { streak: 1, lastStreakDate: today } });
            return { streak: 1, increased: false };
        }
    } catch {
        return { streak: 0, increased: false };
    }
}

export async function getStreak(userId: string): Promise<number> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
        return user?.streak ?? 0;
    } catch {
        return 0;
    }
}
