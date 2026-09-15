'use client';

import { useState } from 'react';
import type { WheelPlayerData } from './types';
import { pickWinnerIndex, computeSpinRotation } from '@/lib/wheel/spin';

const PALETTE = ['#0056b3', '#FFD600', '#00E676', '#FF1744', '#1a7de8', '#9c27b0', '#ff9800', '#00bcd4', '#e91e63', '#8bc34a'];
const SPIN_DURATION_MS = 3600;
const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 4;

function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function sectorPath(startAngle: number, endAngle: number): string {
    const start = polarToXY(startAngle, RADIUS);
    const end = polarToXY(endAngle, RADIUS);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function Wheel({
    players,
    onWinner,
    disabled,
}: {
    players: WheelPlayerData[];
    onWinner: (player: WheelPlayerData) => void;
    disabled: boolean;
}) {
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);

    const sectorAngle = players.length > 0 ? 360 / players.length : 0;

    const spin = () => {
        if (spinning || disabled || players.length === 0) return;
        setSpinning(true);
        const winnerIndex = pickWinnerIndex(players.length);
        const nextRotation = computeSpinRotation(winnerIndex, players.length, rotation);
        setRotation(nextRotation);

        setTimeout(() => {
            setSpinning(false);
            onWinner(players[winnerIndex]);
        }, SPIN_DURATION_MS);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative" style={{ width: SIZE, height: SIZE }}>
                {/* Pointer */}
                <div
                    className="absolute z-20 left-1/2 -translate-x-1/2 -top-2"
                    style={{ width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '24px solid #FFD600' }}
                />
                <svg
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
                        transformOrigin: `${CENTER}px ${CENTER}px`,
                    }}
                >
                    <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#0a0f1e" stroke="#fff" strokeOpacity={0.15} strokeWidth={3} />
                    {players.map((p, i) => {
                        const startAngle = i * sectorAngle;
                        const endAngle = startAngle + sectorAngle;
                        const midAngle = startAngle + sectorAngle / 2;
                        const labelPos = polarToXY(midAngle, RADIUS * 0.62);
                        return (
                            <g key={p.id}>
                                <path d={sectorPath(startAngle, endAngle)} fill={PALETTE[i % PALETTE.length]} stroke="#0a0f1e" strokeWidth={2} />
                                <text
                                    x={labelPos.x}
                                    y={labelPos.y}
                                    fill="#fff"
                                    fontSize={players.length > 12 ? 9 : 13}
                                    fontWeight={800}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    transform={`rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`}
                                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                                >
                                    {p.name.length > 12 ? `${p.name.slice(0, 11)}…` : p.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <button
                onClick={spin}
                disabled={spinning || disabled || players.length === 0}
                className="btn-primary px-10 py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {spinning ? '🎡 Aylanmoqda...' : '🎡 Aylantirish'}
            </button>
        </div>
    );
}
