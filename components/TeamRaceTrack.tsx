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

interface ComboFlash { teamId: string; bonus: number; }

interface Props {
    teams: TeamData[];
    maxScore: number; // expected max possible score for progress calc
    combo?: ComboFlash | null;
    onShield?: (teamId: string) => void; // Pro: shield button handler
    isPro?: boolean;
    phase?: 'question' | 'leaderboard' | 'ended';
}

const TEAM_ROCKETS: Record<string, string> = {
    team_a: '🚀', team_b: '⚡', team_c: '🔬', team_d: '🎨', team_e: '🏆', team_f: '🌟',
};

function HealthBar({ health, color }: { health: number; color: string }) {
    const pct = Math.max(0, Math.min(100, health));
    const barColor = pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444';
    return (
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="h-full rounded-full"
                style={{ background: pct > 30 ? barColor : barColor, boxShadow: pct <= 30 ? `0 0 8px ${barColor}` : 'none' }}
            />
        </div>
    );
}

export default function TeamRaceTrack({ teams, maxScore, combo, onShield, isPro = false, phase }: Props) {
    const [comboFlash, setComboFlash] = useState<ComboFlash | null>(null);
    const [damageFlash, setDamageFlash] = useState<string | null>(null);
    const prevTeamsRef = useRef<TeamData[]>([]);

    useEffect(() => {
        if (combo) {
            setComboFlash(combo);
            setTimeout(() => setComboFlash(null), 2000);
        }
    }, [combo]);

    useEffect(() => {
        // Detect health drop → flash damage
        teams.forEach(t => {
            const prev = prevTeamsRef.current.find(p => p.id === t.id);
            if (prev && prev.health > t.health) {
                setDamageFlash(t.id);
                setTimeout(() => setDamageFlash(null), 600);
            }
        });
        prevTeamsRef.current = teams;
    }, [teams]);

    const safe = Math.max(maxScore, 1);

    // Sorted by rank for display but preserve all teams
    const sorted = [...teams].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

    return (
        <div className="relative w-full rounded-2xl overflow-hidden p-4 space-y-3"
            style={{ background: 'rgba(10,10,30,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-white font-black text-sm tracking-widest">🏁 JAMOA POYGASI</span>
                {phase === 'question' && (
                    <span className="text-white/40 text-xs font-bold animate-pulse">• jonli</span>
                )}
            </div>

            {/* Race Lanes */}
            {sorted.map(team => {
                const progress = Math.min(1, team.score / safe);
                const isShielded = team.shieldActiveUntil > Date.now();
                const isDamaged = damageFlash === team.id;

                return (
                    <motion.div
                        key={team.id}
                        animate={isDamaged ? { x: [-4, 4, -3, 3, 0] } : {}}
                        transition={{ duration: 0.35 }}
                        className="space-y-1"
                        style={{
                            background: isDamaged ? 'rgba(239,68,68,0.12)' : 'transparent',
                            borderRadius: '12px',
                            padding: '6px',
                            border: isShielded ? `1px solid ${team.color}` : '1px solid transparent',
                            boxShadow: isShielded ? `0 0 16px ${team.color}55` : 'none',
                            transition: 'all 0.3s',
                        }}>

                        {/* Team header row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{TEAM_ROCKETS[team.id] ?? '🚀'}</span>
                                <span className="font-black text-sm" style={{ color: team.color }}>{team.name}</span>
                                {team.rank === 1 && <span className="text-yellow-400 text-xs font-black">👑 #1</span>}
                                {isShielded && <span className="text-xs font-black animate-pulse" style={{ color: team.color }}>🛡️ Qalqon</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                {isPro && !team.shieldUsed && onShield && (
                                    <button
                                        onClick={() => onShield(team.id)}
                                        className="text-xs font-black px-2 py-1 rounded-lg transition-all hover:scale-105"
                                        style={{ background: `${team.color}22`, color: team.color, border: `1px solid ${team.color}55` }}>
                                        🛡️ Shield
                                    </button>
                                )}
                                <span className="font-black text-sm text-white">{team.score.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Race track */}
                        <div className="relative w-full h-7 rounded-full overflow-visible"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                            {/* Track fill */}
                            <motion.div
                                animate={{ width: `${Math.max(progress * 100, 4)}%` }}
                                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                                className="absolute left-0 top-0 h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${team.color}88, ${team.color})` }}
                            />
                            {/* Rocket icon at tip */}
                            <motion.div
                                animate={{ left: `calc(${Math.max(progress * 100, 4)}% - 18px)` }}
                                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                                className="absolute top-1/2 -translate-y-1/2 text-xl pointer-events-none select-none"
                                style={{ filter: isShielded ? `drop-shadow(0 0 8px ${team.color})` : 'none' }}>
                                {isShielded ? '🛡️' : (TEAM_ROCKETS[team.id] ?? '🚀')}
                            </motion.div>
                            {/* Finish flag */}
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🏁</span>
                        </div>

                        {/* Health bar */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40 font-bold w-4">❤️</span>
                            <HealthBar health={team.health} color={team.color} />
                            <span className="text-xs font-bold" style={{ color: team.health > 30 ? '#22c55e' : '#ef4444' }}>
                                {team.health}%
                            </span>
                        </div>
                    </motion.div>
                );
            })}

            {/* Combo Flash Overlay */}
            <AnimatePresence>
                {comboFlash && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1.1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.5, y: -30 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                        <div className="rounded-2xl px-8 py-4 text-center"
                            style={{
                                background: 'rgba(0,0,0,0.85)',
                                border: '2px solid #FFD600',
                                boxShadow: '0 0 40px rgba(255,214,0,0.5)',
                            }}>
                            <p className="text-4xl font-black text-yellow-400 animate-bounce">🔥 COMBO!</p>
                            <p className="text-white font-bold text-lg">
                                +{comboFlash.bonus} har bir a&apos;zoga!
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
