'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '@/lib/subscriptionContext';
import { useState, useEffect } from 'react';

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

// ─── Dynamic Metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { gameId: string } }) {
    const game = GAME_CONFIG[params.gameId];
    if (!game) return { title: 'O\'yin topilmadi | Zukkoo.uz' };

    return {
        title: `${game.name} — ${game.sub}`,
        description: game.desc,
        openGraph: {
            title: `${game.name} — ${game.sub} | Zukkoo.uz`,
            description: game.desc,
            url: `https://zukkoo.uz/play/${params.gameId}`,
            images: [
                {
                    url: `https://zukkoo.uz${game.image}`,
                    width: 1200,
                    height: 630,
                    alt: game.name,
                }
            ],
            type: 'website',
            locale: 'uz_UZ',
            siteName: 'Zukkoo Platformasi',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${game.name} | Zukkoo.uz`,
            description: game.desc,
            images: [`https://zukkoo.uz${game.image}`],
        }
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GameDetailPage({
    params: { gameId },
}: {
    params: { gameId: string };
}) {
    const router = useRouter();
    const { isPro } = useSubscription();
    const cfg = GAME_CONFIG[gameId];

    // Instruction modal state
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // Automatically show instruction modal for all games
        if (['1', '2', '3', '4', '5', '6'].includes(gameId as string)) {
            setShowInstructions(true);
        }
    }, [gameId]);

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
                                        onClick={() => {
                                            const m = gameId === '1' ? 'classic' : gameId === '2' ? 'order' : gameId === '3' ? 'match' : gameId === '4' ? 'blitz' : gameId === '5' ? 'anagram' : 'team';
                                            router.push(`/teacher/create?mode=${m}`);
                                        }}
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

            {/* ── Instruction Modal ── */}
            <AnimatePresence>
                {showInstructions && ['1', '2', '3', '4', '5', '6'].includes(gameId as string) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
                    >
                        {gameId === '1' && (
                            <motion.div
                                initial={{ y: -50, opacity: 0, scale: 0.95 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl"
                                style={{
                                    background: 'rgba(15,23,42,0.85)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    boxShadow: '0 0 40px rgba(59,130,246,0.2)'
                                }}
                            >
                                {/* Header Gradient */}
                                <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)' }} />

                                <div className="p-6 md:p-8 space-y-6">
                                    {/* Title */}
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-lg">
                                            Zukkoo: Klassik Quiz<br />
                                            <span style={{ color: '#60a5fa' }}>Qoidalari 🏆</span>
                                        </h2>
                                    </div>

                                    {/* Rules List */}
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(59,130,246,0.1)' }}
                                        >
                                            <div className="text-2xl">🎯</div>
                                            <p className="text-sm font-bold text-white/90 leading-snug">
                                                4 ta variantdan bitta to&apos;g&apos;ri javobni toping.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(59,130,246,0.1)' }}
                                        >
                                            <div className="text-2xl">⏱️</div>
                                            <p className="text-sm font-bold text-white/90 leading-snug">
                                                Vaqtga e&apos;tibor bering: qanchalik tez topsangiz, shunchalik ko&apos;p ball!
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(59,130,246,0.1)' }}
                                        >
                                            <div className="text-2xl">📊</div>
                                            <p className="text-sm font-bold text-white/90 leading-snug">
                                                Har bir savoldan keyin asosiy ekranda reytingni kuzatib boring.
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowInstructions(false)}
                                            className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                                boxShadow: '0 8px 25px rgba(59,130,246,0.4)',
                                                border: '1px solid rgba(96,165,250,0.5)'
                                            }}
                                        >
                                            Tushunarli, boshladik! 🚀
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameId === '2' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl"
                                style={{
                                    background: 'rgba(2,26,20,0.85)',
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    boxShadow: '0 0 40px rgba(16,185,129,0.2)'
                                }}
                            >
                                {/* Header Gradient */}
                                <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #047857, #10b981, #34d399)' }} />

                                <div className="p-6 md:p-8 space-y-6">
                                    {/* Title */}
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-lg">
                                            Mantiqiy zanjir:<br />
                                            <span style={{ color: '#34d399' }}>Algoritmni tiklang! 🧱</span>
                                        </h2>
                                    </div>

                                    {/* Drag Animation Simulation */}
                                    <div className="flex flex-col items-center justify-center py-2 relative h-28 pointer-events-none select-none">
                                        <div className="w-full max-w-[220px] h-10 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)', border: '2px dashed rgba(16,185,129,0.4)', marginBottom: '8px' }} />
                                        <div className="w-full max-w-[220px] h-10 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)', border: '2px dashed rgba(16,185,129,0.4)' }} />
                                        <motion.div
                                            animate={{ y: [0, -48, 0] }}
                                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                            className="absolute w-full max-w-[220px] h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg"
                                            style={{ background: 'linear-gradient(135deg,#047857,#059669)', color: 'white', bottom: 8, boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
                                        >
                                            Blok!
                                            <motion.div
                                                animate={{ scale: [1, 0.8, 1], opacity: [0.6, 1, 0.6] }}
                                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                                className="absolute -bottom-4 right-6 text-2xl drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]"
                                            >
                                                👆
                                            </motion.div>
                                        </motion.div>
                                    </div>

                                    {/* Rules List */}
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(16,185,129,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">🧩</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Bloklarni ushlab, to&apos;g&apos;ri ketma-ketlikda yuqoridan pastga joylang.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(16,185,129,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">⚡</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Zanjir qanchalik aniq va tez bo&apos;lsa, ball shunchalik baland!
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(16,185,129,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">✨</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Xato qilsangiz, tizim sizga to&apos;g&apos;ri yo&apos;lni ko&apos;rsatadi.
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowInstructions(false)}
                                            className="w-full py-4 rounded-2xl font-black text-[15px] md:text-lg text-white transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #059669, #10b981)',
                                                boxShadow: '0 8px 25px rgba(16,185,129,0.4)',
                                                border: '1px solid rgba(52,211,153,0.5)'
                                            }}
                                        >
                                            Zanjirni qurishni boshladik! ⚡
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameId === '3' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl"
                                style={{
                                    background: 'rgba(8,15,37,0.85)',
                                    border: '1px solid rgba(6,182,212,0.3)',
                                    boxShadow: '0 0 50px rgba(6,182,212,0.2)'
                                }}
                            >
                                {/* Header Gradient */}
                                <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #0284c7, #06b6d4, #22d3ee)' }} />

                                <div className="p-6 md:p-8 space-y-6">
                                    {/* Title */}
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-lg">
                                            Terminlar jangi:<br />
                                            <span style={{ color: '#22d3ee' }}>Bilim uchqunini hosil qiling! 🔥</span>
                                        </h2>
                                    </div>

                                    {/* Matching Animation Simulation */}
                                    <div className="flex items-center justify-center gap-2 py-4 h-24 relative pointer-events-none select-none">
                                        <motion.div
                                            animate={{ x: [0, 40, 0], scale: [1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                            className="w-24 h-16 rounded-xl flex items-center justify-center font-bold text-xs shadow-lg z-10"
                                            style={{ background: 'linear-gradient(135deg,#0369a1,#0ea5e9)', color: 'white', border: '1px solid rgba(14,165,233,0.5)', boxShadow: '0 4px 15px rgba(14,165,233,0.4)' }}
                                        >
                                            Termin
                                        </motion.div>
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", times: [0, 0.5, 1] }}
                                            className="absolute z-0 w-16 h-16 rounded-full"
                                            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.8) 0%, transparent 70%)' }}
                                        />
                                        <motion.div
                                            animate={{ x: [0, -40, 0], scale: [1, 1.1, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                            className="w-24 h-16 rounded-xl flex items-center justify-center font-bold text-xs shadow-lg z-10"
                                            style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', border: '1px solid rgba(20,184,166,0.5)', boxShadow: '0 4px 15px rgba(20,184,166,0.4)' }}
                                        >
                                            Izoh
                                        </motion.div>
                                    </div>

                                    {/* Rules List */}
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(6,182,212,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">🔗</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Termin va uning izohini ketma-ket bosib, juftlang.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(6,182,212,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">⏳</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                To&apos;g&apos;ri juftliklar g&apos;oyib bo&apos;ladi, xatolar esa vaqtingizni oladi.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(6,182,212,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">✅</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Hamma juftlikni topsangiz, raund yakunlanadi.
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowInstructions(false)}
                                            className="w-full py-4 rounded-2xl font-black text-[15px] md:text-lg text-white transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                                                boxShadow: '0 8px 25px rgba(6,182,212,0.4)',
                                                border: '1px solid rgba(34,211,238,0.5)'
                                            }}
                                        >
                                            Jangga tayyorman! ⚔️
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameId === '4' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                className="w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl"
                                style={{
                                    background: 'rgba(20,5,5,0.9)',
                                    border: '2px solid rgba(220,38,38,0.5)',
                                    boxShadow: '0 0 60px rgba(220,38,38,0.3)'
                                }}
                            >
                                {/* Header Gradient */}
                                <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #991b1b, #dc2626, #ef4444)' }} />

                                <div className="p-6 md:p-8 space-y-6">
                                    {/* Title Shake */}
                                    <motion.div
                                        animate={{ x: [-2, 2, -2, 2, 0] }}
                                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", repeatDelay: 2 }}
                                    >
                                        <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-lg">
                                            Bliz-Sohat:<br />
                                            <span style={{ color: '#ef4444' }}>Bilimlar poygasiga tayyormisiz? ⚡</span>
                                        </h2>
                                    </motion.div>

                                    {/* High-stakes Timer Animation */}
                                    <div className="flex items-center justify-center py-2 h-20 relative pointer-events-none select-none">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], color: ['#ef4444', '#f87171', '#ef4444'] }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                                            className="text-6xl font-black italic drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                                            style={{ textShadow: '2px 2px 0 #7f1d1d' }}
                                        >
                                            03
                                        </motion.div>
                                    </div>

                                    {/* Rules List */}
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(220,38,38,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">⏱️</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Har bir savolga bor-yo&apos;g&apos;i 3-5 soniya vaqtingiz bor.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(220,38,38,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">🚦</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Faqat ikkita tanlov: To&apos;g&apos;ri (<span className="text-green-400">Yashil</span>) yoki Noto&apos;g&apos;ri (<span className="text-red-400">Qizil</span>).
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(220,38,38,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">⚠️</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Xato qilmang, aks holda tezlikni yo&apos;qotasiz!
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            animate={{ boxShadow: ['0 0 20px rgba(220,38,38,0.5)', '0 0 40px rgba(220,38,38,0.8)', '0 0 20px rgba(220,38,38,0.5)'] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            onClick={() => setShowInstructions(false)}
                                            className="w-full py-4 rounded-2xl font-black text-[15px] md:text-xl text-white flex items-center justify-center gap-2 italic tracking-wider"
                                            style={{
                                                background: 'linear-gradient(135deg, #b91c1c, #ef4444)',
                                                border: '2px solid rgba(248,113,113,0.8)'
                                            }}
                                        >
                                            GAZINI BOSDIK! 🏎️
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameId === '5' && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                className="w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl backdrop-blur-xl"
                                style={{
                                    background: 'rgba(15,10,30,0.85)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    boxShadow: '0 0 50px rgba(139,92,246,0.2)'
                                }}
                            >
                                {/* Foggy CSS Effect Simulation inside Modal */}
                                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at top, rgba(167,139,250,0.4) 0%, transparent 60%)', mixBlendMode: 'screen' }} />

                                {/* Header Gradient */}
                                <div className="h-2 w-full relative z-10" style={{ background: 'linear-gradient(90deg, #6d28d9, #8b5cf6, #c4b5fd)' }} />

                                <div className="p-6 md:p-8 space-y-6 relative z-10">
                                    {/* Title with Magnifying Glass */}
                                    <div className="relative">
                                        <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-lg z-10 relative">
                                            Yashirin kod:<br />
                                            <span style={{ color: '#c4b5fd' }}>Detektivlik qobiliyatingizni sinab ko&apos;ring! 🔍</span>
                                        </h2>
                                        {/* Orbiting Magnifying Glass */}
                                        <motion.div
                                            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                            className="absolute top-1/2 left-1/2 -mt-8 -ml-8 w-16 h-16 origin-[60px_60px] opacity-30 select-none pointer-events-none text-4xl"
                                        >
                                            🔎
                                        </motion.div>
                                    </div>

                                    {/* Letter Layout Simulation */}
                                    <div className="flex flex-col items-center justify-center py-2 h-24 relative pointer-events-none select-none gap-2">
                                        <div className="flex gap-2">
                                            <motion.div animate={{ rotate: [0, -10, 0], y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl text-white border shadow-md" style={{ background: 'rgba(139,92,246,0.2)', borderColor: 'rgba(139,92,246,0.5)' }}>D</motion.div>
                                            <motion.div animate={{ rotate: [0, 15, 0], y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl text-white border shadow-md" style={{ background: 'rgba(139,92,246,0.2)', borderColor: 'rgba(139,92,246,0.5)' }}>O</motion.div>
                                            <motion.div animate={{ rotate: [0, -5, 0], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl text-white border shadow-md" style={{ background: 'rgba(139,92,246,0.2)', borderColor: 'rgba(139,92,246,0.5)' }}>K</motion.div>
                                        </div>
                                        <div className="flex gap-1 mt-2">
                                            <div className="w-12 h-2 rounded-full" style={{ background: 'rgba(196,181,253,0.3)' }} />
                                            <div className="w-12 h-2 rounded-full" style={{ background: 'rgba(196,181,253,0.3)' }} />
                                            <div className="w-12 h-2 rounded-full" style={{ background: 'rgba(196,181,253,0.3)' }} />
                                        </div>
                                    </div>

                                    {/* Rules List */}
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(139,92,246,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">🧩</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Chalkash harflardan ma&apos;noli IT terminini yig&apos;ing.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(139,92,246,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">🔓</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Har bir harfni o&apos;rniga qo&apos;yib, yashirin kodni oching.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(139,92,246,0.1)' }}
                                        >
                                            <div className="text-2xl mt-0.5">💡</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Qiynalsangiz, &apos;Yordam&apos; tugmasidan foydalaning (lekin u ballni oladi!).
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowInstructions(false)}
                                            className="w-full py-4 rounded-2xl font-black text-[15px] md:text-lg text-white transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                                                boxShadow: '0 8px 25px rgba(139,92,246,0.4)',
                                                border: '1px solid rgba(196,181,253,0.5)'
                                            }}
                                        >
                                            Kodni aniqlashni boshladik! 🕵️‍♂️
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameId === '6' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: -100 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 100 }}
                                transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
                                className="w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl backdrop-blur-md"
                                style={{
                                    background: 'rgba(10,5,25,0.85)',
                                    border: '2px solid rgba(234,179,8,0.4)',
                                    boxShadow: '0 0 60px rgba(234,179,8,0.2)'
                                }}
                            >
                                {/* Floating Particles Simulation inside Modal */}
                                <motion.div animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute z-0 w-2 h-2 rounded-full bg-yellow-400 blur-sm top-1/4 left-1/4" />
                                <motion.div animate={{ y: [0, 30, 0], opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 6 }} className="absolute z-0 w-3 h-3 rounded-full bg-yellow-300 blur-sm top-1/2 right-1/4" />
                                <motion.div animate={{ x: [0, 20, 0], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 5 }} className="absolute z-0 w-1.5 h-1.5 rounded-full bg-white blur-sm bottom-1/4 left-1/3" />

                                {/* Header Gradient */}
                                <div className="h-2 w-full relative z-10" style={{ background: 'linear-gradient(90deg, #ca8a04, #eab308, #fef08a)' }} />

                                <div className="p-6 md:p-8 space-y-6 relative z-10">
                                    {/* Title */}
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white text-center drop-shadow-lg">
                                            Jamoaviy qutqaruv:<br />
                                            <span style={{ color: '#fef08a' }}>Birlikda - kuch! 🤝</span>
                                        </h2>
                                    </div>

                                    {/* Collaborative Progress Animation */}
                                    <div className="flex flex-col items-center justify-center py-4 relative pointer-events-none select-none">
                                        <div className="w-full h-8 rounded-full border border-yellow-600/30 overflow-hidden relative" style={{ background: 'rgba(234,179,8,0.1)' }}>
                                            <motion.div
                                                animate={{ width: ['10%', '80%', '10%'] }}
                                                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                                                className="h-full relative rounded-full"
                                                style={{ background: 'linear-gradient(90deg, #ca8a04, #eab308)' }}
                                            >
                                                {/* Pushing Avatars */}
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex -space-x-2 drop-shadow-lg">
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-blue-500 flex items-center justify-center text-xs">🧑‍🚀</motion.div>
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-green-500 flex items-center justify-center text-xs">👨‍🚀</motion.div>
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-purple-500 flex items-center justify-center text-xs">👩‍🚀</motion.div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Rules List */}
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(234,179,8,0.15)' }}
                                        >
                                            <div className="text-2xl mt-0.5">🧑‍🤝‍🧑</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Siz jamoaning bir qismisiz, har bir javobingiz guruh uchun muhim.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(234,179,8,0.15)' }}
                                        >
                                            <div className="text-2xl mt-0.5">🚀</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                To&apos;g&apos;ri javoblar jamoani marraga yaqinlashtiradi.
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex gap-4 items-start p-3 rounded-2xl"
                                            style={{ background: 'rgba(234,179,8,0.15)' }}
                                        >
                                            <div className="text-2xl mt-0.5">💔</div>
                                            <p className="text-[13px] md:text-sm font-bold text-white/90 leading-snug">
                                                Xato qilmang, aks holda jamoangizning umumiy &apos;joni&apos; kamayadi.
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            animate={{ boxShadow: ['0 0 15px rgba(234,179,8,0.4)', '0 0 30px rgba(234,179,8,0.8)', '0 0 15px rgba(234,179,8,0.4)'] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            onClick={() => setShowInstructions(false)}
                                            className="w-full py-4 rounded-2xl font-black text-[15px] md:text-lg text-black transition-all flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #facc15, #ca8a04)',
                                                border: '2px solid #fef08a'
                                            }}
                                        >
                                            Jamoani qutqarishga tayyorman! 🚀
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
