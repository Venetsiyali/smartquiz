import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import '../globals.css';
import { SubscriptionProvider } from '@/lib/subscriptionContext';
import { Providers } from '@/components/Providers';
import { NextIntlClientProvider } from 'next-intl';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@next/third-parties/google';

const nunito = Nunito({
    subsets: ['latin', 'cyrillic'],
    weight: ['400', '600', '700', '800', '900'],
    display: 'swap',
    variable: '--font-nunito',
});

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    return {
        title: {
            template: '%s | Zukkoo.uz',
            default: "Zukkoo — O'zbekiston uchun Bepul Interaktiv Quiz Platformasi",
        },
        description: "O'zbek tilida gamifikatsiya platformasi. O'qituvchilar uchun bepul quiz yaratish, real-vaqt reyting, 6 xil o'yin turi. Kahoot muqobili.",
        keywords: [
            'interaktiv quiz', 'gamifikatsiya', "o'qituvchilar uchun", 'viktorina', 'online test',
            'zukkoo', 'zukkoo.uz', 'kahoot muqobili', 'kahoot analogi', 'bepul quiz platformasi',
            "o'zbek ta'lim platformasi", "o'zbekiston", 'real-vaqt reyting', 'quiz yaratish',
            'interaktiv ta\'lim', 'TATU', 'TUIT', 'Rustamjon Nasridinov'
        ],
        authors: [{ name: 'Rustamjon Nasridinov', url: 'https://www.zukkoo.uz' }],
        creator: 'Rustamjon Nasridinov',
        publisher: 'Zukkoo.uz',
        metadataBase: new URL('https://www.zukkoo.uz'),
        openGraph: {
            title: "Zukkoo — O'zbekiston uchun Bepul Interaktiv Quiz Platformasi",
            description: "O'zbek tilida gamifikatsiya platformasi. O'qituvchilar uchun bepul quiz yaratish, real-vaqt reyting, 6 xil o'yin turi. Kahoot muqobili.",
            url: `https://www.zukkoo.uz/${locale}`,
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
            title: "Zukkoo — O'zbekiston uchun Bepul Interaktiv Quiz Platformasi",
            description: "O'zbek tilida gamifikatsiya platformasi. O'qituvchilar uchun bepul quiz yaratish, real-vaqt reyting, 6 xil o'yin turi. Kahoot muqobili.",
            images: ['/images/zukkoo-hero.jpg'],
            creator: '@zukkoo_uz',
        },
        alternates: {
            canonical: `https://www.zukkoo.uz/${locale}`,
            languages: {
                'uz': 'https://www.zukkoo.uz/uz',
                'ru': 'https://www.zukkoo.uz/ru',
                'en': 'https://www.zukkoo.uz/en',
                'x-default': 'https://www.zukkoo.uz/uz',
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
        icons: {
            // Google va brauzerlar uchun rasmiy favicon
            icon: [
                { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
                { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
                { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
                { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            ],
            shortcut: '/favicon.ico',
            apple: [
                { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            ],
        },
        manifest: '/manifest.json',
        appleWebApp: {
            capable: true,
            statusBarStyle: 'default',
            title: 'Zukkoo',
        },
    };
}

export default async function RootLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: any;
}) {
    const locale = params?.locale;
    const safeLocale = (typeof locale === 'string' && ['uz', 'ru', 'en'].includes(locale)) ? locale : 'uz';


    const messages = (await import(`../../messages/${safeLocale}.json`)).default;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'EducationalOrganization',
                '@id': 'https://www.zukkoo.uz/#organization',
                name: 'Zukkoo.uz',
                url: 'https://www.zukkoo.uz',
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
                '@id': 'https://www.zukkoo.uz/#software',
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
        url: 'https://www.zukkoo.uz',
        sameAs: [
            'https://tatu.uz',
            'https://orcid.org/0009-0003-2422-9029',
            'https://www.webofscience.com/wos/author/record/POS-8883-2026',
            'https://www.researchgate.net/profile/Rustamjon-Nasridinov',
        ],
    };

    return (
        <html lang={locale} className={nunito.variable} suppressHydrationWarning>
            <head>
                {/* Explicit favicon tags for Google Search Console rich results */}
                <link rel="icon" href="/favicon.ico" type="image/x-icon" />
                <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
                <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                {/* PWA meta tags */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#0a0e1e" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
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
                <Analytics />
                <GoogleAnalytics gaId="G-1194P6TG83" />
            </body>
        </html>
    );
}
