import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MODERATOR_ROLES = ['MODERATOR', 'ADMIN'];

/** MODERATOR yoki ADMIN bo'lsa sessiyani, aks holda null qaytaradi. */
export async function requireModerator(): Promise<Session | null> {
    const session = await getServerSession(authOptions);
    return session && MODERATOR_ROLES.includes(session.user.role) ? session : null;
}
