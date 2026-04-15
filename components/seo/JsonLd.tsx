/**
 * JsonLd — reusable JSON-LD structured data injector.
 *
 * Usage (server components only — do NOT mark 'use client'):
 *
 *   import JsonLd, { articleSchema, webAppSchema, organizationSchema } from '@/components/seo/JsonLd';
 *
 *   // In a page or layout return:
 *   <JsonLd data={articleSchema({ title, description, url, imageUrl, datePublished, authorName })} />
 *   <JsonLd data={webAppSchema()} />
 *   <JsonLd data={organizationSchema()} />
 *
 * Multiple schemas on one page — pass an array:
 *   <JsonLd data={[webAppSchema(), organizationSchema()]} />
 */

export interface ArticleSchemaProps {
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    datePublished: string;
    dateModified?: string;
    authorName?: string;
    authorUrl?: string;
}

export function articleSchema({
    title,
    description,
    url,
    imageUrl,
    datePublished,
    dateModified,
    authorName = 'Nasridinov Rustamjon',
    authorUrl = 'https://www.zukkoo.uz',
}: ArticleSchemaProps) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        url,
        image: [imageUrl.startsWith('http') ? imageUrl : `https://www.zukkoo.uz${imageUrl}`],
        datePublished,
        dateModified: dateModified ?? datePublished,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        author: [{ '@type': 'Person', name: authorName, url: authorUrl }],
        publisher: {
            '@type': 'Organization',
            name: 'Zukkoo.uz',
            logo: { '@type': 'ImageObject', url: 'https://www.zukkoo.uz/icon-512x512.png' },
        },
    };
}

export function webAppSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': 'https://www.zukkoo.uz/#webapp',
        name: "Zukkoo — Bepul Interaktiv Quiz Platformasi",
        url: 'https://www.zukkoo.uz',
        description: "O'zbek tilida gamifikatsiya platformasi. O'qituvchilar uchun bepul quiz yaratish, real-vaqt reyting, 6 xil o'yin turi.",
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        inLanguage: ['uz', 'ru', 'en'],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'UZS' },
        featureList: [
            '6 xil interaktiv o\'yin turi',
            'Real-vaqt reyting (leaderboard)',
            "AI yordamida savol yaratish",
            'Gamifikatsiya: XP, streak, badge',
            "O'zbek, Rus, Ingliz tili",
        ],
    };
}

export function organizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        '@id': 'https://www.zukkoo.uz/#organization',
        name: 'Zukkoo.uz',
        url: 'https://www.zukkoo.uz',
        logo: 'https://www.zukkoo.uz/icon-512x512.png',
        description: "O'zbekiston o'qituvchilari uchun bepul interaktiv quiz va gamifikatsiya platformasi.",
        foundingDate: '2024',
        inLanguage: ['uz', 'ru', 'en'],
        sameAs: [
            'https://orcid.org/0009-0003-2422-9029',
            'https://www.webofscience.com/wos/author/record/POS-8883-2026',
            'https://www.researchgate.net/profile/Rustamjon-Nasridinov',
        ],
    };
}

export function faqSchema(items: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface JsonLdProps {
    // Pass a single schema object or an array for multiple schemas on one page
    data: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLd({ data }: JsonLdProps) {
    const schemas = Array.isArray(data) ? data : [data];
    return (
        <>
            {schemas.map((schema, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
}
