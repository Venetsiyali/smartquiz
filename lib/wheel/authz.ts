import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Joriy so'rovni yuborgan o'qituvchining foydalanuvchi id'sini qaytaradi, aks holda null. */
export async function requireTeacherId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    return session?.user?.id ?? null;
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
