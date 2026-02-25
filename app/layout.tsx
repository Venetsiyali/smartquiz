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
        '@graph': [
            {
                '@type': 'EducationalOrganization',
                '@id': 'https://zukkoo.uz/#organization',
                name: 'Zukkoo.uz',
                url: 'https://zukkoo.uz',
                description: "Interaktiv ta'lim va gamifikatsiya platformasi.",
                parentOrganization: {
                    '@type': 'CollegeOrUniversity',
                    name: "Muhammad al-Xorazmiy nomidagi Toshkent axborot texnologiyalari universiteti (TATU)",
                    department: {
                        '@type': 'Organization',
                        name: "Axborot va ta'lim texnologiyalari kafedrasi"
                    }
                },
                inLanguage: ['uz', 'ru', 'en'],
                knowsAbout: ['Viktorinalar', 'Ta\'lim texnologiyalari', 'Gamifikatsiya', 'Interaktiv o\'qitish']
            },
            {
                '@type': 'SoftwareApplication',
                '@id': 'https://zukkoo.uz/#software',
                name: 'Zukkoo Platformasi',
                applicationCategory: 'EducationalApplication',
                operatingSystem: 'Web',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'UZS'
                },
                inLanguage: ['uz', 'ru', 'en']
            },
            {
                '@type': 'Course',
                '@id': 'https://zukkoo.uz/#course',
                name: 'Zukkoo — Interactive Learning Course',
                description: "O'quvchilar va talabalar uchun 6 xil turdagi interaktiv ta'limiy o'yinlar to'plami.",
                provider: {
                    '@id': 'https://zukkoo.uz/#organization'
                },
                courseMode: 'online',
                educationalCredentialAwarded: 'Zukkoo peshqadamlik reytingi'
            },
            {
                '@type': 'FAQPage',
                '@id': 'https://zukkoo.uz/#faq',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: 'Zukkoo nima?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: "Zukkoo — bu o'qituvchilar va talabalar uchun real-vaqt rejimida viktorinalar, jamoaviy bellashuvlar va interaktiv o'yinlar yaratish va o'ynash imkonini beruvchi gamifikatsiya platformasi. Kahoot analogi."
                        }
                    },
                    {
                        '@type': 'Question',
                        name: "Zukkoo'da qanday o'ynaladi?",
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: "O'qituvchi o'yin yaratadi va ekranda PIN-kod yoki ro'yxatdan o'tish uchun QR kodni ko'rsatadi. O'yinchilar qatnashish uchun o'z smartfonlari orqali zukkoo.uz/play ga kirib ushbu kodni kiritishadi va jonli reytingda bellashadilar."
                        }
                    }
                ]
            }
        ]
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
