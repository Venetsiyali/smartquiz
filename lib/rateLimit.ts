/**
 * Edge-compatible Rate Limiter (in-memory, Map-based)
 * Vercel Edge Middleware va API Route larda ishlaydi.
 *
 * Ishlatish:
 *   const limit = rateLimit({ windowMs: 60_000, max: 5 });
 *   const { success, retryAfter } = limit(ip);
 *   if (!success) return Response (429)
 */

interface RateLimitOptions {
    windowMs: number; // milliseconds
    max: number;      // max requests per window
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Global store — server process qayta ishga tushguncha saqlanadi
const store = new Map<string, RateLimitEntry>();

// Eski yozuvlarni tozalash (memory leak oldini olish)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key);
    }
}, 60_000);

export function rateLimit({ windowMs, max }: RateLimitOptions) {
    return function check(identifier: string): { success: boolean; retryAfter: number; remaining: number } {
        const now = Date.now();
        const entry = store.get(identifier);

        if (!entry || entry.resetAt < now) {
            // Yangi window boshlash
            store.set(identifier, { count: 1, resetAt: now + windowMs });
            return { success: true, retryAfter: 0, remaining: max - 1 };
        }

        if (entry.count >= max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            return { success: false, retryAfter, remaining: 0 };
        }

        entry.count++;
        return { success: true, retryAfter: 0, remaining: max - entry.count };
    };
}

/**
 * IP manzilini so'rovdan olish (Vercel / proxy-friendly)
 */
export function getClientIp(req: Request): string {
    const headers = (req as any).headers;
    return (
        (headers.get?.('x-forwarded-for') ?? '').split(',')[0].trim() ||
        (headers.get?.('x-real-ip') ?? '') ||
        'unknown'
    );
}
