'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { RacerView } from './utils';

const AVATAR = 34;

/**
 * Proyektor uchun tog' sahnasi: har bir yechilgan masala — bitta pog'ona. 0 — tog' etagi, N — cho'qqi.
 * Tog' yuqoriga qarab torayadi, shuning uchun har pog'onadagi o'yinchilar o'sha kenglikka joylashtiriladi.
 */
export default function Mountain({ racers, steps, leaders }: { racers: RacerView[]; steps: number; leaders: Set<string> }) {
    const levelY = (lvl: number) => 6 + (lvl / steps) * 80;               // pastdan % (6% … 86%)
    const levelHalfWidth = (lvl: number) => 44 - (lvl / steps) * 34;       // markazdan % (44% … 10%)

    // Har pog'onadagi o'yinchilar: chapdan o'ngga, ko'p bo'lsa — qatorlarga
    const byLevel = new Map<number, RacerView[]>();
    for (const r of racers) byLevel.set(r.solved, [...(byLevel.get(r.solved) ?? []), r]);

    const positions = new Map<string, { left: number; bottom: number; z: number }>();
    byLevel.forEach((list, lvl) => {
        const half = levelHalfWidth(lvl);
        const perRow = Math.max(1, Math.floor((half * 2) / 3.2));
        list.forEach((r, i) => {
            const row = Math.floor(i / perRow);
            const inRow = Math.min(perRow, list.length - row * perRow);
            const col = i % perRow;
            const span = Math.min(half * 2, inRow * 3.2);
            const left = 50 - span / 2 + (inRow === 1 ? span / 2 : (col / (inRow - 1)) * span);
            positions.set(r.id, { left, bottom: levelY(lvl) + row * 3.2, z: 100 - row });
        });
    });

    return (
        <div className="relative w-full h-full overflow-hidden rounded-3xl"
            style={{ background: 'linear-gradient(180deg, #0b1026 0%, #1b2a5a 55%, #3b2f6b 100%)' }}>
            {/* Yulduzlar */}
            {Array.from({ length: 40 }, (_, i) => (
                <div key={i} className="absolute rounded-full bg-white"
                    style={{ width: 2, height: 2, opacity: 0.25 + ((i * 37) % 60) / 100, left: `${(i * 53) % 100}%`, top: `${(i * 29) % 45}%` }} />
            ))}

            {/* Tog' */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <defs>
                    <linearGradient id="cr-rock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5b6b9a" />
                        <stop offset="100%" stopColor="#1e2747" />
                    </linearGradient>
                </defs>
                <polygon points="0,100 6,94 50,10 94,94 100,100" fill="url(#cr-rock)" />
                <polygon points="50,10 41,27 45,25 48,29 52,25 55,28 59,27" fill="#e8eefc" opacity="0.95" />
                {Array.from({ length: steps }, (_, i) => {
                    const lvl = i + 1;
                    const y = 100 - levelY(lvl);
                    const half = levelHalfWidth(lvl) + 2;
                    return <line key={lvl} x1={50 - half} x2={50 + half} y1={y} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="0.3" strokeDasharray="1 1" />;
                })}
            </svg>

            {/* Pog'ona raqamlari */}
            {Array.from({ length: steps }, (_, i) => (
                <div key={i} className="absolute text-[11px] font-black text-white/40"
                    style={{ left: `${50 + levelHalfWidth(i + 1) + 3}%`, bottom: `${levelY(i + 1) - 1}%` }}>
                    {i + 1 === steps ? '🏁' : i + 1}
                </div>
            ))}
            <div className="absolute text-4xl" style={{ left: '50%', top: '3%', transform: 'translateX(-20%)' }}>🚩</div>

            {/* O'yinchilar */}
            <AnimatePresence>
                {racers.map(r => {
                    const pos = positions.get(r.id)!;
                    const leader = leaders.has(r.id);
                    return (
                        <motion.div key={r.id}
                            className="absolute flex flex-col items-center"
                            style={{ zIndex: pos.z, marginLeft: -AVATAR / 2 }}
                            initial={{ opacity: 0, scale: 0.3, left: `${pos.left}%`, bottom: '0%' }}
                            animate={{ opacity: 1, scale: 1, left: `${pos.left}%`, bottom: `${pos.bottom}%` }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
                            <motion.div key={r.solved}
                                initial={{ y: -14 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                                className="flex items-center justify-center rounded-full"
                                style={{
                                    width: AVATAR, height: AVATAR, fontSize: 20,
                                    background: leader ? 'linear-gradient(135deg,#fde047,#f59e0b)' : 'rgba(255,255,255,0.12)',
                                    border: leader ? '2px solid #fff7c2' : '1px solid rgba(255,255,255,0.25)',
                                    boxShadow: leader ? '0 0 18px rgba(250,204,21,0.7)' : 'none',
                                }}>
                                {r.avatar}
                            </motion.div>
                            {leader && (
                                <span className="mt-0.5 px-1.5 rounded-md text-[10px] font-black text-white bg-black/50 whitespace-nowrap max-w-[90px] truncate">
                                    {r.nickname}
                                </span>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
