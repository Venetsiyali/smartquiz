'use client';

// Telefon soati noto'g'ri bo'lsa (ko'p arzon telefonlarda uchraydi) savol taymeri buziladi:
// soati oldinga ketgan telefonda savol darhol "vaqt tugadi" bo'lib qoladi. Shuning uchun vaqtni serverga moslaymiz.
let offsetMs = 0;
let syncPromise: Promise<void> | null = null;

async function sample(): Promise<{ offset: number; rtt: number } | null> {
    try {
        const t0 = Date.now();
        const res = await fetch('/api/time', { cache: 'no-store' });
        const t1 = Date.now();
        const { now } = await res.json();
        return { offset: now + (t1 - t0) / 2 - t1, rtt: t1 - t0 };
    } catch {
        return null;
    }
}

/** Server soati bilan farqni o'lchaydi (3 o'lchovdan eng tezkori olinadi). Bir necha marta chaqirilsa ham bir marta ishlaydi. */
export function syncServerClock(): Promise<void> {
    if (!syncPromise) {
        syncPromise = (async () => {
            const samples = (await Promise.all([sample(), sample(), sample()])).filter(Boolean) as { offset: number; rtt: number }[];
            if (samples.length > 0) offsetMs = samples.sort((a, b) => a.rtt - b.rtt)[0].offset;
        })();
    }
    return syncPromise;
}

/** Server vaqti bo'yicha "hozir" (ms). */
export function serverNow(): number {
    return Date.now() + offsetMs;
}
