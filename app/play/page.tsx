'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

function PlayEntry() {
    const router = useRouter();
    const params = useSearchParams();
    const [pin, setPin] = useState(params.get('pin') || '');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const join = async () => {
        if (pin.length !== 6) { setError('6 raqamli PIN kiriting'); return; }
        if (nickname.trim().length < 2) { setError("Nikneym kamida 2 ta harf kerak"); return; }
        setError(''); setLoading(true);

        let pid = sessionStorage.getItem('playerId');
        if (!pid) { pid = uuidv4(); sessionStorage.setItem('playerId', pid); }

        const res = await fetch('/api/game/join', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, playerId: pid, nickname: nickname.trim() }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Ulanishda xatolik"); setLoading(false); return; }

        sessionStorage.setItem('playerPin', pin);
        sessionStorage.setItem('playerNickname', nickname.trim());
        router.push('/play/waiting');
    };

    return (
        <div className="bg-player min-h-screen flex flex-col items-center justify-center p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-80 h-80 rounded-full opacity-15 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', top: '-10%', right: '-5%' }} />
                <div className="absolute w-72 h-72 rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FFD600, transparent)', bottom: '5%', left: '-5%', animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-sm space-y-5 relative z-10">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl font-black mx-auto mb-4 animate-float"
                        style={{ background: 'linear-gradient(135deg, #0056b3, #FFD600)', boxShadow: '0 8px 32px rgba(0,86,179,0.5)' }}>Z</div>
                    <h1 className="text-4xl font-black text-white">Zukk<span className="logo-z">oo</span></h1>
                    <p className="text-white/40 font-semibold mt-1 text-sm">TUIT · Real-vaqt Viktorina</p>
                </div>

                <div>
                    <label className="text-white/50 font-bold text-xs tracking-widest block mb-2 text-center">O&apos;YIN PIN KODI</label>
                    <input type="text" inputMode="numeric" value={pin}
                        onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                        placeholder="• • • • • •" maxLength={6}
                        className="input-game text-5xl tracking-[0.35em]"
                        style={{ fontFamily: 'monospace' }} />
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
                    {loading ? <><span className="animate-spin">⚡</span> Ulanmoqda...</> : '🎮 O\'yinga Kirish'}
                </button>

                <button onClick={() => router.push('/')}
                    className="w-full text-center text-white/30 hover:text-white/60 font-bold text-sm transition-colors">
                    ← Bosh sahifaga qaytish
                </button>
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
