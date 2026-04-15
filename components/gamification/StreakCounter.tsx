'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    userId?: string;
    initialStreak?: number;
}

export default function StreakCounter({ initialStreak = 0 }: Props) {
    const [streak, setStreak] = useState(initialStreak);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/gamification/streak')
            .then(r => r.json())
            .then(d => { if (typeof d.streak === 'number') setStreak(d.streak); })
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, []);

    if (!loaded && streak === 0) return null;

    const flames = streak >= 7 ? 3 : streak >= 3 ? 2 : 1;
    const color = streak >= 7 ? '#FFD700' : streak >= 3 ? '#f97316' : '#00E676';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm cursor-default select-none"
                style={{
                    background: `rgba(${color === '#FFD700' ? '255,215,0' : color === '#f97316' ? '249,115,22' : '0,230,118'},0.12)`,
                    border: `1px solid ${color}40`,
                    color,
                }}
                title={`${streak} kunlik streak!`}
            >
                <span className="text-base" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}>
                    {'🔥'.repeat(flames)}
                </span>
                <span>{streak}</span>
                <span className="font-semibold text-xs opacity-70">kun</span>
            </motion.div>
        </AnimatePresence>
    );
}
