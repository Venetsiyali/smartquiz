'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription, CrownBadge } from '@/lib/subscriptionContext';
import { motion } from 'framer-motion';

const GAMES = [
    {
        id: 'classic',
        name: 'Zukkoo',
        sub: 'Klassik viktorina',
        emoji: '🧠',
        gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
        glowColor: 'rgba(59,130,246,0.35)',
        borderColor: 'rgba(96,165,250,0.4)',
        badge: 'BEPUL',
        badgeStyle: { background: 'rgba(0,230,118,0.18)', color: '#00E676', border: '1px solid rgba(0,230,118,0.4)' },
        desc: "Ko'p tanlov, To'g'ri/Noto'g'ri savollar. Real-vaqt reytingi.",
        route: '/teacher/create',
        pro: false,
    },
    {
        id: 'order',
        name: 'Mantiqiy zanjir',
        sub: 'Sorting Game',
        emoji: '🔗',
        gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 60%, #22c55e 100%)',
        glowColor: 'rgba(34,197,94,0.3)',
        borderColor: 'rgba(74,222,128,0.35)',
        badge: 'BEPUL',
        badgeStyle: { background: 'rgba(0,230,118,0.18)', color: '#00E676', border: '1px solid rgba(0,230,118,0.4)' },
        desc: 'Elementlarni to\'g\'ri tartibda joylashtiring. Mantiqiy fikrlash!',
        route: '/teacher/create',
        pro: false,
    },
    {
        id: 'match',
        name: 'Terminlar jangi',
        sub: 'Matching Game',
        emoji: '💎',
        gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)',
        glowColor: 'rgba(124,58,237,0.35)',
        borderColor: 'rgba(167,139,250,0.4)',
        badge: 'PRO',
        badgeStyle: { background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.4)' },
        desc: "Juftliklarni mos ulashtiring. Terminlar va ta'riflar.",
        route: '/teacher/create',
        pro: true,
    },
    {
        id: 'blitz',
        name: 'Bliz-Sohat',
        sub: 'True/False Duel',
        emoji: '⚡',
        gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)',
        glowColor: 'rgba(220,38,38,0.35)',
        borderColor: 'rgba(248,113,113,0.4)',
        badge: 'BEPUL',
        badgeStyle: { background: 'rgba(0,230,118,0.18)', color: '#00E676', border: '1px solid rgba(0,230,118,0.4)' },
        desc: "To'g'ri yoki noto'g'ri — tez qaror qil! Vaqt bilan poyga.",
        route: '/teacher/create',
        pro: false,
    },
    {
        id: 'anagram',
        name: 'Yashirin kod',
        sub: 'Anagram',
        emoji: '🔐',
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #818cf8 100%)',
        glowColor: 'rgba(67,56,202,0.35)',
        borderColor: 'rgba(129,140,248,0.4)',
        badge: 'PRO',
        badgeStyle: { background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.4)' },
        desc: "Aralashgan harflardan to'g'ri so'zni toping. Tezlik va ziyraklik!",
        route: '/teacher/create',
        pro: true,
    },
    {
        id: 'team',
        name: 'Jamoaviy qutqaruv',
        sub: 'Team Mode',
        emoji: '🏁',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #0f4c81 55%, #0ea5e9 100%)',
        glowColor: 'rgba(14,165,233,0.32)',
        borderColor: 'rgba(56,189,248,0.38)',
        badge: 'PRO',
        badgeStyle: { background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.4)' },
        desc: 'Jamoa bilan birgalikda g\'alaba qozonish. Salomatlik, combo va qalqon!',
        route: '/teacher/create',
        pro: true,
    },
];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Kechasi xursand';
    if (h < 12) return 'Xayrli tong';
    if (h < 18) return 'Xayrli kun';
    return 'Xayrli kech';
}

