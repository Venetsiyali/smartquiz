'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const AVATARS = [
    '🤖', '👾', '🦾', '🎮', '🚀', '⚡', '🌟', '💥',
    '🦊', '🐼', '🐸', '🦁', '🐯', '🦋', '🦄', '🔥',
];

function AvatarGrid({ selected, onSelect }: { selected: string; onSelect: (a: string) => void }) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {AVATARS.map(a => (
                <button key={a} onClick={() => onSelect(a)}
                    className="w-full aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all hover:scale-110"
                    style={{
                        background: selected === a ? 'linear-gradient(135deg, #0056b3, #003d82)' : 'rgba(255,255,255,0.07)',
                        border: selected === a ? '2px solid #0056b3' : '2px solid transparent',
                        boxShadow: selected === a ? '0 0 20px rgba(0,86,179,0.5)' : 'none',
                        transform: selected === a ? 'scale(1.1)' : 'scale(1)',
                    }}>
                    {a}
                </button>
            ))}
        </div>
    );
}

function PlayEntry() {
    const router = useRouter();
    const params = useSearchParams();
    const [step, setStep] = useState<'avatar' | 'details'>('avatar');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [pin, setPin] = useState(params.get('pin') || '');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const join = async () => {
        if (pin.length !== 6) { setError('6 raqamli PIN kiriting'); return; }
        if (nickname.trim().length < 2) { setError('Nikneym kamida 2 ta harf'); return; }
        setError(''); setLoading(true);

        let pid = sessionStorage.getItem('playerId');
        if (!pid) { pid = uuidv4(); sessionStorage.setItem('playerId', pid); }

        const res = await fetch('/api/game/join', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, playerId: pid, nickname: nickname.trim(), avatar }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Ulanishda xatolik'); setLoading(false); return; }

        sessionStorage.setItem('playerPin', pin);
        sessionStorage.setItem('playerNickname', nickname.trim());
        sessionStorage.setItem('playerAvatar', avatar);
        router.push('/play/waiting');
    };

    return (
        <div className="bg-player min-h-screen flex flex-col items-center justify-center p-6">
            {/* BG glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-80 h-80 rounded-full opacity-15 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', top: '-10%', right: '-5%' }} />
                <div className="absolute w-72 h-72 rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FFD600, transparent)', bottom: '5%', left: '-5%', animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-sm space-y-5 relative z-10">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-6xl mx-auto mb-3">
                        {avatar}
                    </div>
                    <h1 className="text-3xl font-black text-white">Zukk<span className="logo-z">oo</span></h1>
                    <p className="text-white/40 font-semibold mt-0.5 text-sm">TUIT · Real-vaqt Viktorina</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-3 justify-center mb-2">
                    {['avatar', 'details'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                                style={{
                                    background: step === s || (i === 0 && step === 'details') ? '#0056b3' : 'rgba(255,255,255,0.1)',
                                    color: step === s || (i === 0 && step === 'details') ? 'white' : 'rgba(255,255,255,0.3)',
                                }}>{i + 1}</div>
                            {i === 0 && <div className="w-8 h-0.5 rounded" style={{ background: step === 'details' ? '#0056b3' : 'rgba(255,255,255,0.2)' }} />}
                        </div>
                    ))}
                </div>

                {step === 'avatar' ? (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-white font-extrabold text-lg">Avatarni tanlang</h2>
                            <p className="text-white/40 text-sm">O&apos;yin davomida shu belgi ko&apos;rinadi</p>
                        </div>
                        <AvatarGrid selected={avatar} onSelect={setAvatar} />
                        <button onClick={() => setStep('details')}
                            className="w-full btn-primary justify-center">
                            Davom {avatar}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-white font-extrabold text-lg">Kirish ma&apos;lumotlari</h2>
                        </div>
                        <div>
                            <label className="text-white/50 font-bold text-xs tracking-widest block mb-2 text-center">PIN KOD</label>
                            <input type="text" inputMode="numeric" value={pin}
                                onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                placeholder="• • • • • •" maxLength={6}
                                className="input-game text-5xl tracking-[0.35em]" style={{ fontFamily: 'monospace' }} />
                        </div>
                        <div>
                            <label className="text-white/50 font-bold text-xs tracking-widest block mb-2 text-center">NIKNEYM</label>
                            <input type="text" value={nickname}
                                onChange={e => { setNickname(e.target.value.slice(0, 20)); setError(''); }}
                                placeholder="Ismingiz yoki laqabingiz"
                                className="input-game" maxLength={20}
                                onKeyDown={e => e.key === 'Enter' && join()} />
                        </div>
                        {error && <p className="text-red-400 font-bold text-sm text-center bg-red-500/10 rounded-xl py-2">⚠️ {error}</p>}
                        <button onClick={join} disabled={loading}
                            className="w-full btn-primary justify-center disabled:opacity-50 disabled:transform-none">
                            {loading ? <><span className="animate-spin">⚡</span> Ulanmoqda...</> : `${avatar} O'yinga Kirish`}
                        </button>
                        <button onClick={() => setStep('avatar')} className="w-full text-white/30 hover:text-white/60 font-bold text-sm text-center transition-colors">
                            ← Avatarni o&apos;zgartirish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="bg-player min-h-screen flex items-center justify-center"><p className="text-white/50 font-bold text-xl animate-pulse">Yuklanmoqda...</p></div>}>
            <PlayEntry />
        </Suspense>
    );
}
