'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

function PlayEntryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pin, setPin] = useState(searchParams.get('pin') || '');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!pin.trim() || pin.length !== 6) { setError('6 raqamli PIN kiriting'); return; }
        if (!nickname.trim() || nickname.length < 2) { setError("Nikneym kamida 2 ta harf bo'lishi kerak"); return; }

        setError('');
        setLoading(true);

        // Generate a stable player ID
        let playerId = sessionStorage.getItem('playerId');
        if (!playerId) {
            playerId = uuidv4();
            sessionStorage.setItem('playerId', playerId);
        }

        const res = await fetch('/api/game/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin.trim(), playerId, nickname: nickname.trim() }),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Ulanishda xatolik");
            setLoading(false);
            return;
        }

        sessionStorage.setItem('playerPin', pin.trim());
        sessionStorage.setItem('playerNickname', nickname.trim());
        router.push('/play/waiting');
    };

    return (
        <div className="bg-game min-h-screen flex flex-col items-center justify-center p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-80 h-80 rounded-full opacity-20 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FF6B6B, transparent)', top: '-10%', right: '-5%' }} />
                <div className="absolute w-72 h-72 rounded-full opacity-15 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #6C63FF, transparent)', bottom: '-5%', left: '-5%', animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-sm space-y-6 relative z-10">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3 animate-bounce-in">⚡</div>
                    <h1 className="text-4xl font-black text-white">Smart<span style={{ color: '#6C63FF' }}>Quiz</span></h1>
                    <p className="text-white/50 font-semibold mt-1">O&apos;yinga qo&apos;shiling</p>
                </div>

                <div className="space-y-2">
                    <label className="text-white/60 font-bold text-sm block text-center">O&apos;YIN PIN-KODI</label>
                    <input
                        type="text" inputMode="numeric" pattern="[0-9]*"
                        value={pin}
                        onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                        placeholder="_ _ _ _ _ _"
                        className="input-game text-4xl tracking-widest"
                        style={{ letterSpacing: '0.3em' }}
                        maxLength={6}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-white/60 font-bold text-sm block text-center">NIKNEYM</label>
                    <input
                        type="text" value={nickname}
                        onChange={(e) => { setNickname(e.target.value.slice(0, 20)); setError(''); }}
                        placeholder="Ismingiz yoki laqabingiz"
                        className="input-game"
                        maxLength={20}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                </div>

                {error && (
                    <p className="text-red-400 font-bold text-sm text-center bg-red-500/10 rounded-xl py-2 px-4">⚠️ {error}</p>
                )}

                <button onClick={handleJoin} disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none">
                    {loading ? <><span className="animate-spin text-xl">⚡</span>Ulanmoqda...</> : '🎮 O\'yinga Kirish'}
                </button>

                <button onClick={() => router.push('/')} className="w-full text-white/40 hover:text-white/70 font-semibold text-sm transition-colors">
                    ← Bosh sahifaga qaytish
                </button>
            </div>
        </div>
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="bg-game min-h-screen flex items-center justify-center"><div className="text-white text-xl animate-pulse">Yuklanmoqda...</div></div>}>
            <PlayEntryContent />
        </Suspense>
    );
}
