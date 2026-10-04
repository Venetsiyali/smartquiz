// Asosiy admin(lar): rolini hech kim o'zgartira olmaydi va ADMIN rolini faqat ular beradi/oladi.
// Env orqali o'zgartirish mumkin: SUPER_ADMIN_EMAILS="a@x.com,b@y.com"
const DEFAULT_SUPER_ADMINS = ['rustamjon1400@gmail.com'];

export function superAdminEmails(): string[] {
    const fromEnv = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) ?? [];
    return fromEnv.length > 0 ? fromEnv : DEFAULT_SUPER_ADMINS;
}

export function isSuperAdmin(email: string | null | undefined): boolean {
    return !!email && superAdminEmails().includes(email.trim().toLowerCase());
}
