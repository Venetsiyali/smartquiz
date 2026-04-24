// Shaxsiy va autentifikatsiya talab qiluvchi sahifalar uchun umumiy SEO util
// Ushbu sahifalar Google tomonidan indekslanmasligi kerak

import { Metadata } from 'next';

export function privatePageMeta(title: string): Metadata {
    return {
        title,
        robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
        },
    };
}

export function noindexMeta(): Pick<Metadata, 'robots'> {
    return {
        robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
        },
    };
}
