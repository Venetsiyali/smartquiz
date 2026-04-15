'use client';

import { getLevelFromXP } from '@/lib/gamification/xp';

interface Props {
    xp: number;
    size?: 'sm' | 'md' | 'lg';
}

export default function LevelBadge({ xp, size = 'md' }: Props) {
    const level = getLevelFromXP(xp);
    const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-xl font-black ${sizeClass}`}
            style={{
                background: `${level.color}18`,
                border: `1px solid ${level.color}40`,
                color: level.color,
            }}
            title={`${xp} XP`}
        >
            <span>{level.icon}</span>
            <span>{level.name}</span>
        </span>
    );
}
