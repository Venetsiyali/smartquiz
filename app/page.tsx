'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSubscription, CrownBadge } from '@/lib/subscriptionContext';
import { motion } from 'framer-motion';

const GAMES = [
    {
        id: 'classic',
        name: 'Zukkoo',
        sub: 'Klassik viktorina',
        image: '/images/games/1.webp',
        gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
        glowColor: 'rgba(59,130,246,0.5)',
        badge: 'BEPUL',
        badgeStyle: { background: 'rgba(0,230,118,0.22)', color: '#00E676', border: '1px solid rgba(0,230,118,0.5)' },
        desc: "Ko'p tanlov, To'g'ri/Noto'g'ri savollar. Real-vaqt reytingi.",
        route: '/play/1',
        pro: false,
    },
    {
        id: 'order',
        name: 'Mantiqiy zanjir',
        sub: 'Sorting Game',
        image: '/images/games/2.webp',
        gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 60%, #22c55e 100%)',
        glowColor: 'rgba(34,197,94,0.5)',
        badge: 'BEPUL',
        badgeStyle: { background: 'rgba(0,230,118,0.22)', color: '#00E676', border: '1px solid rgba(0,230,118,0.5)' },
        desc: "Elementlarni to'g'ri tartibda joylashtiring. Mantiqiy fikrlash!",
        route: '/play/2',
        pro: false,
    },
    {
        id: 'match',
        name: 'Terminlar jangi',
        sub: 'Matching Game',
        image: '/images/games/3.webp',
        gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)',
        glowColor: 'rgba(124,58,237,0.5)',
        badge: 'PRO',
        badgeStyle: { background: 'rgba(255,215,0,0.18)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.5)' },
        desc: "Juftliklarni mos ulashtiring. Terminlar va ta'riflar.",
        route: '/play/3',
        pro: true,
    },
    {
        id: 'blitz',
        name: 'Bliz-Sohat',
        sub: 'True/False Duel',
        image: '/images/games/4.webp',
        gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)',
        glowColor: 'rgba(220,38,38,0.5)',
        badge: 'BEPUL',
        badgeStyle: { background: 'rgba(0,230,118,0.22)', color: '#00E676', border: '1px solid rgba(0,230,118,0.5)' },
        desc: "To'g'ri yoki noto'g'ri — tez qaror qil! Vaqt bilan poyga.",
        route: '/play/4',
        pro: false,
    },
    {
        id: 'anagram',
        name: 'Yashirin kod',
        sub: 'Anagram',
        image: '/images/games/5.webp',
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #818cf8 100%)',
        glowColor: 'rgba(67,56,202,0.5)',
        badge: 'PRO',
        badgeStyle: { background: 'rgba(255,215,0,0.18)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.5)' },
        desc: "Aralashgan harflardan to'g'ri so'zni toping. Tezlik va ziyraklik!",
        route: '/play/5',
        pro: true,
    },
    {
        id: 'team',
        name: 'Jamoaviy qutqaruv',
        sub: 'Team Mode',
        image: '/images/games/6.webp',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #0f4c81 55%, #0ea5e9 100%)',
        glowColor: 'rgba(14,165,233,0.5)',
        badge: 'PRO',
        badgeStyle: { background: 'rgba(255,215,0,0.18)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.5)' },
        desc: "Jamoa bilan birgalikda g'alaba qozonish. Combo va qalqon!",
        route: '/play/6',
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
    const { isPro } = useSubscription();
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
                    <button onClick={() => router.push('/muallif')}
                        className="hidden sm:inline-flex px-4 py-2 rounded-xl font-bold text-sm text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10">
                        👤 Muallif
                    </button>
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

            <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8 md:px-12">

                {/* ── Dynamic Greeting ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-6xl mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
                        <div>
                            <p className="text-white/40 font-bold text-xs tracking-widest mb-1 uppercase">
                                {greeting}
                            </p>
                            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                Salom,{' '}
                                <span className="logo-z">{userName || 'Zukko'}</span>! 👋
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
                <div className="w-full max-w-6xl">
                    <p className="text-white/30 font-bold text-xs tracking-widest mb-5">O&apos;YIN TURLARI</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {GAMES.map((game, i) => {
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
                                // On hover update box-shadow via CSS group
                                >
                                    {/* ── Image section (16:9) ── */}
                                    <div className="relative w-full overflow-hidden"
                                        style={{ aspectRatio: '16/9' }}>

                                        {/* Actual game image */}
                                        <Image
                                            src={game.image}
                                            alt={game.name}
                                            fill
                                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                            loading="lazy"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            style={{
                                                filter: locked ? 'brightness(0.55) saturate(0.6)' : 'brightness(0.9)',
                                            }}
                                        />

                                        {/* Gradient overlay bottom fade */}
                                        <div className="absolute inset-0 pointer-events-none"
                                            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(10,14,30,0.95) 100%)' }} />

                                        {/* Glow on hover */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-t-3xl"
                                            style={{ boxShadow: `inset 0 0 60px ${game.glowColor}`, background: `radial-gradient(ellipse at center, ${game.glowColor} 0%, transparent 70%)` }} />

                                        {/* Badge — absolute top-right */}
                                        <span className="absolute top-3 right-3 text-xs font-black px-2.5 py-1 rounded-xl tracking-widest z-10"
                                            style={game.badgeStyle}>
                                            {game.badge}
                                        </span>

                                        {/* Lock overlay */}
                                        {locked && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <div className="flex flex-col items-center gap-1 opacity-90">
                                                    <span className="text-3xl">🔒</span>
                                                    <span className="text-xs font-black text-yellow-400 bg-black/60 px-2 py-0.5 rounded-lg">Pro kerak</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Text section ── */}
                                    <div className="flex flex-col flex-1 p-4 gap-1">
                                        {/* Gradient accent top bar */}
                                        <div className="w-8 h-1 rounded-full mb-1"
                                            style={{ background: game.gradient }} />

                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-white font-black text-base leading-tight">
                                                    {game.name}
                                                </h3>
                                                <p className="text-white/40 font-bold text-xs tracking-wider">
                                                    {game.sub.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-white/60 text-sm font-medium leading-relaxed mt-1 flex-1">
                                            {game.desc}
                                        </p>

                                        {/* CTA row */}
                                        <div className="flex items-center gap-1.5 mt-3 font-bold text-sm"
                                            style={{ color: locked ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                                            <span className="group-hover:text-white transition-colors duration-200">
                                                {locked ? "👑 Pro rejim" : "Boshlash"}
                                            </span>
                                            <span className="transition-all duration-300 group-hover:translate-x-1.5 inline-block">→</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Quick Actions ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="w-full max-w-6xl mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
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
