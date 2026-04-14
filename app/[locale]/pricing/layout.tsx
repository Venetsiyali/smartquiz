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
            url: `https://www.zukkoo.uz/${locale}/pricing`,
        },
    };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
