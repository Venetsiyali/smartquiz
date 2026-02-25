import type { Metadata } from 'next';
import './globals.css';
import { SubscriptionProvider } from '@/lib/subscriptionContext';

export const metadata: Metadata = {
    title: {
        template: '%s | Zukkoo.uz',
        default: "Zukkoo.uz — Interaktiv ta'lim va gamifikatsiya platformasi",
    },
    description: "Zukkoo — interaktiv viktorinalar, jamoaviy o'yinlar va mantiqiy bellashuvlarni o'zida jamlagan zamonaviy ta'lim platformasi. Oliy ta'lim va maktablar uchun mukammal Kahoot analogi.",
    keywords: ['zukkoo', 'ta\'lim', 'viktorina', 'gamifikatsiya', 'quiz', 'interaktiv', 'o\'zbekiston', 'tuit', 'att'],
    authors: [{ name: 'Zukkoo Team' }],
    creator: 'Zukkoo.uz',
    openGraph: {
        title: "Zukkoo.uz — Interaktiv ta'lim sayyohiga aylaning",
        description: "Zukkoo bilan o'rganish zerikarli emas! Jamoaviy o'yinlar, viktorinalar, yashirin kodlar g'olibiga aylaning.",
        url: 'https://zukkoo.uz',
        siteName: 'Zukkoo Platformasi',
        images: [
            {
                url: 'https://zukkoo.uz/og-image.jpg', // You should place an og-image.jpg in the public folder
                width: 1200,
                height: 630,
                alt: 'Zukkoo.uz Platform',
            },
        ],
        locale: 'uz_UZ',
        type: 'website',
    },
    alternates: {
        canonical: 'https://zukkoo.uz',
        languages: {
            'uz-UZ': 'https://zukkoo.uz',
            'ru-RU': 'https://zukkoo.uz/ru',
            'en-US': 'https://zukkoo.uz/en',
        },
    },
    icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': ['EducationalOrganization', 'SoftwareApplication'],
        name: 'Zukkoo.uz',
        url: 'https://zukkoo.uz',
        description: "O'zbekistonning eng faol interaktiv ta'lim va gamifikatsiya platformasi.",
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'UZS',
        },
        inLanguage: ['uz', 'ru', 'en']
    };

    return (
        <html lang="uz">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                <SubscriptionProvider>
                    {children}
                </SubscriptionProvider>
            </body>
        </html>
    );
}
