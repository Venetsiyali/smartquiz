'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/subscriptionContext';
import PaymentModal from '@/components/PaymentModal';
import { motion } from 'framer-motion';

type PlanModal = 'pro_monthly' | 'pro_yearly' | 'edu' | null;

const PLANS = [
    {
        key: null as null,
        badge: null, badgeLabel: null,
        name: 'Zukkoo Bepul',
        price: '0',
        unit: "so'm",
        highlight: false,
        cta: 'Hozir boshlash',
        ctaFree: true,
        color: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.12)',
        features: [
            '✅ 10 ta savolga qadar',
            '✅ 20 ta o\'yinchiga qadar',
            '✅ 16 ta standart avatar',
            '✅ Streak tizimi 🔥',
            '❌ Fayl yuklash (PDF/DOCX)',
            '❌ AI ovoz o\'qishи',
            '❌ Maxsus mavzular',
            '❌ PDF Sertifikat',
        ],
    },
    {
        key: 'pro_monthly' as PlanModal,
        badge: null, badgeLabel: null,
        name: 'Zukkoo Pro',
        price: '10 000',
        unit: "so'm/oy",
        highlight: false,
        cta: 'Sotib olish',
        ctaFree: false,
        color: 'rgba(0,86,179,0.12)',
        borderColor: 'rgba(0,86,179,0.4)',
        features: [
            '✅ 50 ta savolga qadar',
            '✅ 100+ o\'yinchi',
            '✅ Barcha avatarlar 👑',
            '✅ Streak 🔥 + 1.2× multiplier',
            '✅ PDF/DOCX fayl yuklash',
            '✅ AI ovoz o\'qishi 🎙️',
            '✅ Badges & Sertifikat',
            '✅ Maxsus mavzular',
        ],
    },
    {
        key: 'pro_yearly' as PlanModal,
        badge: '🔥 ENG OMMA-BOP',
        badgeLabel: '17% tejang',
        name: 'Zukkoo Pro Yillik',
        price: '8 333',
        unit: "so'm/oy",
        highlight: true,
        cta: 'Sotib olish',
        ctaFree: false,
        color: 'rgba(184,134,11,0.08)',
        borderColor: '#FFD700',
        features: [
            '✅ Pro barcha xususiyatlari',
            '✅ 2 oy BEPUL (tejamkorlik)',
            '✅ Ustuvor qo\'llab-quvvatlash',
            '✅ Beta xususiyatlarga kirish',
            '✅ Brending (maktab logotipi)',
            '✅ Yillik hisobot',
            '✅ Offline rejim (soon)',
            '✅ API kirish (soon)',
        ],
    },
    {
        key: 'edu' as PlanModal,
        badge: '🏫 MUASSASA',
        badgeLabel: null,
        name: 'Zukkoo EDU',
        price: 'Maxsus',
        unit: '',
        highlight: false,
        cta: 'Bog\'lanish',
        ctaFree: false,
        color: 'rgba(0,230,118,0.06)',
        borderColor: 'rgba(0,230,118,0.3)',
        features: [
            '✅ Cheksiz o\'yinchi',
            '✅ Ko\'p o\'qituvchi hisob',
            '✅ Admin panel',
            '✅ TATU / Maktab integratsiyasi',
            '✅ LMS eksport (Moodle)',
            '✅ Korporativ brending',
            '✅ SLA qo\'llab-quvvatlash',
            '✅ Maxsus shartlar',
        ],
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { plan: currentPlan, isFree } = useSubscription();
    const [modal, setModal] = useState<PlanModal>(null);

    return (
        <div className="bg-host min-h-screen">
            {/* BG glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FFD700, transparent)', top: '-10%', right: '-5%' }} />
                <div className="absolute w-[500px] h-[500px] rounded-full opacity-8 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', bottom: '5%', left: '-5%', animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <button onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors">
                    ← <span className="text-xl font-black text-white">Zukk<span className="logo-z">oo</span></span>
                </button>
                <p className="text-white/40 font-bold text-sm">Narxlar</p>
            </header>

            <div className="relative z-10 px-5 py-14 max-w-7xl mx-auto">
                {/* Hero */}
                <div className="text-center mb-14">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-xs font-black uppercase tracking-widest"
                        style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>
                        👑 Zukkoo Tanlang
                    </motion.div>
                    <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black text-white mb-3">
                        O'qitishni <span className="logo-z">yangilang</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-white/40 font-bold text-lg max-w-xl mx-auto">
                        Har bir o'qituvchi uchun to'g'ri tarif toping. Hozir bepul boshlang.
                    </motion.p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {PLANS.map((p, i) => {
                        const isActive = (p.key === null && currentPlan === 'free') ||
                            (p.key === 'pro_monthly' && currentPlan === 'pro') ||
                            (p.key === 'pro_yearly' && currentPlan === 'pro') ||
                            (p.key === 'edu' && currentPlan === 'edu');

                        return (
                            <motion.div key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: i * 0.08 }}
                                className="relative flex flex-col rounded-3xl p-6"
                                style={{
                                    background: p.color,
                                    border: `2px solid ${p.highlight ? p.borderColor : p.borderColor}`,
                                    boxShadow: p.highlight ? `0 0 40px rgba(255,215,0,0.2)` : 'none',
                                }}>
                                {/* Yearly gradient top */}
                                {p.highlight && (
                                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                                        style={{ background: 'linear-gradient(90deg, #B8860B, #FFD700, #B8860B)' }} />
                                )}

                                {/* Badge */}
                                {p.badge && (
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black"
                                            style={p.highlight
                                                ? { background: 'linear-gradient(135deg, #B8860B, #FFD700)', color: '#0a0a0a' }
                                                : { background: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' }}>
                                            {p.badge}
                                        </span>
                                        {p.badgeLabel && <span className="text-white/40 text-xs ml-2 font-bold">{p.badgeLabel}</span>}
                                    </div>
                                )}

                                <h3 className="text-white font-extrabold text-lg mb-1">{p.name}</h3>
                                <div className="mb-5">
                                    <span className="text-white font-black text-4xl">{p.price}</span>
                                    {p.unit && <span className="text-white/40 font-bold ml-1.5 text-sm">{p.unit}</span>}
                                </div>

                                {/* Feature list */}
                                <ul className="space-y-2.5 mb-6 flex-1">
                                    {p.features.map((f, fi) => (
                                        <li key={fi} className="text-sm font-semibold"
                                            style={{ color: f.startsWith('❌') ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)' }}>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isActive ? (
                                    <div className="w-full py-3.5 rounded-2xl text-center font-extrabold text-sm"
                                        style={{ background: 'rgba(0,230,118,0.12)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' }}>
                                        ✓ Faol tarif
                                    </div>
                                ) : p.key === 'edu' ? (
                                    <a href="mailto:info@zukkoo.uz"
                                        className="w-full py-3.5 rounded-2xl text-center font-extrabold text-sm block transition-all hover:scale-105"
                                        style={{ background: 'rgba(0,230,118,0.12)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' }}>
                                        📧 info@zukkoo.uz
                                    </a>
                                ) : p.ctaFree ? (
                                    <button onClick={() => router.push('/teacher/create')}
                                        className="w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all hover:scale-105"
                                        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                        {p.cta}
                                    </button>
                                ) : (
                                    <button onClick={() => setModal(p.key!)}
                                        className="w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all hover:scale-105 hover:shadow-xl"
                                        style={p.highlight ? {
                                            background: 'linear-gradient(135deg, #B8860B, #FFD700)',
                                            color: '#0a0a0a',
                                            boxShadow: '0 8px 28px rgba(255,215,0,0.35)',
                                        } : {
                                            background: 'linear-gradient(135deg, #0056b3, #003d82)',
                                            color: 'white',
                                            boxShadow: '0 8px 24px rgba(0,86,179,0.4)',
                                        }}>
                                        👑 {p.cta}
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* FAQ / Trust */}
                <div className="mt-16 text-center space-y-4">
                    <p className="text-white/30 font-bold text-sm">🔒 256-bit SSL · Har oy bekor qilish · 7 kunlik qaytarish kafolati</p>
                    <div className="flex justify-center gap-8 flex-wrap">
                        {['TATU Biznes Maktabi', 'Maktab №47 Toshkent', '300+ O\'qituvchi', 'Namangan DTI'].map((t, i) => (
                            <span key={i} className="text-white/20 font-bold text-sm">{t}</span>
                        ))}
                    </div>
                </div>
            </div>

            {modal && <PaymentModal plan={modal} onClose={() => setModal(null)} />}
        </div>
    );
}
