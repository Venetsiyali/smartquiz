'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';import { useTranslations } from 'next-intl';

interface StatItem {
    value: number;
    suffix: string;
    labelKey: string;
    icon: string;
    color: string;
}

const STATS: StatItem[] = [
    { value: 500,    suffix: '+', labelKey: 'teachers',    icon: '👩‍🏫', color: '#00E676' },
    { value: 50000,  suffix: '+', labelKey: 'quizzes',     icon: '🎮', color: '#3b82f6' },
    { value: 6,      suffix: '',  labelKey: 'games',       icon: '🏆', color: '#FFD700' },
];

function AnimatedCounter({ target, suffix, color }: { target: number; suffix: string; color: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    useEffect(() => {
        if (!inView) return;
        const duration = 1800;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [inView, target]);

    return (
        <span ref={ref} className="text-4xl md:text-5xl font-black tabular-nums" style={{ color }}>
            {count.toLocaleString()}{suffix}
        </span>
    );
}

export default function SocialProof() {
    const t = useTranslations('SocialProof');

    return (
        <section className="w-full max-w-6xl mt-12 mb-4 relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
                style={{
                    background: 'rgba(10,14,30,0.75)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                {/* Subtle background glow */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 120%, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

                <p className="text-white/30 font-bold text-xs tracking-widest mb-8 uppercase text-center relative z-10">
                    {t('subtitle')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                    {STATS.map((stat, i) => (
                        <motion.div
                            key={stat.labelKey}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.12 }}
                            className="flex flex-col items-center gap-3 text-center"
                        >
                            <span className="text-4xl">{stat.icon}</span>
                            <div className="flex items-baseline gap-1">
                                <AnimatedCounter target={stat.value} suffix={stat.suffix} color={stat.color} />
                            </div>
                            <p className="text-white/50 font-semibold text-sm">{t(stat.labelKey)}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
