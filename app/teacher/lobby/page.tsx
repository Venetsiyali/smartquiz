'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getPusherClient } from '@/lib/pusherClient';

interface Player { id: string; nickname: string; }

export default function TeacherLobbyPage() {
    const router = useRouter();
    const [pin, setPin] = useState<string | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(true);
    const channelRef = useRef<any>(null);

    const joinUrl = typeof window !== 'undefined' && pin ? `${window.location.origin}/play?pin=${pin}` : '';

    useEffect(() => {
        const rawQuiz = sessionStorage.getItem('quiz');
        if (!rawQuiz) { router.push('/teacher/create'); return; }
        const quiz = JSON.parse(rawQuiz);

        fetch('/api/game/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizTitle: quiz.title, questions: quiz.questions }),
        })
            .then(r => r.json())
            .then(({ pin: newPin }) => {
                setPin(newPin);
                setIsCreating(false);
                sessionStorage.setItem('gamePin', newPin);
                const pusher = getPusherClient();
                channelRef.current = pusher.subscribe(`game-${newPin}`);
                channelRef.current.bind('player-joined', ({ players: updated }: { players: Player[] }) => {
                    setPlayers(updated);
                });
            })
            .catch(() => setError("O'yin yaratishda xatolik"));
    }, [router]);

    useEffect(() => {
        return () => { if (pin) getPusherClient().unsubscribe(`game-${pin}`); };
    }, [pin]);

    const handleStart = () => {
        if (!pin) return;
        if (players.length === 0) { setError("Kamida 1 ta o'yinchi kerak!"); setTimeout(() => setError(''), 3000); return; }
        setLoading(true);
        router.push('/teacher/game');
    };

    return (
        <div className="bg-host min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/teacher/create')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
                    <span className="text-xl font-black text-white">Zukk<span className="logo-z">oo</span></span>
                    <span className="text-white/30">·</span>
                    <span className="text-white/50 font-bold text-sm">Lobby</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-bold ${!isCreating ? 'text-green-400' : 'text-yellow-400'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${!isCreating ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    {isCreating ? 'Yaratilmoqda...' : 'Tayyor · Talabalar kutilmoqda'}
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row gap-6 p-5 md:p-8">
                {/* Left panel */}
                <div className="md:w-80 flex flex-col gap-5">
                    {/* QR */}
                    <div className="glass p-6 flex flex-col items-center gap-4">
                        <p className="text-white/50 font-bold text-xs tracking-widest">QR KOD ORQALI KIRING</p>
                        {pin && joinUrl ? (
                            <div className="bg-white p-4 rounded-2xl shadow-2xl">
                                <QRCodeSVG value={joinUrl} size={176} bgColor="#ffffff" fgColor="#0a0f1e" level="H" />
                            </div>
                        ) : (
                            <div className="w-48 h-48 rounded-2xl animate-pulse flex items-center justify-center" style={{ background: 'rgba(0,86,179,0.1)' }}>
                                <span className="text-4xl opacity-30">⚡</span>
                            </div>
                        )}
                        <p className="text-white/30 text-xs font-semibold text-center">
                            {typeof window !== 'undefined' ? window.location.host : ''}/play
                        </p>
                    </div>

                    {/* PIN */}
                    <div className="glass-blue p-6 flex flex-col items-center gap-1">
                        <p className="text-white/50 font-bold text-xs tracking-widest mb-2">O&apos;YIN PIN KODI</p>
                        <div className="text-6xl font-black tracking-widest" style={{ color: '#FFD600', textShadow: '0 0 40px rgba(255,214,0,0.5)' }}>
                            {pin ? pin : <span className="text-white/15">——————</span>}
                        </div>
                    </div>

                    {/* Start */}
                    <button onClick={handleStart} disabled={!pin || players.length === 0 || loading}
                        className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none text-center">
                        {loading ? '⚡ Boshlanmoqda...' : `🚀 O'yinni Boshlash (${players.length})`}
                    </button>
                    {error && <p className="text-red-400 font-bold text-sm text-center">⚠️ {error}</p>}
                </div>

                {/* Players */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-extrabold text-lg">
                            Qo&apos;shilganlar <span className="text-white/40 font-semibold ml-1 text-base">({players.length})</span>
                        </h2>
                        <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                        </div>
                    </div>

                    {players.length === 0 ? (
                        <div className="glass p-16 rounded-3xl text-center">
                            <div className="text-6xl mb-4 animate-pulse-slow">🕐</div>
                            <p className="text-white/40 font-bold text-xl">O&apos;yinchilar kutilmoqda...</p>
                            <p className="text-white/25 text-sm mt-1">Talabalar PIN yoki QR orqali kirishsin</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {players.map((p, i) => (
                                <div key={p.id} className="glass p-4 rounded-2xl text-center animate-bounce-in"
                                    style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl mx-auto mb-2 font-black"
                                        style={{ background: `hsl(${(i * 47) % 360},65%,45%)`, boxShadow: `0 4px 16px hsla(${(i * 47) % 360},65%,45%,0.4)` }}>
                                        {p.nickname[0].toUpperCase()}
                                    </div>
                                    <p className="text-white font-bold text-sm truncate">{p.nickname}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
