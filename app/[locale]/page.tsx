'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSubscription, CrownBadge } from '@/lib/subscriptionContext';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { articles } from '@/lib/articles';
import SocialProof from '@/components/home/SocialProof';
import HowItWorks from '@/components/home/HowItWorks';
import Leaderboard from '@/components/gamification/Leaderboard';
import InstallBanner from '@/components/pwa/InstallBanner';
import { MascotSprite } from '@/components/gamification/MascotSprite';


const recentArticles = [...articles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

const GAME_STYLES = [
    {
        id: 'classic',
        image: '/images/games/1.webp',
        gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
        glowColor: 'rgba(59,130,246,0.5)',
        badgeStyle: { background: 'rgba(0,230,118,0.22)', color: '#00E676', border: '1px solid rgba(0,230,118,0.5)' },
        route: '/play/1',
        pro: false,
    },
    {
        id: 'order',
        image: '/images/games/2.webp',
        gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 60%, #22c55e 100%)',
        glowColor: 'rgba(34,197,94,0.5)',
        badgeStyle: { background: 'rgba(0,230,118,0.22)', color: '#00E676', border: '1px solid rgba(0,230,118,0.5)' },
        route: '/play/2',
        pro: false,
    },
    {
        id: 'match',
        image: '/images/games/3.webp',
        gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)',
        glowColor: 'rgba(124,58,237,0.5)',
        badgeStyle: { background: 'rgba(255,215,0,0.18)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.5)' },
        route: '/play/3',
        pro: true,
    },
    {
        id: 'blitz',
        image: '/images/games/4.webp',
        gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)',
        glowColor: 'rgba(220,38,38,0.5)',
        badgeStyle: { background: 'rgba(0,230,118,0.22)', color: '#00E676', border: '1px solid rgba(0,230,118,0.5)' },
        route: '/play/4',
        pro: false,
    },
    {
        id: 'anagram',
        image: '/images/games/5.webp',
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #818cf8 100%)',
        glowColor: 'rgba(67,56,202,0.5)',
        badgeStyle: { background: 'rgba(255,215,0,0.18)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.5)' },
        route: '/play/5',
        pro: true,
    },
    {
        id: 'team',
        image: '/images/games/6.webp',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #0f4c81 55%, #0ea5e9 100%)',
        glowColor: 'rgba(14,165,233,0.5)',
        badgeStyle: { background: 'rgba(255,215,0,0.18)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.5)' },
        route: '/play/6',
        pro: true,
    },
];

function getGreetingKey() {
    const h = new Date().getHours();
    if (h < 5) return 'night';
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
}

