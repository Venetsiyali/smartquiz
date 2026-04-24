import { Metadata } from 'next';

const BASE = 'https://www.zukkoo.uz';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const locale = params.locale ?? 'uz';
    return {
        title: "Tariflar va Narxlar | Zukkoo.uz",
        description: "Zukkoo.uz bepul va Pro tarif rejalari. O'qituvchilar uchun maqbul narxlarda barcha gamifikatsiya vositalariga kirish.",
        alternates: {
            canonical: `${BASE}/${locale}/pricing`,
            languages: {
                'uz': `${BASE}/uz/pricing`,
                'ru': `${BASE}/ru/pricing`,
                'en': `${BASE}/en/pricing`,
                'x-default': `${BASE}/uz/pricing`,
            },
        },
        openGraph: {
            title: "Tariflar va Narxlar | Zukkoo.uz",
            description: "Zukkoo.uz bepul va Pro tarif rejalari. O'qituvchilar uchun maqbul narxlarda barcha gamifikatsiya vositalariga kirish.",
            url: `${BASE}/${locale}/pricing`,
            siteName: 'Zukkoo.uz',
            locale: locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US',
            images: [{ url: `${BASE}/images/zukkoo-hero.jpg`, width: 1200, height: 600, alt: 'Zukkoo — Tariflar' }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: "Tariflar va Narxlar | Zukkoo.uz",
            description: "Zukkoo.uz bepul va Pro tarif rejalari. O'qituvchilar uchun maqbul narxlarda barcha gamifikatsiya vositalariga kirish.",
            images: [`${BASE}/images/zukkoo-hero.jpg`],
            creator: '@zukkoo_uz',
        },
        robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
