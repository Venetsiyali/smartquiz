export const revalidate = 3600; // Re-generate at most once per hour

import { articles } from '@/lib/articles';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    return {
        title: "Maqolalar va Ilmiy Yangiliklar | Zukkoo.uz",
        description: "Ta'lim texnologiyalari, gamifikatsiya, neyropedagogika va interaktiv o'qitish haqida ilmiy maqolalar. PhD tadqiqotchi Nasridinov Rustamjon tomonidan.",
        keywords: ["ta'lim maqolalari", "gamifikatsiya", "neyropedagogika", "interaktiv ta'lim", "Zukkoo", "Nasridinov Rustamjon"],
        authors: [{ name: 'Nasridinov Rustamjon', url: 'https://www.zukkoo.uz' }],
        alternates: {
            canonical: `https://www.zukkoo.uz/${locale}/blog`,
        },
        openGraph: {
            title: "Maqolalar va Ilmiy Yangiliklar | Zukkoo.uz",
            description: "Ta'lim texnologiyalari, gamifikatsiya va interaktiv o'qitish haqida ilmiy maqolalar.",
            url: `https://www.zukkoo.uz/${locale}/blog`,
            type: 'website',
            images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
        },
    };
}

export default function BlogIndexPage({ params }: { params: { locale: string } }) {
    const { locale } = params;

    const sortedArticles = [...articles]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Bosh sahifa", "item": `https://www.zukkoo.uz/${locale}` },
            { "@type": "ListItem", "position": 2, "name": "Maqolalar", "item": `https://www.zukkoo.uz/${locale}/blog` },
        ]
    };

    const blogJsonLd = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Zukkoo — Maqolalar va Ilmiy Yangiliklar",
        "url": `https://www.zukkoo.uz/${locale}/blog`,
        "description": "Ta'lim texnologiyalari, gamifikatsiya va interaktiv o'qitish haqida ilmiy maqolalar.",
        "author": {
            "@type": "Person",
            "name": "Nasridinov Rustamjon",
            "jobTitle": "PhD Tadqiqotchi",
            "affiliation": "Toshkent axborot texnologiyalari universiteti (TUIT)"
        },
        "blogPost": sortedArticles.map(a => ({
            "@type": "BlogPosting",
            "headline": a.title,
            "description": a.excerpt,
            "datePublished": a.date,
            "url": `https://www.zukkoo.uz/${locale}/blog/${a.slug}`,
            "image": `https://www.zukkoo.uz${a.imageUrl}`,
        }))
    };

    return (
        <div className="bg-landing min-h-screen flex flex-col text-white">
            <Header />

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12 md:px-12">
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />

                <div className="w-full max-w-6xl">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-white/40 font-semibold mb-8">
                        <Link href={`/${locale}`} className="hover:text-white/70 transition-colors">Bosh sahifa</Link>
                        <span>/</span>
                        <span className="text-white/70">Maqolalar</span>
                    </nav>

                    <header className="mb-10">
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
                            Maqolalar va Ilmiy Yangiliklar
                        </h1>
                        <p className="text-white/50 text-lg max-w-2xl">
                            Ta&apos;lim texnologiyalari, gamifikatsiya, neyropedagogika va interaktiv o&apos;qitish haqida ilmiy tahlillar.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedArticles.map((article) => (
                            <article
                                key={article.slug}
                                className="glass rounded-3xl overflow-hidden flex flex-col group border border-white/10 hover:border-blue-500/30 transition-all"
                            >
                                <div className="relative w-full h-48 overflow-hidden">
                                    <Image
                                        src={article.imageUrl}
                                        alt={`${article.title} — Zukkoo.uz`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1e] to-transparent opacity-80" />
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {article.keywords.slice(0, 2).map((kw) => (
                                            <span key={kw} className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                    <h2 className="text-white font-bold text-lg leading-snug mb-3 group-hover:text-blue-300 transition-colors line-clamp-2">
                                        <Link href={`/${locale}/blog/${article.slug}`}>
                                            {article.title}
                                        </Link>
                                    </h2>
                                    <p className="text-white/50 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                                        {article.excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <time dateTime={article.date} className="text-white/30 text-xs font-bold">
                                            {new Date(article.date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </time>
                                        <Link
                                            href={`/${locale}/blog/${article.slug}`}
                                            className="text-white font-bold text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                                        >
                                            Batafsil <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="relative z-10 text-center py-6 text-white/30 font-semibold text-sm">
                © 2026 Zukkoo.uz — Interaktiv Ta&apos;lim Platformasi
            </footer>
        </div>
    );
}
