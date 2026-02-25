'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSubscription } from '@/lib/subscriptionContext';

// ─── Game Config ──────────────────────────────────────────────────────────────
const GAME_CONFIG: Record<string, {
    name: string;
    sub: string;
    image: string;
    emoji: string;
    pro: boolean;
    theme: {
        badge: string;
        badgeBg: string;
        badgeColor: string;
        accent: string;
        glow: string;
        overlay: string;
        cardBg: string;
        border: string;
        btnGradient: string;
        statBg: string;
    };
    style: string;
    desc: string;
    features: string[];
    timerColor: string;
    scoreColor: string;
}> = {
    '1': {
        name: 'Zukkoo',
        sub: 'Klassik viktorina',
        image: '/images/games/1.webp',
        emoji: '🧠',
        pro: false,
        theme: {
            badge: 'BEPUL',
            badgeBg: 'rgba(0,230,118,0.2)',
            badgeColor: '#00E676',
            accent: '#3b82f6',
            glow: 'rgba(59,130,246,0.6)',
            overlay: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,58,138,0.75) 100%)',
            cardBg: 'rgba(15,23,42,0.7)',
            border: 'rgba(59,130,246,0.35)',
            btnGradient: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
            statBg: 'rgba(59,130,246,0.12)',
        },
        style: 'Gologramma Arena',
        desc: "Ko'p tanlov va To'g'ri/Noto'g'ri savollar asosidagi klassik real-vaqt viktorina. Eng tez javob bergan — eng ko'p ball yig'adi!",
        features: ["⚡ Real-vaqt reyting", "⏱️ Har savol uchun vaqt", "🏆 Jonli liderlar jadvali", "🎯 Ko'p tanlov savollar"],
        timerColor: '#60a5fa',
        scoreColor: '#93c5fd',
    },
    '2': {
        name: 'Mantiqiy zanjir',
        sub: 'Sorting Game',
        image: '/images/games/2.webp',
        emoji: '🔗',
        pro: false,
        theme: {
            badge: 'BEPUL',
            badgeBg: 'rgba(0,230,118,0.2)',
            badgeColor: '#00E676',
            accent: '#10b981',
            glow: 'rgba(16,185,129,0.6)',
            overlay: 'linear-gradient(135deg, rgba(2,26,20,0.88) 0%, rgba(6,78,59,0.78) 100%)',
            cardBg: 'rgba(2,26,20,0.72)',
            border: 'rgba(16,185,129,0.35)',
            btnGradient: 'linear-gradient(135deg,#047857,#059669)',
            statBg: 'rgba(16,185,129,0.12)',
        },
        style: 'Circuit — Mikrosxema',
        desc: "Elementlarni to'g'ri mantiqiy tartibda qayta joylashtiring. Algoritmik fikrlash va tezkorlikni birlashtirgan noyob format!",
        features: ["🔗 Drag & Drop interfeys", "🧩 Mantiqiy ketma-ketlik", "⚡ Tezkor reyting tizimi", "💡 Bir nechta to'g'ri tartib"],
        timerColor: '#34d399',
        scoreColor: '#6ee7b7',
    },
    '3': {
        name: 'Terminlar jangi',
        sub: 'Matching Game',
        image: '/images/games/3.webp',
        emoji: '💎',
        pro: true,
        theme: {
            badge: 'PRO',
            badgeBg: 'rgba(255,215,0,0.18)',
            badgeColor: '#FFD700',
            accent: '#a78bfa',
            glow: 'rgba(167,139,250,0.6)',
            overlay: 'linear-gradient(135deg, rgba(15,10,40,0.88) 0%, rgba(76,29,149,0.78) 100%)',
            cardBg: 'rgba(15,10,40,0.72)',
            border: 'rgba(167,139,250,0.35)',
            btnGradient: 'linear-gradient(135deg,#6d28d9,#7c3aed)',
            statBg: 'rgba(167,139,250,0.12)',
        },
        style: 'Glassmorphism · Shaffof interfeys',
        desc: "Terminlar va ta'riflarni mos juftlarga ulang. Bilimlarni vizual tarzda sinab ko'rish uchun mukammal format!",
        features: ["💎 Juftliklar ushtirish", "🔍 Terminlar ma'lumotlar bazasi", "✨ Glassmorphism dizayn", "📊 Aniqlik statistikasi"],
        timerColor: '#c4b5fd',
        scoreColor: '#ddd6fe',
    },
    '4': {
        name: 'Bliz-Sohat',
        sub: 'True/False Duel',
        image: '/images/games/4.webp',
        emoji: '⚡',
        pro: false,
        theme: {
            badge: 'BEPUL',
            badgeBg: 'rgba(0,230,118,0.2)',
            badgeColor: '#00E676',
            accent: '#ef4444',
            glow: 'rgba(239,68,68,0.65)',
            overlay: 'linear-gradient(135deg, rgba(30,0,0,0.9) 0%, rgba(127,29,29,0.8) 100%)',
            cardBg: 'rgba(30,0,0,0.75)',
            border: 'rgba(239,68,68,0.4)',
            btnGradient: 'linear-gradient(135deg,#b91c1c,#dc2626)',
            statBg: 'rgba(239,68,68,0.12)',
        },
        style: 'Speed Race · Taymer bilan',
        desc: "To'g'ri yoki noto'g'ri — bir soniya ichida qaror qil! Eng tez refleksli o'yinchi g'alaba qozonadi!",
        features: ["⚡ 0.3 soniya reaksiya", "🏁 Ikki tanlov: ✅ / ❌", "🔥 Combo streak tizimi", "🎯 Tadqiqot asosida savollar"],
        timerColor: '#f87171',
        scoreColor: '#fca5a5',
    },
    '5': {
        name: 'Yashirin kod',
        sub: 'Anagram',
        image: '/images/games/5.webp',
        emoji: '🔐',
        pro: true,
        theme: {
            badge: 'PRO',
            badgeBg: 'rgba(255,215,0,0.18)',
            badgeColor: '#FFD700',
            accent: '#818cf8',
            glow: 'rgba(99,102,241,0.6)',
            overlay: 'linear-gradient(135deg, rgba(5,0,30,0.9) 0%, rgba(67,56,202,0.78) 100%)',
            cardBg: 'rgba(5,0,30,0.75)',
            border: 'rgba(99,102,241,0.38)',
            btnGradient: 'linear-gradient(135deg,#3730a3,#4338ca)',
            statBg: 'rgba(99,102,241,0.12)',
        },
        style: 'Detective Smoke · Mistik',
        desc: "Aralashtirilgan harflardan yashirin so'zni kashf eting. Kriptografik mantiq va so'z boyligi ham muhim!",
        features: ["🔐 Harflar anagrami", "🔍 Detective uslub", "🧩 O'zgaruvchan qiyinlik", "⌨️ Harflarni bosib yig'ish"],
        timerColor: '#a5b4fc',
        scoreColor: '#c7d2fe',
    },
    '6': {
        name: 'Jamoaviy qutqaruv',
        sub: 'Team Mode',
        image: '/images/games/6.webp',
        emoji: '🏁',
        pro: true,
        theme: {
            badge: 'PRO',
            badgeBg: 'rgba(255,215,0,0.18)',
            badgeColor: '#FFD700',
            accent: '#0ea5e9',
            glow: 'rgba(14,165,233,0.6)',
            overlay: 'linear-gradient(135deg, rgba(2,6,23,0.9) 0%, rgba(15,76,129,0.8) 100%)',
            cardBg: 'rgba(2,6,23,0.75)',
            border: 'rgba(14,165,233,0.35)',
            btnGradient: 'linear-gradient(135deg,#0369a1,#0284c7)',
            statBg: 'rgba(14,165,233,0.12)',
        },
        style: 'Cosmic Gold · Dark Space',
        desc: "Jamoaviy kuchni birlashtiring! Combo combo ko'paysin, qalqon ishlat, raqiblarni g'alaba poyoniga yetmay to'xtat!",
        features: ["🏁 2–6 ta jamoa", "❤️ Jamoaviy jonlar tizimi", "🔥 Combo bonus +100 ball", "🛡️ Taktik qalqon (Pro)"],
        timerColor: '#38bdf8',
        scoreColor: '#7dd3fc',
    },
};