export default function LandingPage() {
    const router = useRouter();
    const { isPro, plan } = useSubscription();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const name = localStorage.getItem('zk_teacher_name') || '';
        setUserName(name);
    }, []);

    const greeting = getGreeting();

    return (
        <div className="bg-landing min-h-screen flex flex-col">
            {/* Animated background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', top: '-15%', left: '-10%' }} />
                <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FFD600, transparent)', bottom: '10%', right: '-5%', animationDelay: '1.5s' }} />
                <div className="absolute w-[300px] h-[300px] rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #00E676, transparent)', top: '40%', right: '20%', animationDelay: '3s' }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-black"
                        style={{ background: 'linear-gradient(135deg, #0056b3, #FFD600)' }}>Z</div>
                    <span className="text-2xl font-black text-white">
                        Zukk<span className="logo-z">oo</span>
                    </span>
                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(0,86,179,0.3)', border: '1px solid rgba(0,86,179,0.5)', color: '#60a5fa' }}>
                        TUIT · ATT
                    </span>
                    {isPro && <CrownBadge />}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/pricing')}
                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                        style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>
                        👑 Narxlar
                    </button>
                    <button onClick={() => router.push('/play')}
                        className="px-5 py-2.5 rounded-xl font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm">
                        📱 O&apos;yinga kirish
                    </button>
                    <button onClick={() => router.push('/teacher/create')} className="btn-primary text-sm px-5 py-2.5">
                        🎓 O&apos;qituvchi
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <main className="relative z-10 flex-1 flex flex-col items-center px-6 py-10 md:py-12">

                {/* ── Dynamic Greeting ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-5xl mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                        <div>
                            <p className="text-white/40 font-bold text-sm tracking-widest mb-1">
                                {greeting.toUpperCase()}
                            </p>
                            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                {userName
                                    ? <>Salom, <span className="logo-z">{userName}</span>! 👋</>
                                    : <>Salom! 👋</>
                                }
                                <span className="block text-white/50 font-semibold text-lg md:text-xl mt-1">
                                    Bugun qaysi o&apos;yinni o&apos;ynaymiz?
                                </span>
                            </h1>
                        </div>
                        <div className="sm:ml-auto flex items-center gap-3 shrink-0">
                            <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold"
                                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="text-white/40">Rejim:</span>
                                <span style={{ color: isPro ? '#FFD700' : '#00E676' }}>
                                    {isPro ? '👑 Pro' : '🎮 Bepul'}
                                </span>
                            </div>
                            <button onClick={() => router.push('/play')}
                                className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 flex items-center gap-2"
                                style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                                📱 O&apos;yinga kirish
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Game Cards Grid ── */}
                <div className="w-full max-w-5xl">
                    <p className="text-white/30 font-bold text-xs tracking-widest mb-5">O&apos;YIN TURLARI</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {GAMES.map((game, i) => {
                            const locked = game.pro && !isPro;
                            return (
                                <motion.button
                                    key={game.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.07 }}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        if (locked) { router.push('/pricing'); return; }
                                        router.push(game.route);
                                    }}
                                    className="relative text-left rounded-3xl overflow-hidden group transition-all duration-300 cursor-pointer"
                                    style={{
                                        background: game.gradient,
                                        border: `1px solid ${game.borderColor}`,
                                        boxShadow: `0 8px 32px ${game.glowColor}`,
                                        minHeight: '200px',
                                        padding: '1.5rem',
                                    }}
                                >
                                    {/* Sheen effect on hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />

                                    {/* Badge top-right */}
                                    <span className="absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-xl tracking-widest"
                                        style={game.badgeStyle}>
                                        {game.badge}
                                    </span>

                                    {/* Lock overlay for pro features if not pro */}
                                    {locked && (
                                        <div className="absolute inset-0 rounded-3xl flex items-end justify-end p-4 pointer-events-none"
                                            style={{ background: 'rgba(0,0,0,0.18)' }}>
                                            <span className="text-xs font-black text-yellow-400/80">🔒 Pro kerak</span>
                                        </div>
                                    )}

                                    {/* Emoji */}
                                    <div className="mb-4 text-6xl leading-none select-none"
                                        style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}>
                                        {game.emoji}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-white font-black text-xl leading-tight mb-0.5">
                                        {game.name}
                                    </h3>
                                    <p className="text-white/50 font-bold text-xs tracking-widest mb-3">
                                        {game.sub.toUpperCase()}
                                    </p>

                                    {/* Description */}
                                    <p className="text-white/70 text-sm font-semibold leading-relaxed">
                                        {game.desc}
                                    </p>

                                    {/* Arrow CTA */}
                                    <div className="mt-4 flex items-center gap-1.5 text-white/60 group-hover:text-white group-hover:gap-3 transition-all duration-300 font-bold text-sm">
                                        <span>{locked ? '👑 Pro rejimga o\'tish' : 'Boshlash'}</span>
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.55 }}
                    className="w-full max-w-5xl mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <button onClick={() => router.push('/teacher/create')}
                        className="btn-primary flex items-center justify-center gap-3 py-4 text-base rounded-2xl">
                        ✨ Quiz yaratish
                    </button>
                    <button onClick={() => router.push('/pricing')}
                        className="flex items-center justify-center gap-3 py-4 text-base rounded-2xl font-extrabold transition-all hover:scale-105"
                        style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)', color: '#FFD700' }}>
                        👑 Pro rejimga o&apos;tish
                    </button>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-6 text-white/30 font-semibold text-sm">
                © 2026 Zukkoo · TUIT ATT bo&apos;limi · Barcha huquqlar himoyalangan
            </footer>
        </div>
    );
}
