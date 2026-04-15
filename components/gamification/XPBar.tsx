'use client';

import { motion } from 'framer-motion';
import { getLevelFromXP, getXPProgressPercent, LEVELS } from '@/lib/gamification/xp';

interface Props {
    xp: number;
    showLabel?: boolean;
}

export default function XPBar({ xp, showLabel = true }: Props) {
    const level = getLevelFromXP(xp);
    const progress = getXPProgressPercent(xp);
    const nextLevel = LEVELS.find(l => l.min === level.max);

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
                    <span style={{ color: level.color }}>{level.icon} {level.name}</span>
                    <span className="text-white/40">
                        {xp} XP
                        {nextLevel && <span className="text-white/25"> / {level.max}</span>}
                    </span>
                </div>
            )}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${level.color}aa, ${level.color})` }}
                />
            </div>
        </div>
    );
}
