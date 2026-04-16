export const revalidate = 3600; // Re-generate at most once per hour

import { notFound } from 'next/navigation';
import { getArticleBySlug, articles } from '@/lib/articles';
import Header from '@/components/Header';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: { slug: string, locale: string } }) {
    const article = getArticleBySlug(params.slug);
    if (!article) return {};
    
    return {
        title: article.title,
        description: article.excerpt,
        keywords: article.keywords,
        authors: [{ name: 'Nasridinov Rustamjon', url: 'https://www.zukkoo.uz' }],
        alternates: {
            canonical: `https://www.zukkoo.uz/${params.locale}/blog/${article.slug}`,
        },
        openGraph: {
            title: article.title,
            description: article.excerpt,
            type: 'article',
            publishedTime: article.date,
            url: `https://www.zukkoo.uz/${params.locale}/blog/${article.slug}`,
            siteName: 'Zukkoo.uz',
            locale: params.locale === 'uz' ? 'uz_UZ' : params.locale === 'ru' ? 'ru_RU' : 'en_US',
            images: [
                {
                    url: `https://www.zukkoo.uz${article.imageUrl}`,
                    width: 1200,
                    height: 630,
                    alt: article.title,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.excerpt,
            images: [`https://www.zukkoo.uz${article.imageUrl}`],
            creator: '@zukkoo_uz',
        },
    };
}

export async function generateStaticParams() {
    return articles.map((article) => ({
        slug: article.slug,
    }));
}

export default function ArticlePage({ params }: { params: { slug: string, locale: string } }) {
    const article = getArticleBySlug(params.slug);

    if (!article) {
        notFound();
    }

    const { title, excerpt, content, keywords, date, imageUrl, slug } = article;
    const authorName = "Nasridinov Rustamjon";
    const authorUrl = "https://www.zukkoo.uz";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "image": [
            `https://www.zukkoo.uz${imageUrl}`
        ],
        "datePublished": date,
        "dateModified": date,
        "author": [{
            "@type": "Person",
            "name": authorName,
            "url": authorUrl
        }],
        "publisher": {
            "@type": "Organization",
            "name": "Zukkoo",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.zukkoo.uz/icon-512x512.png"
            }
        },
        "description": excerpt
    };

    return (
        <div className="bg-landing min-h-screen flex flex-col text-white">
            <Header />

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12 md:px-12">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />

                <article className="w-full max-w-4xl glass p-8 md:p-12 rounded-3xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="relative w-full h-[300px] md:h-[400px] mb-8 rounded-2xl overflow-hidden">
                        <Image src={imageUrl} alt={title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40"></div>
                    </div>

                    <header className="mb-8 border-b border-white/10 pb-6">
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
                            {title}
                        </h1>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {keywords.map(kw => (
                                <span key={kw} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-500/30">
                                    #{kw}
                                </span>
                            ))}
                        </div>
                        <time className="text-white/40 text-sm font-semibold">{new Date(date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    </header>

                    <div 
                        className="prose prose-invert prose-lg max-w-none text-white/80 leading-relaxed mb-12 article-content"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />

                    {/* E-E-A-T Author Block */}
                    <footer className="mt-12 p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-blue-500/30 bg-blue-900/50 flex items-center justify-center">
                                <span className="text-4xl">👨‍🏫</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-2">{authorName}</h3>
                                <p className="text-white/60 text-sm leading-relaxed mb-4">
                                    Toshkent axborot texnologiyalari universiteti (TUIT) "Axborot ta'lim texnologiyalari" kafedrasi o'qituvchisi va PhD tadqiqotchisi. Mutaxassisligi: Axborot izlash va olish tizimlari. Uning ilmiy faoliyati intellektual monitoring tizimlari va gibrid modellarni ishlab chiqishga yo'naltirilgan.
                                </p>
                                <div className="flex gap-4">
                                    <a href="https://tuit.uz/axborot-talim-texnologiyalari" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-bold text-sm underline transition-colors">
                                        TATU Kafedra Sayti
                                    </a>
                                </div>
                            </div>
                        </div>
                    </footer>
                </article>
            </main>

        </div>
    );
}
