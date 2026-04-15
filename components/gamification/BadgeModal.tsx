'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeDef } from '@/lib/gamification/badges';

interface Props {
    badge: BadgeDef | null;
    onClose: () => void;
}

// Minimal confetti: random floating particles
function Confetti() {
    const items = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ['#00E676', '#FFD700', '#3b82f6', '#f97316', '#8b5cf6'][i % 5],
        size: 6 + Math.random() * 6,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {items.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-sm"
                    style={{ width: p.size, height: p.size, background: p.color, left: `${p.x}%`, top: '-8px' }}
                    animate={{ y: ['0%', '110%'], rotate: [0, 360], opacity: [1, 0] }}
                    transition={{ duration: 1.4 + Math.random() * 0.6, delay: p.delay, ease: 'easeIn' }}
                />
            ))}
        </div>
    );
}

export default function BadgeModal({ badge, onClose }: Props) {
    useEffect(() => {
        if (!badge) return;
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [badge, onClose]);

    return (
        <AnimatePresence>
            {badge && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                        className="relative rounded-3xl p-8 flex flex-col items-center gap-4 max-w-xs w-full text-center"
                        style={{
                            background: 'rgba(10,14,30,0.97)',
                            border: `2px solid ${badge.color}60`,
                            boxShadow: `0 0 60px ${badge.color}30`,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <Confetti />

                        <p className="text-white/40 font-bold text-xs tracking-widest uppercase">Yangi badge!</p>
                        <span style={{ fontSize: '4rem', filter: `drop-shadow(0 0 16px ${badge.color})` }}>
                            {badge.icon}
                        </span>
                        <div>
                            <h3 className="text-2xl font-black" style={{ color: badge.color }}>{badge.name}</h3>
                            <p className="text-white/50 text-sm font-medium mt-1">{badge.description}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-2 px-6 py-2 rounded-xl font-black text-sm transition-all hover:scale-105"
                            style={{ background: badge.bg, border: `1px solid ${badge.color}50`, color: badge.color }}
                        >
                            Ajoyib! 🎉
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
