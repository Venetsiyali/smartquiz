import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Tizimga kirmagan o'qituvchilar uchun umumiy "mehmon" akkaunti. `.invalid` domeni (RFC 2606) —
 * bu manzilga hech kim xat ololmaydi, shuning uchun bu akkauntga hech kim login qila olmaydi.
 * Mehmon o'yinlari bir-biridan sessiya id'si (cuid — taxmin qilib bo'lmaydi) orqali ajratiladi.
 */
export const GUEST_TEACHER_EMAIL = 'guest-teacher@zukkoo.invalid';
let guestIdCache: string | null = null;

async function guestTeacherId(): Promise<string> {
    if (guestIdCache) return guestIdCache;
    const user = await prisma.user.upsert({
        where: { email: GUEST_TEACHER_EMAIL },
        update: {},
        create: { email: GUEST_TEACHER_EMAIL, name: "Mehmon o'qituvchi", role: 'TEACHER' },
        select: { id: true },
    });
    guestIdCache = user.id;
    return user.id;
}

/** Joriy o'qituvchining id'si; tizimga kirmagan bo'lsa — mehmon akkaunti (login shart emas). */
export async function requireTeacherId(): Promise<string> {
    const session = await getServerSession(authOptions).catch(() => null);
    return session?.user?.id ?? await guestTeacherId();
}

/**
 * Berilgan wheelSession shu o'qituvchiga tegishli ekanligini tekshiradi.
 * Topilmasa yoki boshqa foydalanuvchiga tegishli bo'lsa — null qaytaradi
 * (Prisma bilan ishlagan Next.js API route darajasidagi RLS o'rnini bosadi).
 */
export async function getOwnedWheelSession(sessionId: string, teacherId: string) {
    const wheelSession = await prisma.wheelSession.findUnique({ where: { id: sessionId } });
    if (!wheelSession || wheelSession.teacherId !== teacherId) return null;
    return wheelSession;
}
