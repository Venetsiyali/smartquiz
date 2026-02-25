'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TeamData {
    id: string;
    name: string;
    emoji: string;
    color: string;
    score: number;
    health: number;
    comboCount: number;
    shieldActiveUntil: number;
    shieldUsed: boolean;
    rank?: number;
}

interface Props {
    myTeam: TeamData | null;
    allTeams: TeamData[];
    playerId?: string;
    justAnsweredCorrect?: boolean; // pulse on correct
    comboTriggered?: boolean;
}

export default function TeamHUD({ myTeam, allTeams, justAnsweredCorrect, comboTriggered }: Props) {
    const [showLowHealth, setShowLowHealth] = useState(false);
    const [showCombo, setShowCombo] = useState(false);
    const [pointPop, setPointPop] = useState(false);
    const prevHealth = useRef(myTeam?.health ?? 100);

    useEffect(() => {
        if (!myTeam) return;
        if (myTeam.health < 40 && prevHealth.current >= 40) setShowLowHealth(true);
        prevHealth.current = myTeam.health;
    }, [myTeam]);

    useEffect(() => {
        if (comboTriggered) {
            setShowCombo(true);
            setTimeout(() => setShowCombo(false), 2500);
        }
    }, [comboTriggered]);

    useEffect(() => {
        if (justAnsweredCorrect) {
            setPointPop(true);
            setTimeout(() => setPointPop(false), 1000);
        }
    }, [justAnsweredCorrect]);

    if (!myTeam) return null;

    const sortedTeams = [...allTeams].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    const myRank = sortedTeams.findIndex(t => t.id === myTeam.id) + 1;
    const isShielded = myTeam.shieldActiveUntil > Date.now();
    const healthPct = Math.max(0, Math.min(100, myTeam.health));
    const healthColor = healthPct > 60 ? '#22c55e' : healthPct > 30 ? '#f59e0b' : '#ef4444';

    return (
        <>
            {/* Sticky Team Banner */}
            <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="fixed top-0 left-0 right-0 z-40 px-3 pt-2 pb-2 flex items-center gap-3"
                style={{
                    background: `linear-gradient(135deg, ${myTeam.color}33, rgba(0,0,0,0.85))`,
                    borderBottom: `2px solid ${myTeam.color}66`,
                    backdropFilter: 'blur(12px)',
                }}>

                {/* Team emoji + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{myTeam.emoji}</span>
                    <div className="min-w-0">
                        <p className="font-black text-xs tracking-widest truncate" style={{ color: myTeam.color }}>
                            {myTeam.name}
                        </p>
                    </div>
                </div>

                {/* Health */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm">❤️</span>
                    <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <motion.div
                            animate={{ width: `${healthPct}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: healthColor, boxShadow: healthPct < 30 ? `0 0 6px ${healthColor}` : 'none' }}
                        />
                    </div>
                    <span className="text-xs font-black" style={{ color: healthColor }}>{healthPct}%</span>
                </div>

                {/* Rank */}
                <div className="shrink-0 flex flex-col items-center">
                    <span className="text-xs font-black text-white/60">
                        {myRank === 1 ? '👑' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : `#${myRank}`}
                    </span>
                    <span className="text-[9px] text-white/40 font-bold">{allTeams.length} ichida</span>
                </div>

                {/* Shield indicator */}
                {isShielded && (
                    <span className="text-sm animate-pulse shrink-0">🛡️</span>
                )}
            </motion.div>

            {/* Low Health Alert */}
            <AnimatePresence>
                {showLowHealth && myTeam.health < 40 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl"
                        style={{
                            background: 'rgba(239,68,68,0.95)',
                            boxShadow: '0 0 30px rgba(239,68,68,0.5)',
                            whiteSpace: 'nowrap',
                        }}>
                        <p className="text-white font-black text-sm text-center">
                            ⚠️ Jamoangiz yordam kutmoqda!
                        </p>
                        <button onClick={() => setShowLowHealth(false)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                            ×
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Combo Popup */}
            <AnimatePresence>
                {showCombo && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 1.3 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center"
                    >
                        <div className="px-6 py-3 rounded-2xl"
                            style={{
                                background: 'rgba(0,0,0,0.9)',
                                border: '2px solid #FFD600',
                                boxShadow: '0 0 40px rgba(255,214,0,0.6)',
                            }}>
                            <p className="text-3xl font-black text-yellow-400">🔥 COMBO!</p>
                            <p className="text-white font-bold text-sm">Jamoa +100 ball!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Point Pop */}
            <AnimatePresence>
                {pointPop && (
                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -40 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="fixed bottom-28 right-6 z-50 pointer-events-none font-black text-green-400 text-xl"
                        style={{ textShadow: '0 0 10px #22c55e' }}>
                        ✅ +ball
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
