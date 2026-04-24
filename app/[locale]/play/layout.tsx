import { Metadata } from 'next';

const BASE = 'https://www.zukkoo.uz';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const locale = params.locale ?? 'uz';
    return {
        title: "O'yin Boshlash | Zukkoo.uz",
        description: "Zukkoo.uz da o'yin kodini kiriting va interaktiv viktorinaga qo'shiling. Real-vaqt rejimida sinfdoshlaringiz bilan raqobatlashing.",
        alternates: {
            canonical: `${BASE}/${locale}/play`,
            languages: {
                'uz': `${BASE}/uz/play`,
                'ru': `${BASE}/ru/play`,
                'en': `${BASE}/en/play`,
                'x-default': `${BASE}/uz/play`,
            },
        },
        openGraph: {
            title: "O'yin Boshlash | Zukkoo.uz",
            description: "Zukkoo.uz da o'yin kodini kiriting va interaktiv viktorinaga qo'shiling. Real-vaqt rejimida sinfdoshlaringiz bilan raqobatlashing.",
            url: `${BASE}/${locale}/play`,
            siteName: 'Zukkoo.uz',
            locale: locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US',
            images: [{ url: `${BASE}/images/zukkoo-hero.jpg`, width: 1200, height: 600, alt: "Zukkoo — Interaktiv Quiz O'yini" }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: "O'yin Boshlash | Zukkoo.uz",
            description: "Zukkoo.uz da o'yin kodini kiriting va interaktiv viktorinaga qo'shiling.",
            images: [`${BASE}/images/zukkoo-hero.jpg`],
            creator: '@zukkoo_uz',
        },
        robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    };
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
