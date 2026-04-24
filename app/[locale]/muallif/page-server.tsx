import { Metadata } from 'next';

const BASE = 'https://www.zukkoo.uz';

const META: Record<string, { title: string; description: string }> = {
    uz: {
        title: 'Muallif haqida | Rustamjon Nasridinov',
        description: 'TATU tayanch doktoranti va PhD tadqiqotchisi Rustamjon Nasridinovning ilmiy faoliyati, ORCID, Web of Science (POS-8883-2026), ResearchGate va LinkedIn profillari, Zukkoo.uz loyihasi haqida.',
    },
    ru: {
        title: 'Об авторе | Рустамжон Насридинов',
        description: 'Соискатель PhD в ТУИТ. Научная деятельность, ORCID, Web of Science (POS-8883-2026), ResearchGate и LinkedIn профили Рустамжона Насридинова. Проект Zukkoo.uz.',
    },
    en: {
        title: 'About the Author | Rustamjon Nasridinov',
        description: 'PhD researcher at TUIT. Scientific activity, ORCID, Web of Science (POS-8883-2026), ResearchGate and LinkedIn profiles of Rustamjon Nasridinov. Zukkoo.uz project.',
    },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const locale = params.locale ?? 'uz';
    const meta = META[locale] ?? META['uz'];

    return {
        title: meta.title,
        description: meta.description,
        alternates: {
            canonical: `${BASE}/${locale}/muallif`,
            languages: {
                'uz': `${BASE}/uz/muallif`,
                'ru': `${BASE}/ru/muallif`,
                'en': `${BASE}/en/muallif`,
                'x-default': `${BASE}/uz/muallif`,
            },
        },
        openGraph: {
            title: meta.title,
            description: meta.description,
            images: [{ url: `${BASE}/images/author.jpg`, width: 800, height: 800, alt: 'Rustamjon Nasridinov' }],
            type: 'profile',
            url: `${BASE}/${locale}/muallif`,
            locale: locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true },
        },
    };
}

// Static generation — server redirect bo'lmasin, sahifa oldindan qurilsin
export async function generateStaticParams() {
    return [{ locale: 'uz' }, { locale: 'ru' }, { locale: 'en' }];
}

export { default } from './page-client';
