import type { Metadata } from 'next';
import '../globals.css';
import { SubscriptionProvider } from '@/lib/subscriptionContext';
import { Providers } from '@/components/Providers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    return {
        title: {
            template: '%s | Zukkoo.uz',
            default: "Zukkoo.uz — Interaktiv Ta'lim va Gamifikatsiya Platformasi",
        },
        description: "TATU o'qituvchilari va PhD tadqiqotchilari tomonidan yaratilgan, darslarni o'yin orqali o'rgatuvchi innovatsion tizim.",
        keywords: [
            'zukkoo', 'zukkoo.uz', 'interaktiv ta\'lim', 'gamifikatsiya', 'quiz',
            'online quiz', 'viktorina', 'smart education', 'TATU', 'interaktiv o\'yinlar',
            'kahoot analogi', 'o\'zbek ta\'lim platformasi', 'o\'zbekiston', 'att', 'tuit',
            'PhD tadqiqot', 'Rustamjon Nasridinov', 'gidrologik monitoring'
        ],
        authors: [{ name: 'Rustamjon Nasridinov', url: 'https://zukkoo.uz' }],
        creator: 'Rustamjon Nasridinov',
        publisher: 'Zukkoo.uz',
        metadataBase: new URL('https://zukkoo.uz'),
        openGraph: {
            title: "Zukkoo.uz — Interaktiv Ta'lim va Gamifikatsiya Platformasi",
            description: "TATU o'qituvchilari va PhD tadqiqotchilari tomonidan yaratilgan, darslarni o'yin orqali o'rgatuvchi innovatsion tizim.",
            url: `https://zukkoo.uz/${locale}`,
            siteName: 'Zukkoo.uz',
            images: [
                {
                    url: '/images/zukkoo-hero.jpg',
                    width: 1200,
                    height: 600,
                    alt: "Zukkoo.uz — Interaktiv Ta'lim va Gamifikatsiya Platformasi",
                },
            ],
            locale: locale === 'uz' ? 'uz_UZ' : 'ru_RU',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: "Zukkoo.uz — Interaktiv Ta'lim va Gamifikatsiya Platformasi",
            description: "TATU o'qituvchilari va PhD tadqiqotchilari tomonidan yaratilgan, darslarni o'yin orqali o'rgatuvchi innovatsion tizim.",
            images: ['/images/zukkoo-hero.jpg'],
            creator: '@zukkoo_uz',
        },
        alternates: {
            canonical: `https://zukkoo.uz/${locale}`,
            languages: {
                'uz': 'https://zukkoo.uz/uz',
                'ru': 'https://zukkoo.uz/ru',
            },
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-image-preview': 'large',
            },
        },
        icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" },
    };
}

export default async function RootLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    if (!['uz', 'ru'].includes(locale)) notFound();

    const messages = await getMessages();

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

    const personJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Rustamjon Nasridinov',
        jobTitle: 'PhD Tadqiqotchi, Katta O\'qituvchi',
        affiliation: {
            '@type': 'CollegeOrUniversity',
            name: 'Muhammad al-Xorazmiy nomidagi Toshkent axborot texnologiyalari universiteti (TATU)',
            url: 'https://tatu.uz',
        },
        knowsAbout: [
            'Gidrologik monitoring', 'Ta\'lim texnologiyalari',
            'Gamifikatsiya', 'Interaktiv ta\'lim', 'Zukkoo platformasi',
        ],
        url: 'https://zukkoo.uz',
        sameAs: ['https://tatu.uz'],
    };

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
                />
            </head>
            <body suppressHydrationWarning>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Providers>
                        <SubscriptionProvider>
                            {children}
                        </SubscriptionProvider>
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
