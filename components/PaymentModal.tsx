'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '@/lib/subscriptionContext';

type Provider = 'click' | 'payme' | 'uzum';
type BillingCycle = 'monthly' | 'yearly';

const PROVIDERS: { id: Provider; name: string; color: string; logo: string; desc: string }[] = [
    { id: 'click', name: 'Click', color: '#0080ff', logo: '🔵', desc: 'Click ilovasi orqali' },
    { id: 'payme', name: 'Payme', color: '#00B2FF', logo: '💳', desc: 'Payme ilovasi orqali' },
    { id: 'uzum', name: 'Uzum Pay', color: '#7B2FFF', logo: '💜', desc: 'Uzum Bank orqali' },
];

interface PaymentModalProps {
    plan: 'pro_monthly' | 'pro_yearly' | 'edu';
    onClose: () => void;
}

const PLAN_INFO = {
    pro_monthly: { label: 'Zukkoo Pro (Oylik)', price: '10 000 so\'m/oy', cycle: 'monthly' as BillingCycle },
    pro_yearly: { label: 'Zukkoo Pro (Yillik)', price: '100 000 so\'m/yil', cycle: 'yearly' as BillingCycle },
    edu: { label: 'Zukkoo EDU', price: 'Maxsus narx', cycle: 'yearly' as BillingCycle },
};

export default function PaymentModal({ plan, onClose }: PaymentModalProps) {
    const { setPlan } = useSubscription();
    const [selected, setSelected] = useState<Provider | null>(null);
    const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
    const info = PLAN_INFO[plan];

    const handleConfirm = () => {
        if (!selected) return;
        setStep('confirm');
        // Simulate payment processing (demo mode)
        setTimeout(() => {
            setPlan(plan === 'edu' ? 'edu' : 'pro');
            setStep('success');
        }, 1800);
    };

    return (
        <AnimatePresence>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)' }}
                onClick={e => e.target === e.currentTarget && onClose()}>

                <motion.div key="modal" initial={{ scale: 0.85, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="w-full max-w-md rounded-3xl p-7 relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #0d1a2e, #111827)', border: '1px solid rgba(255,215,0,0.25)' }}>

                    {/* Gold top accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                        style={{ background: 'linear-gradient(90deg, #B8860B, #FFD700, #B8860B)' }} />

                    {step === 'success' ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-6 space-y-4">
                            <div className="text-8xl">🎉</div>
                            <h2 className="text-3xl font-black text-white">Tabriklaymiz!</h2>
                            <p className="text-white/60 font-bold">Siz endi Zukkoo Pro foydalanuvchisisiz</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm"
                                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)', color: '#0a0a0a' }}>
                                👑 Pro faollashtirildi!
                            </div>
                            <button onClick={onClose} className="block w-full mt-4 py-4 rounded-2xl font-black text-white"
                                style={{ background: 'linear-gradient(135deg, #0056b3, #003d82)' }}>
                                Davom etish →
                            </button>
                        </motion.div>
                    ) : step === 'confirm' ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="text-5xl animate-spin-slow">⚙️</div>
                            <p className="text-white/70 font-bold animate-pulse">To'lov qayta ishlanmoqda...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-white">{info.label}</h2>
                                    <p className="text-yellow-400 font-extrabold text-2xl mt-0.5">{info.price}</p>
                                </div>
                                <button onClick={onClose} className="text-white/30 hover:text-white text-3xl leading-none">×</button>
                            </div>

                            <p className="text-white/50 font-bold text-xs tracking-widest mb-3">TO'LOV USULINI TANLANG</p>

                            <div className="space-y-3 mb-6">
                                {PROVIDERS.map(p => (
                                    <button key={p.id} onClick={() => setSelected(p.id)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                                        style={{
                                            background: selected === p.id ? `${p.color}20` : 'rgba(255,255,255,0.05)',
                                            border: `2px solid ${selected === p.id ? p.color : 'rgba(255,255,255,0.1)'}`,
                                            transform: selected === p.id ? 'scale(1.02)' : 'scale(1)',
                                        }}>
                                        <span className="text-3xl">{p.logo}</span>
                                        <div className="text-left">
                                            <p className="font-extrabold text-white">{p.name}</p>
                                            <p className="text-white/40 text-sm">{p.desc}</p>
                                        </div>
                                        <div className="ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                                            style={{ borderColor: selected === p.id ? p.color : 'rgba(255,255,255,0.3)', background: selected === p.id ? p.color : 'transparent' }}>
                                            {selected === p.id && <span className="text-white text-xs font-black">✓</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button onClick={handleConfirm} disabled={!selected}
                                className="w-full py-4 rounded-2xl font-extrabold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{
                                    background: selected ? 'linear-gradient(135deg, #B8860B, #FFD700)' : 'rgba(255,255,255,0.1)',
                                    color: selected ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                                    boxShadow: selected ? '0 8px 28px rgba(255,215,0,0.35)' : 'none',
                                    transform: selected ? 'scale(1.01)' : 'scale(1)',
                                }}>
                                {selected ? `${PROVIDERS.find(p => p.id === selected)?.name} orqali to'lash →` : "To'lov usulini tanlang"}
                            </button>

                            <p className="text-center text-white/25 text-xs mt-4 font-bold">
                                🔒 256-bit SSL orqali himoyalangan · Demo rejimi
                            </p>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
