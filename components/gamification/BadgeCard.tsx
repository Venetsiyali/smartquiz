'use client';

import { BadgeDef } from '@/lib/gamification/badges';

interface Props {
    badge: BadgeDef & { earnedAt?: Date };
    size?: 'sm' | 'md';
    locked?: boolean;
}

export default function BadgeCard({ badge, size = 'md', locked = false }: Props) {
    const isSm = size === 'sm';

    return (
        <div
            className={`flex flex-col items-center text-center rounded-2xl transition-all ${isSm ? 'p-3 gap-1.5' : 'p-4 gap-2'}`}
            style={{
                background: locked ? 'rgba(255,255,255,0.03)' : badge.bg,
                border: `1px solid ${locked ? 'rgba(255,255,255,0.07)' : badge.color + '40'}`,
                opacity: locked ? 0.45 : 1,
                filter: locked ? 'grayscale(0.7)' : 'none',
            }}
            title={badge.description}
        >
            <span className={locked ? 'grayscale' : ''} style={{ fontSize: isSm ? '1.5rem' : '2rem' }}>
                {locked ? '🔒' : badge.icon}
            </span>
            <div>
                <p className={`font-black leading-tight ${isSm ? 'text-xs' : 'text-sm'}`}
                    style={{ color: locked ? 'rgba(255,255,255,0.3)' : badge.color }}>
                    {badge.name}
                </p>
                {!isSm && (
                    <p className="text-white/30 text-xs font-medium mt-0.5">{badge.description}</p>
                )}
            </div>
        </div>
    );
}
