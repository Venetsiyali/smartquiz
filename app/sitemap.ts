import { MetadataRoute } from 'next';
import { articles } from '@/lib/articles';

const BASE = 'https://www.zukkoo.uz';
const LOCALES = ['uz', 'ru', 'en'];
const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {

    // 1️⃣ Main public pages — barcha tillarda
    const mainRoutes = ['', '/pricing', '/play', '/muallif', '/about', '/privacy', '/terms', '/blog'].flatMap(route =>
        LOCALES.map(locale => ({
            url: `${BASE}/${locale}${route}`,
            lastModified: now,
            changeFrequency: route === '' ? 'daily' as const : route === '/blog' ? 'weekly' as const : 'monthly' as const,
            priority: route === '' ? 1.0
                : route === '/play' ? 0.9
                : route === '/blog' ? 0.85
                : route === '/pricing' ? 0.8
                : route === '/muallif' ? 0.75
                : 0.6,
        }))
    );

    // 2️⃣ Blog articles — barcha tillarda
    const articleRoutes = articles.flatMap(article =>
        LOCALES.map(locale => ({
            url: `${BASE}/${locale}/blog/${article.slug}`,
            lastModified: new Date(article.date),
            changeFrequency: 'monthly' as const,
            priority: 0.9,
        }))
    );

    // ⛔ Login, settings, admin, teacher, play/[gameId] — INDEKSLASH SHART EMAS
    // Bu sahifalar robots noindex bilan boshqariladi

    return [...mainRoutes, ...articleRoutes];
}