// ─── Animated stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, color, bg, border }: {
    label: string; value: string; color: string; bg: string; border: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-5 py-3 rounded-2xl"
            style={{ background: bg, border: `1px solid ${border}` }}>
            <span className="text-xs font-black tracking-widest text-white/40 mb-1">{label}</span>
            <span className="text-2xl font-black" style={{ color }}>{value}</span>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GameDetailPage({
    params,
}: {
    params: Promise<{ gameId: string }>;
}) {
    const { gameId } = use(params);
    const router = useRouter();
    const { isPro } = useSubscription();
    const cfg = GAME_CONFIG[gameId];

    // Unknown game id → redirect to home
    if (!cfg) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white/50 text-xl font-bold mb-4">O&apos;yin topilmadi</p>
                    <button onClick={() => router.push('/')} className="text-blue-400 font-bold hover:underline">← Bosh sahifa</button>
                </div>
            </div>
        );
    }

    const locked = cfg.pro && !isPro;
    const { theme } = cfg;

    return (
        <div className="relative min-h-screen h-screen overflow-hidden flex flex-col">

            {/* ── Full-screen background image ── */}
            <div className="fixed inset-0 z-0">
                <Image
                    src={cfg.image}
                    alt={cfg.name}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                    style={{ filter: 'brightness(0.45) saturate(1.1)' }}
                />
                {/* Overlay */}
                <div className="absolute inset-0" style={{ background: theme.overlay }} />
                {/* Blur layer */}
                <div className="absolute inset-0 backdrop-blur-[2px]" />
                {/* Glow radial */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${theme.glow.replace('0.6', '0.12')} 0%, transparent 70%)` }} />
            </div>

            {/* ── Scan line decoration (theme motif) ── */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-5"
                style={{
                    backgroundImage: `repeating-linear-gradient(0deg, ${theme.accent}, ${theme.accent} 1px, transparent 1px, transparent 40px)`,
                }} />

            {/* ── Content ── */}
            <div className="relative z-10 flex flex-col h-full">

                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                        🏠 Dashbordga qaytish
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-3 py-1 rounded-xl tracking-widest"
                            style={{ background: theme.badgeBg, color: theme.badgeColor, border: `1px solid ${theme.badgeColor}55` }}>
                            {theme.badge}
                        </span>
                        <span className="text-xs font-bold text-white/30 hidden sm:block">{cfg.style}</span>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 px-6 pb-6 overflow-y-auto">

                    {/* Left: Game info */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        className="w-full max-w-lg flex flex-col gap-5"
                    >
                        {/* Game emoji + title */}
                        <div>
                            <div className="text-7xl mb-3 drop-shadow-2xl leading-none select-none"
                                style={{ filter: `drop-shadow(0 0 24px ${theme.glow})` }}>
                                {cfg.emoji}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-none mb-1">
                                {cfg.name}
                            </h1>
                            <p className="text-sm font-black tracking-widest" style={{ color: theme.accent }}>
                                {cfg.sub.toUpperCase()} · {cfg.style.toUpperCase()}
                            </p>
                        </div>

                        {/* Description */}
                        <p className="text-white/70 text-base font-semibold leading-relaxed max-w-md">
                            {cfg.desc}
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-2">
                            {cfg.features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 + i * 0.07 }}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: theme.statBg, border: `1px solid ${theme.border}`, color: 'rgba(255,255,255,0.8)' }}>
                                    {f}
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            {locked ? (
                                <>
                                    <button
                                        onClick={() => router.push('/pricing')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-base transition-all hover:scale-105 hover:brightness-110"
                                        style={{ background: 'linear-gradient(135deg,#B8860B,#FFD700)', color: '#0a0a0a', boxShadow: '0 6px 24px rgba(255,215,0,0.35)' }}>
                                        👑 Pro rejimga o&apos;tish
                                    </button>
                                    <button
                                        onClick={() => router.push('/')}
                                        className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white/50 hover:text-white transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        ← Orqaga
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => router.push('/teacher/create')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-base transition-all hover:scale-105 hover:brightness-110"
                                        style={{ background: theme.btnGradient, color: 'white', boxShadow: `0 6px 24px ${theme.glow.replace('0.6', '0.4')}` }}>
                                        🎓 Quiz yaratish
                                    </button>
                                    <button
                                        onClick={() => router.push('/play')}
                                        className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                                        📱 O&apos;yinga kirish
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Right: Live demo stats card */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
                        className="w-full max-w-sm"
                    >
                        <div className="rounded-3xl overflow-hidden"
                            style={{
                                background: theme.cardBg,
                                border: `1px solid ${theme.border}`,
                                backdropFilter: 'blur(20px)',
                                boxShadow: `0 20px 60px ${theme.glow.replace('0.6', '0.25')}`,
                            }}>

                            {/* Card header */}
                            <div className="relative h-44 overflow-hidden">
                                <Image
                                    src={cfg.image}
                                    alt={cfg.name}
                                    fill
                                    sizes="400px"
                                    loading="lazy"
                                    className="object-cover"
                                    style={{ filter: 'brightness(0.65)' }}
                                />
                                <div className="absolute inset-0"
                                    style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.8) 100%)' }} />
                                {/* Glow on image */}
                                <div className="absolute inset-0"
                                    style={{ background: `radial-gradient(ellipse at center, ${theme.glow.replace('0.6', '0.3')} 0%, transparent 70%)` }} />
                                <div className="absolute bottom-3 left-4">
                                    <p className="text-white font-black text-xl">{cfg.name}</p>
                                    <p className="text-white/50 text-xs font-bold">{cfg.sub}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="p-4 space-y-4">
                                <div className="flex gap-3">
                                    <StatCard
                                        label="BALL"
                                        value="1,250"
                                        color={cfg.scoreColor}
                                        bg={theme.statBg}
                                        border={theme.border}
                                    />
                                    <StatCard
                                        label="VAQT"
                                        value="0:18"
                                        color={cfg.timerColor}
                                        bg={theme.statBg}
                                        border={theme.border}
                                    />
                                    <StatCard
                                        label="SAVOL"
                                        value="3/10"
                                        color="rgba(255,255,255,0.6)"
                                        bg={theme.statBg}
                                        border={theme.border}
                                    />
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-white/40 mb-1.5">
                                        <span>PROGRESS</span>
                                        <span>30%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '30%' }}
                                            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ background: theme.btnGradient, boxShadow: `0 0 8px ${theme.glow}` }}
                                        />
                                    </div>
                                </div>

                                {/* Players online */}
                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                                    style={{ background: theme.statBg, border: `1px solid ${theme.border}` }}>
                                    <span className="text-xs font-black text-white/40 tracking-widest">JONLI O&apos;YINCHILAR</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
                                        <span className="font-black text-sm" style={{ color: theme.accent }}>24</span>
                                    </div>
                                </div>

                                {locked && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                        style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)' }}>
                                        <span className="text-base">👑</span>
                                        <span className="text-xs font-black text-yellow-400">Bu o&apos;yin Pro rejim talab qiladi</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
