'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getPusherClient } from '@/lib/pusherClient';

interface Player {
    id: string;
    nickname: string;
}

export default function TeacherLobbyPage() {
    const router = useRouter();
    const [pin, setPin] = useState<string | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(true);
    const channelRef = useRef<any>(null);

    const joinUrl = typeof window !== 'undefined' && pin
        ? `${window.location.origin}/play?pin=${pin}`
        : '';

    useEffect(() => {
        const rawQuiz = sessionStorage.getItem('quiz');
        if (!rawQuiz) { router.push('/teacher/create'); return; }

        const quiz = JSON.parse(rawQuiz);

        // Create game via API
        fetch('/api/game/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizTitle: quiz.title, questions: quiz.questions }),
        })
            .then((r) => r.json())
            .then(({ pin: newPin }) => {
                setPin(newPin);
                setIsCreating(false);
                sessionStorage.setItem('gamePin', newPin);

                // Subscribe to Pusher channel
                const pusher = getPusherClient();
                channelRef.current = pusher.subscribe(`game-${newPin}`);
                channelRef.current.bind('player-joined', ({ players: updated }: { players: Player[] }) => {
                    setPlayers(updated);
                });
            })
            .catch(() => setError("O'yin yaratishda xatolik"));
    }, [router]);

    useEffect(() => {
        return () => {
            if (channelRef.current && pin) {
                getPusherClient().unsubscribe(`game-${pin}`);
            }
        };
    }, [pin]);

    const handleStart = async () => {
        if (!pin) return;
        if (players.length === 0) {
            setError("Kamida bitta o'yinchi kerak!");
            setTimeout(() => setError(''), 3000);
            return;
        }
        setLoading(true);
        const res = await fetch('/api/game/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
        });
        if (res.ok) {
            router.push('/teacher/game');
        } else {
            setError("O'yinni boshlashda xatolik");
            setLoading(false);
        }
    };

    return (
        <div className="bg-teacher min-h-screen flex flex-col">
            <header className="p-4 md:p-8 flex items-center justify-between border-b border-white/10">
                <button onClick={() => router.push('/teacher/create')} className="text-white/60 hover:text-white transition-colors text-2xl">←</button>
                <h1 className="text-2xl font-extrabold text-white">O&apos;yin Lobby</h1>
                <div className={`flex items-center gap-2 text-sm font-bold ${!isCreating ? 'text-green-400' : 'text-yellow-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${!isCreating ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
                    {isCreating ? 'Yaratilmoqda...' : 'Tayyor'}
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row gap-8 p-4 md:p-8">
                {/* Left: QR + PIN */}
                <div className="md:w-80 flex flex-col items-center gap-6">
                    <div className="glass p-6 flex flex-col items-center gap-4 w-full">
                        <p className="text-white/60 font-bold text-sm">QR KOD ORQALI KIRING</p>
                        {pin && joinUrl ? (
                            <div className="bg-white p-4 rounded-2xl shadow-2xl">
                                <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#1a1a2e" level="H" />
                            </div>
                        ) : (
                            <div className="w-48 h-48 bg-white/10 rounded-2xl animate-pulse flex items-center justify-center">
                                <span className="text-white/30 text-4xl">⚡</span>
                            </div>
                        )}
                        <p className="text-white/40 text-xs font-semibold text-center">
                            Kamera bilan skaner qiling yoki PIN kiriting
                        </p>
                    </div>

                    <div className="glass p-6 flex flex-col items-center gap-2 w-full">
                        <p className="text-white/60 font-bold text-sm">O&apos;YIN PIN</p>
                        <div className="text-6xl md:text-7xl font-black tracking-widest"
                            style={{ color: '#6C63FF', textShadow: '0 0 40px rgba(108,99,255,0.5)' }}>
                            {pin ? (
                                pin.split('').map((d, i) => (
                                    <span key={i} className="inline-block animate-bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>{d}</span>
                                ))
                            ) : <span className="text-white/20">------</span>}
                        </div>
                        <p className="text-white/40 text-sm font-semibold">
                            {typeof window !== 'undefined' ? `${window.location.host}/play` : '/play'}
                        </p>
                    </div>

                    <button onClick={handleStart} disabled={!pin || players.length === 0 || loading}
                        className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none text-center">
                        {loading ? '⚡ Boshlanmoqda...' : `🚀 O'yinni Boshlash (${players.length} o'yinchi)`}
                    </button>

                    {error && <p className="text-red-400 font-bold text-sm text-center">{error}</p>}
                </div>

                {/* Right: Player list */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-extrabold text-xl">
                            Qo&apos;shilganlar <span className="ml-2 text-white/40 text-base font-semibold">({players.length})</span>
                        </h2>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    </div>

                    {players.length === 0 ? (
                        <div className="glass p-12 rounded-2xl text-center">
                            <div className="text-5xl mb-4 animate-pulse-slow">🕐</div>
                            <p className="text-white/40 font-bold text-lg">O&apos;yinchilar kutilmoqda...</p>
                            <p className="text-white/30 text-sm mt-2">Talabalar PIN yoki QR kod orqali kirsinlar</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {players.map((p, i) => (
                                <div key={p.id} className="glass p-4 rounded-2xl text-center animate-bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-2"
                                        style={{ background: `hsl(${(i * 60) % 360}, 70%, 50%)`, boxShadow: `0 4px 16px hsla(${(i * 60) % 360}, 70%, 50%, 0.4)` }}>
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
