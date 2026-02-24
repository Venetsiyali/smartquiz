'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';

export default function WaitingPage() {
    const router = useRouter();
    const [nickname, setNickname] = useState('');
    const [pin, setPin] = useState('');
    const [dots, setDots] = useState('');

    useEffect(() => {
        const storedPin = sessionStorage.getItem('playerPin');
        const storedNick = sessionStorage.getItem('playerNickname');
        if (!storedPin || !storedNick) { router.push('/play'); return; }
        setPin(storedPin); setNickname(storedNick);

        const pusher = getPusherClient();
        const ch = pusher.subscribe(`game-${storedPin}`);
        ch.bind('question-start', () => router.push('/play/game'));
        return () => pusher.unsubscribe(`game-${storedPin}`);
    }, [router]);

    useEffect(() => {
        const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="bg-player min-h-screen flex flex-col items-center justify-center p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', top: '20%', left: '15%' }} />
            </div>

            <div className="text-center space-y-7 relative z-10 w-full max-w-sm">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full flex items-center justify-center text-6xl mx-auto pulse-ring font-black"
                    style={{ background: 'linear-gradient(135deg, #0056b3, #003d82)', boxShadow: '0 8px 40px rgba(0,86,179,0.5)' }}>
                    {nickname ? nickname[0].toUpperCase() : '?'}
                </div>

                <div>
                    <p className="text-white/40 font-bold text-xs tracking-widest mb-1">XUSH KELIBSIZ</p>
                    <h1 className="text-4xl font-black text-white">{nickname}</h1>
                </div>

                <div className="glass-blue p-5 rounded-2xl">
                    <p className="text-white/40 font-bold text-xs tracking-widest mb-1">PIN KOD</p>
                    <p className="text-4xl font-black tracking-widest" style={{ color: '#FFD600', textShadow: '0 0 20px rgba(255,214,0,0.5)' }}>{pin}</p>
                </div>

                {/* Bouncing dots */}
                <div className="flex justify-center gap-3 my-2">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-4 h-4 rounded-full animate-bounce"
                            style={{ background: ['#0056b3', '#FFD600', '#00E676'][i], animationDelay: `${i * 0.2}s`, boxShadow: `0 4px 12px ${['rgba(0,86,179,0.6)', 'rgba(255,214,0,0.6)', 'rgba(0,230,118,0.6)'][i]}` }} />
                    ))}
                </div>
                <p className="text-white/50 font-bold">O&apos;qituvchi o&apos;yinni boshlashini kutmoqda{dots}</p>
            </div>
        </div>
    );
}
