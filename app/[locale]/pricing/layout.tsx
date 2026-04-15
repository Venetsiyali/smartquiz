import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const locale = params.locale ?? 'uz';
    return {
        title: "Tariflar va Narxlar | Zukkoo.uz",
        description: "Zukkoo.uz bepul va Pro tarif rejalari. O'qituvchilar uchun maqbul narxlarda barcha gamifikatsiya vositalariga kirish.",
        alternates: {
            canonical: `https://www.zukkoo.uz/${locale}/pricing`,
        },
        openGraph: {
            title: "Tariflar va Narxlar | Zukkoo.uz",
            description: "Zukkoo.uz bepul va Pro tarif rejalari. O'qituvchilar uchun maqbul narxlarda barcha gamifikatsiya vositalariga kirish.",
            url: `https://www.zukkoo.uz/${locale}/pricing`,
            siteName: 'Zukkoo.uz',
            locale: locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US',
            images: [{ url: 'https://www.zukkoo.uz/images/zukkoo-hero.jpg', width: 1200, height: 600, alt: 'Zukkoo — Tariflar' }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: "Tariflar va Narxlar | Zukkoo.uz",
            description: "Zukkoo.uz bepul va Pro tarif rejalari. O'qituvchilar uchun maqbul narxlarda barcha gamifikatsiya vositalariga kirish.",
            images: ['https://www.zukkoo.uz/images/zukkoo-hero.jpg'],
            creator: '@zukkoo_uz',
        },
    };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
