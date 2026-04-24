import { Metadata } from 'next';
import Header from '@/components/Header';
import Link from 'next/link';

const BASE = 'https://www.zukkoo.uz';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const locale = params.locale ?? 'uz';
    return {
        title: "Biz Haqimizda | Zukkoo.uz",
        description: "Zukkoo.uz — O'zbekiston o'qituvchilari uchun yaratilgan bepul interaktiv quiz va gamifikatsiya platformasi. TATU ATT bo'limi, missiya va jamoa.",
        alternates: {
            canonical: `${BASE}/${locale}/about`,
            languages: {
                'uz': `${BASE}/uz/about`,
                'ru': `${BASE}/ru/about`,
                'en': `${BASE}/en/about`,
                'x-default': `${BASE}/uz/about`,
            },
        },
        openGraph: {
            title: "Biz Haqimizda | Zukkoo.uz",
            description: "O'zbekiston ta'limini interaktiv va qiziqarli qilish missiyasi. TATU ATT bo'limi tomonidan yaratilgan gamifikatsiya platformasi.",
            type: 'website',
            url: `${BASE}/${locale}/about`,
            siteName: 'Zukkoo.uz',
            images: [{ url: `${BASE}/og-image.jpg`, width: 1200, height: 630, alt: 'Zukkoo.uz haqida' }],
        },
        robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    };
}

export async function generateStaticParams() {
    return [{ locale: 'uz' }, { locale: 'ru' }, { locale: 'en' }];
}