export default function LandingPage() {
    console.log("==== LANDING PAGE RENDERED ====");
    const router = useRouter();
    const { isPro } = useSubscription();
    const [userName, setUserName] = useState('');
    const [greetingKey, setGreetingKey] = useState('morning');
    const t = useTranslations('Home');
    const tGames = useTranslations('Games');
    const locale = useLocale();

    useEffect(() => {
        const name = localStorage.getItem('zk_teacher_name') || '';
        setUserName(name);
        setGreetingKey(getGreetingKey());
    }, []);

    return (
        <div className="bg-landing min-h-screen flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', top: '-15%', left: '-10%' }} />
                <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FFD600, transparent)', bottom: '10%', right: '-5%', animationDelay: '1.5s' }} />
                <div className="absolute w-[300px] h-[300px] rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #00E676, transparent)', top: '40%', right: '20%', animationDelay: '3s' }} />
            </div>

            <Header />

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8 md:px-12">
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-6xl mb-12 relative"
                >
                    <div className="flex flex-row items-end justify-between bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/30 p-8 md:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
                        
                        {/* Chap Qahramon (O'g'il bola - transparent) */}
                        <div className="hidden lg:flex flex-col justify-end transform transition-transform hover:scale-110 hover:-rotate-3 duration-300 z-10 w-56 relative translate-y-6">
                            <div className="relative w-[220px] h-[360px]">
                                <Image src="/bola.png" alt="Zukko Bola" fill className="object-contain drop-shadow-2xl" priority />
                            </div>
                        </div>

                        {/* Markaziy Kontent */}
                        <div className="flex-1 flex flex-col items-center text-center z-20 relative px-4">
                            <p className="text-amber-400 font-bold text-xs tracking-widest mb-4 uppercase bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 shadow-inner inline-block">
                                {t(`greeting.${greetingKey}`)}
                            </p>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 drop-shadow-xl flex flex-col gap-2">
                                <span>{t('hero.hello')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{userName || 'Zukko'}</span>! 👋</span>
                                <span className="text-white/70 font-extrabold text-2xl md:text-3xl mt-2 drop-shadow-md">
                                    {t('hero.whatToPlay')}
                                </span>
                            </h1>
                            
                            {/* Maqsad yozuvi */}
                            <p className="text-base md:text-lg font-bold mt-2 text-emerald-400 mb-8 drop-shadow bg-emerald-500/10 px-6 py-2 rounded-2xl border border-emerald-500/20">
                                ✨ O'zbekiston o'qituvchilari uchun #1 interaktiv quiz platformasi
                            </p>
                            
                            {/* Tugmalar */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => router.push('/play')}
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-lg transition-transform hover:scale-105 shadow-[0_0_40px_rgba(0,230,118,0.4)] flex items-center justify-center gap-3 relative overflow-hidden group"
                                    style={{ background: 'linear-gradient(135deg, #00E676, #00b894)', color: '#0a0e1e' }}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                                    <span className="text-2xl">🚀</span> Hozir Boshlang — Bepul
                                </button>

                                <button onClick={() => router.push('/play')}
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base transition-all hover:bg-white/10 flex items-center justify-center gap-3 text-white border border-white/20 bg-white/5 backdrop-blur-md">
                                    {t('hero.enterGame')} <span className="text-white/40">PIN orqali</span> →
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-8">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#151e32] bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px]">🤓</div>
                                    ))}
                                </div>
                                <p className="text-white/40 text-xs font-semibold text-left leading-tight">
                                    500+ o'qituvchi va <br/><span className="text-white text-sm">50,000+</span> o'quvchilar ishonchi
                                </p>
                            </div>
                        </div>

                        {/* O'ng Qahramon (Qiz bola - transparent) */}
                        <div className="hidden lg:flex flex-col justify-end transform transition-transform hover:scale-110 hover:rotate-3 duration-300 z-10 w-56 relative translate-y-6">
                            <div className="relative w-[220px] h-[360px]">
                                <Image src="/qiz.png" alt="Zukko Qiz" fill className="object-contain drop-shadow-2xl" priority />
                            </div>
                        </div>
                        
                        {/* Orqa fon nur effektlari */}
                        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/30 blur-[130px] rounded-full pointer-events-none"></div>
                        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/30 blur-[130px] rounded-full pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none"></div>
                    </div>
                </motion.div>

                <div className="w-full max-w-6xl">
                    <p className="text-white/30 font-bold text-xs tracking-widest mb-5">{t('hero.gameTypes')}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {GAME_STYLES.map((game, i) => {
                            const locked = game.pro && !isPro;
                            return (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, y: 28 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.07 }}
                                    whileHover={{ y: -6 }}
                                    className="group cursor-pointer rounded-3xl overflow-hidden flex flex-col"
                                    style={{
                                        background: 'rgba(10,14,30,0.75)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                                        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                                    }}
                                    onClick={() => {
                                        if (locked) { router.push('/pricing'); return; }
                                        router.push(game.route);
                                    }}
                                >
                                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                        <Image
                                            src={game.image}
                                            alt={tGames(`${game.id}.name`)}
                                            fill
                                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                            loading="lazy"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            style={{
                                                filter: locked ? 'brightness(0.55) saturate(0.6)' : 'brightness(0.9)',
                                            }}
                                        />
                                        <div className="absolute inset-0 pointer-events-none"
                                            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(10,14,30,0.95) 100%)' }} />
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-t-3xl"
                                            style={{ boxShadow: `inset 0 0 60px ${game.glowColor}`, background: `radial-gradient(ellipse at center, ${game.glowColor} 0%, transparent 70%)` }} />
                                        <span className="absolute top-3 right-3 text-xs font-black px-2.5 py-1 rounded-xl tracking-widest z-10"
                                            style={game.badgeStyle}>
                                            {tGames(`${game.id}.badge`)}
                                        </span>
                                        {locked && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <div className="flex flex-col items-center gap-1 opacity-90">
                                                    <span className="text-3xl">🔒</span>
                                                    <span className="text-xs font-black text-yellow-400 bg-black/60 px-2 py-0.5 rounded-lg">{tGames('card.proNeeded')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col flex-1 p-4 gap-1">
                                        <div className="w-8 h-1 rounded-full mb-1" style={{ background: game.gradient }} />
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-white font-black text-base leading-tight">
                                                    {tGames(`${game.id}.name`)}
                                                </h3>
                                                <p className="text-white/40 font-bold text-xs tracking-wider">
                                                    {tGames(`${game.id}.sub`).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-white/60 text-sm font-medium leading-relaxed mt-1 flex-1">
                                            {tGames(`${game.id}.desc`)}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-3 font-bold text-sm"
                                            style={{ color: locked ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                                            <span className="group-hover:text-white transition-colors duration-200">
                                                {locked ? tGames('card.proMode') : tGames('card.start')}
                                            </span>
                                            <span className="transition-all duration-300 group-hover:translate-x-1.5 inline-block">→</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="w-full max-w-6xl mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <button onClick={() => router.push('/teacher/create')}
                        className="btn-primary flex items-center justify-center gap-3 py-4 text-base rounded-2xl">
                        {t('hero.createQuiz')}
                    </button>
                    <button onClick={() => router.push('/pricing')}
                        className="flex items-center justify-center gap-3 py-4 text-base rounded-2xl font-extrabold transition-all hover:scale-105"
                        style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)', color: '#FFD700' }}>
                        {t('hero.goPro')}
                    </button>
                </motion.div>

                <SocialProof />
                <HowItWorks />

                {/* --- SEO: Maqolalar va Ilmiy Yangiliklar (Articles & Insights) --- */}
                <section className="w-full max-w-6xl mt-16 mb-8 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white">Maqolalar va Ilmiy Yangiliklar</h2>
                            <p className="text-white/40 font-bold text-sm mt-1">Ta'lim va texnologiya tendensiyalari</p>
                        </div>
                        <Link href={`/${locale}/blog`} className="text-blue-400 hover:text-blue-300 font-bold text-sm transition-colors flex items-center gap-1">
                            Barcha maqolalar <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recentArticles.map((article, i) => (
                            <motion.article 
                                key={article.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                                className="glass rounded-3xl overflow-hidden flex flex-col group border border-white/10 hover:border-blue-500/30 transition-all"
                            >
                                <div className="relative w-full h-48 overflow-hidden">
                                    <Image 
                                        src={article.imageUrl} 
                                        alt={article.title} 
                                        fill 
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, 33vw"
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
                                    <h3 className="text-white font-bold text-lg leading-snug mb-3 group-hover:text-blue-300 transition-colors line-clamp-2">
                                        <Link href={`/${locale}/blog/${article.slug}`}>
                                            {article.title}
                                        </Link>
                                    </h3>
                                    <p className="text-white/50 text-sm leading-relaxed mb-6 line-clamp-3">
                                        {article.excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <time className="text-white/30 text-xs font-bold">{new Date(article.date).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                                        <Link href={`/${locale}/blog/${article.slug}`} className="text-white font-bold text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                                            Batafsil <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </Link>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </section>

                <Leaderboard />
            </main>

            <footer className="relative z-10 text-center py-8 px-4 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
                    {/* Links */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/40 font-semibold text-sm">
                        <Link href={`/${locale}/blog`} className="hover:text-white/70 transition-colors">Blog</Link>
                        <Link href={`/${locale}/pricing`} className="hover:text-white/70 transition-colors">Tariflar</Link>
                        <Link href={`/${locale}/muallif`} className="hover:text-white/70 transition-colors">Muallif</Link>
                        <a href="https://t.me/zukkoo_uz" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Yordam</a>
                        <Link href={`/${locale}/about`} className="hover:text-white/70 transition-colors">Haqimizda</Link>
                        <Link href={`/${locale}/privacy`} className="hover:text-white/70 transition-colors">Maxfiylik</Link>
                        <Link href={`/${locale}/terms`} className="hover:text-white/70 transition-colors">Shartlar</Link>
                    </div>
                    {/* Social icons */}
                    <div className="flex items-center gap-4">
                        <a href="https://t.me/zukkoo_uz" target="_blank" rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)' }}
                            aria-label="Telegram">
                            <svg viewBox="0 0 24 24" fill="#0088cc" className="w-4 h-4">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                        </a>
                        <a href="https://instagram.com/zukkoo.uz" target="_blank" rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                            style={{ background: 'rgba(225,48,108,0.15)', border: '1px solid rgba(225,48,108,0.3)' }}
                            aria-label="Instagram">
                            <svg viewBox="0 0 24 24" fill="#E1306C" className="w-4 h-4">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                            </svg>
                        </a>
                    </div>
                    {/* Original footer text — saqlab qolindi */}
                    <p className="text-white/25 font-semibold text-xs">{t('footer')}</p>
                </div>
            </footer>

            <InstallBanner />
        </div>
    );
}
