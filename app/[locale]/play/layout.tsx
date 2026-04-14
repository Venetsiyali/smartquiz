import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const locale = params.locale ?? 'uz';
    return {
        title: "O'yin Boshlash | Zukkoo.uz",
        description: "Zukkoo.uz da o'yin kodini kiriting va interaktiv viktorinaga qo'shiling. Real-vaqt rejimida sinfdoshlaringiz bilan raqobatlashing.",
        alternates: {
            canonical: `https://www.zukkoo.uz/${locale}/play`,
        },
        openGraph: {
            url: `https://www.zukkoo.uz/${locale}/play`,
        },
    };
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
