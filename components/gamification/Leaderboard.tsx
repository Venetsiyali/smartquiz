'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getLevelFromXP } from '@/lib/gamification/xp';
import Image from 'next/image';

interface LeaderEntry {
    id: string;
    name: string | null;
    image: string | null;
    xp: number;
    streak: number;
    totalGamesPlayed: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
    const [data, setData] = useState<LeaderEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/gamification/leaderboard?limit=10')
            .then(r => r.json())
            .then(d => setData(d.leaderboard ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="w-full max-w-6xl mt-8 mb-4 relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5 }}
                className="mb-6"
            >
                <p className="text-white/30 font-bold text-xs tracking-widest mb-1 uppercase">Top o'yinchilar</p>
                <h2 className="text-2xl md:text-3xl font-black text-white">🏆 Reyting Jadvali</h2>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-3xl overflow-hidden"
                style={{
                    background: 'rgba(10,14,30,0.75)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-white/30 font-bold">
                        Yuklanmoqda...
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <span className="text-4xl">🎮</span>
                        <p className="text-white/30 font-bold text-sm">Hali hech kim ro'yxatda emas</p>
                        <p className="text-white/20 text-xs">Birinchi bo'ling!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {data.map((user, i) => {
                            const level = getLevelFromXP(user.xp);
                            const medal = MEDALS[i] ?? `#${i + 1}`;
                            return (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors"
                                >
                                    {/* Rank */}
                                    <span className="w-8 text-center text-lg font-black shrink-0">
                                        {typeof medal === 'string' && medal.startsWith('#')
                                            ? <span className="text-white/30 text-sm">{medal}</span>
                                            : medal}
                                    </span>

                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                                        {user.image ? (
                                            <Image src={user.image} alt={user.name ?? ''} width={36} height={36} className="object-cover" />
                                        ) : (
                                            <span className="text-lg">{user.name?.[0]?.toUpperCase() ?? '?'}</span>
                                        )}
                                    </div>

                                    {/* Name + level */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">
                                            {user.name ?? "Anonim"}
                                        </p>
                                        <p className="text-xs font-semibold" style={{ color: level.color }}>
                                            {level.icon} {level.name}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 shrink-0 text-right">
                                        {user.streak > 0 && (
                                            <div className="hidden sm:flex items-center gap-1 text-xs font-bold" style={{ color: '#f97316' }}>
                                                🔥 {user.streak}
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-white font-black text-sm">{user.xp.toLocaleString()}</p>
                                            <p className="text-white/30 text-xs font-semibold">XP</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </section>
    );
}
