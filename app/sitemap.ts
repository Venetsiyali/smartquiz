import { MetadataRoute } from 'next';
import { articles } from '@/lib/articles';

export default function sitemap(): MetadataRoute.Sitemap {
    // KANONIKALURL: har doim www bilan (Google Search Console canonical)
    const baseUrl = 'https://www.zukkoo.uz';
    const locales = ['uz', 'ru', 'en'];
    const now = new Date();

    // Asosiy sahifalar — barcha tillarda
    const mainRoutes = ['', '/pricing', '/play', '/muallif', '/about', '/privacy', '/terms'].flatMap(route =>
        locales.map(locale => ({
            url: `${baseUrl}/${locale}${route}`,
            lastModified: now,
            changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
            priority: route === '' ? 1.0 : route === '/play' ? 0.9 : ['/about', '/privacy', '/terms', '/muallif'].includes(route) ? 0.6 : 0.8,
        }))
    );

    // Login / register sahifalari
    const authRoutes = ['/login', '/register', '/forgot-password'].flatMap(route =>
        locales.map(locale => ({
            url: `${baseUrl}/${locale}${route}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        }))
    );

    // O'yin sahifalari — barcha tillar bilan to'g'ri URL
    const gameRoutes = locales.map(locale => ({
        url: `${baseUrl}/${locale}/play`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));


    // Blog index sahifalari — barcha tillarda
    const blogIndexRoutes = locales.map(locale => ({
        url: `${baseUrl}/${locale}/blog`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Maqolalar sahifalari — barcha tillarda
    const articleRoutes = articles.flatMap(article =>
        locales.map(locale => ({
            url: `${baseUrl}/${locale}/blog/${article.slug}`,
            lastModified: new Date(article.date),
            changeFrequency: 'monthly' as const,
            priority: 0.9,
        }))
    );

    return [...mainRoutes, ...authRoutes, ...gameRoutes, ...blogIndexRoutes, ...articleRoutes];
}
