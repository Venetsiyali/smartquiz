'use client';

import { motion } from 'framer-motion';

interface LeaderboardEntry {
    nickname: string;
    avatar: string;
    score: number;
    streak: number;
    rank: number;
}

interface BlitzRaceBarProps {
    leaderboard: LeaderboardEntry[];
    answeredCount: number;
    totalPlayers: number;
    questionIndex: number;
    total: number;
    timeLeft: number;
    timeLimit: number;
    questionText: string;
    pin: string;
    onSkip: () => void;
}

const RANK_COLORS = ['#FFD600', '#C0C0C0', '#CD7F32', '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#e879f9', '#94a3b8'];

export default function BlitzRaceBar({
    leaderboard, answeredCount, totalPlayers,
    questionIndex, total, timeLeft, timeLimit, questionText, pin, onSkip,
}: BlitzRaceBarProps) {
    const maxScore = Math.max(1, ...leaderboard.map(e => e.score));
    const tColor = timeLeft > timeLimit * 0.6 ? '#00E676' : timeLeft > timeLimit * 0.3 ? '#FFD600' : '#FF1744';
    const pct = (timeLeft / timeLimit) * 100;

    return (
        <div className="bg-host min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-4">
                    <span className="text-white font-black text-xl">Zukk<span className="logo-z">oo</span></span>
                    <div className="glass-blue px-4 py-1.5 rounded-xl flex items-center gap-2">
                        <span className="text-white/40 font-bold text-sm">⚡ Savol</span>
                        <span className="text-white font-extrabold">{questionIndex + 1}</span>
                        <span className="text-white/40 font-bold">/ {total}</span>
                    </div>
                    <div className="glass px-3 py-1 rounded-xl">
                        <span className="text-white/50 font-bold text-xs">Javob berdi: </span>
                        <span className="font-black text-white">{answeredCount}</span>
                        <span className="text-white/40 font-bold"> / {totalPlayers}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer ring */}
                    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
                        <svg width="72" height="72" className="-rotate-90">
                            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                            <circle cx="36" cy="36" r="30" fill="none" stroke={tColor} strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 30}`}
                                strokeDashoffset={`${2 * Math.PI * 30 * (1 - pct / 100)}`}
                                style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${tColor})` }} />
                        </svg>
                        <span className="absolute font-black text-xl" style={{ color: tColor }}>{timeLeft}</span>
                    </div>
                    <div className="glass px-4 py-1.5 rounded-xl">
                        <span className="text-yellow-400 font-black text-lg tracking-widest">{pin}</span>
                    </div>
                </div>
            </div>

            {/* Statement */}
            <div className="px-10 py-6 shrink-0">
                <div className="glass-blue px-6 py-4 rounded-2xl text-center max-w-4xl mx-auto">
                    <p className="text-white font-black text-2xl leading-snug">{questionText}</p>
                    <p className="text-white/30 font-bold text-sm mt-1">⚡ Bliz-Sohat — TO&apos;G&apos;RI yoki NOTO&apos;G&apos;RI?</p>
                </div>
            </div>

            {/* RACE BARS */}
            <div className="flex-1 flex flex-col gap-3 px-10 py-4 overflow-y-auto">
                {leaderboard.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <motion.p animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-white/30 font-bold text-xl">
                            ⏳ Talabalar kirishi kutilmoqda...
                        </motion.p>
                    </div>
                ) : (
                    leaderboard.map((entry, i) => {
                        const barPct = maxScore > 0 ? Math.max(4, (entry.score / maxScore) * 100) : 4;
                        const color = RANK_COLORS[i] || '#94a3b8';
                        return (
                            <div key={entry.nickname} className="flex items-center gap-4">
                                {/* Rank + avatar */}
                                <div className="w-12 text-center shrink-0">
                                    <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                                </div>
                                <span className="text-3xl shrink-0">{entry.avatar}</span>
                                <span className="text-white font-extrabold text-base w-28 truncate shrink-0">{entry.nickname}</span>

                                {/* Bar track */}
                                <div className="flex-1 relative h-10 rounded-full overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <motion.div
                                        animate={{ width: `${barPct}%` }}
                                        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                                        className="h-full rounded-full flex items-center justify-end pr-3"
                                        style={{ background: `linear-gradient(90deg, ${color}55, ${color})`, minWidth: 40 }}>
                                        {/* Avatar on bar tip */}
                                        <span className="text-lg">{entry.avatar}</span>
                                    </motion.div>
                                    {/* Finish flag */}
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 text-lg">🏁</span>
                                </div>

                                {/* Score + streak */}
                                <div className="w-28 text-right shrink-0">
                                    <span className="font-black text-lg" style={{ color }}>{entry.score.toLocaleString()}</span>
                                    {entry.streak >= 3 && (
                                        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
                                            className="ml-2 text-orange-400 font-black text-sm">🔥{entry.streak}</motion.span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Progress bar + skip button */}
            <div className="shrink-0 px-8 pb-6 pt-2 flex items-center gap-4">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000 rounded-full"
                        style={{ width: `${pct}%`, background: tColor, boxShadow: `0 0 10px ${tColor}` }} />
                </div>
                <button onClick={onSkip}
                    className="px-5 py-2 rounded-xl font-black text-sm transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                    ⏭ O&apos;tkazib yuborish
                </button>
            </div>
        </div>
    );
}
