'use client';

import { motion } from 'framer-motion';

const STEPS = [
    {
        number: '01',
        icon: '✨',
        title: 'Quiz yarating',
        desc: "Mavzu kiriting — AI avtomatik savollar tayyorlab beradi. Yoki o'zingiz qo'lda yozasiz. 2 daqiqa yetarli.",
        color: '#00E676',
        glow: 'rgba(0,230,118,0.15)',
        border: 'rgba(0,230,118,0.25)',
    },
    {
        number: '02',
        icon: '🔗',
        title: "O'quvchilarni ulang",
        desc: "Ekranda ko'rsatilgan PIN-kod yoki QR-kodni o'quvchilarga yuboring. Hech qanday ro'yxatdan o'tish shart emas.",
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.15)',
        border: 'rgba(59,130,246,0.25)',
    },
    {
        number: '03',
        icon: '🏆',
        title: "O'ynang va o'rganing",
        desc: "Real-vaqt rejimida reyting, animatsiyalar, va tezkor teskari aloqa. Dars qiziqarli — natija sezilarli.",
        color: '#FFD700',
        glow: 'rgba(255,215,0,0.15)',
        border: 'rgba(255,215,0,0.25)',
    },
];

export default function HowItWorks() {
    return (
        <section className="w-full max-w-6xl mt-8 mb-4 relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5 }}
                className="mb-8 text-center"
            >
                <p className="text-white/30 font-bold text-xs tracking-widest mb-2 uppercase">Bosqichlar</p>
                <h2 className="text-2xl md:text-3xl font-black text-white">Qanday ishlaydi?</h2>
                <p className="text-white/40 text-sm font-medium mt-2">3 qadamda interaktiv dars boshlang</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
                {/* Connector line (desktop only) */}
                <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px"
                    style={{ background: 'linear-gradient(to right, rgba(0,230,118,0.3), rgba(59,130,246,0.3), rgba(255,215,0,0.3))' }} />

                {STEPS.map((step, i) => (
                    <motion.div
                        key={step.number}
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.13 }}
                        className="relative flex flex-col items-center text-center rounded-3xl p-6"
                        style={{
                            background: 'rgba(10,14,30,0.75)',
                            border: `1px solid ${step.border}`,
                            backdropFilter: 'blur(12px)',
                            boxShadow: `0 0 40px ${step.glow}`,
                        }}
                    >
                        {/* Step number badge */}
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs mb-4 z-10"
                            style={{ background: step.glow, border: `1px solid ${step.border}`, color: step.color }}>
                            {step.number}
                        </div>

                        {/* Icon */}
                        <span className="text-4xl mb-4">{step.icon}</span>

                        {/* Content */}
                        <h3 className="text-white font-black text-lg mb-2">{step.title}</h3>
                        <p className="text-white/50 text-sm font-medium leading-relaxed">{step.desc}</p>

                        {/* Arrow (mobile only) */}
                        {i < STEPS.length - 1 && (
                            <div className="md:hidden mt-4 text-white/20 text-2xl">↓</div>
                        )}
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
