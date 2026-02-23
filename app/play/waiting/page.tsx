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
        setPin(storedPin);
        setNickname(storedNick);

        // Subscribe to game channel for question-start
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`game-${storedPin}`);
        channel.bind('question-start', () => {
            router.push('/play/game');
        });

        return () => {
            pusher.unsubscribe(`game-${storedPin}`);
        };
    }, [router]);

    useEffect(() => {
        const interval = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-game min-h-screen flex flex-col items-center justify-center p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full opacity-15 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #6C63FF, transparent)', top: '20%', left: '20%' }} />
            </div>

            <div className="text-center space-y-8 relative z-10">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto pulse-ring"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #4834d4)', boxShadow: '0 8px 32px rgba(108,99,255,0.5)' }}>
                    {nickname ? nickname[0].toUpperCase() : '🎮'}
                </div>

                <div>
                    <p className="text-white/60 font-bold text-sm mb-1">KIRDINIZ</p>
                    <h1 className="text-4xl font-black text-white">{nickname}</h1>
                </div>

                <div className="glass p-6 rounded-2xl space-y-2">
                    <p className="text-white/60 font-bold text-sm">PIN KOD</p>
                    <p className="text-4xl font-black tracking-widest" style={{ color: '#6C63FF' }}>{pin}</p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-center gap-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="w-4 h-4 rounded-full animate-bounce"
                                style={{
                                    background: ['#6C63FF', '#FF6B6B', '#FFD93D'][i],
                                    animationDelay: `${i * 0.2}s`,
                                    boxShadow: `0 4px 12px ${['rgba(108,99,255,0.6)', 'rgba(255,107,107,0.6)', 'rgba(255,217,61,0.6)'][i]}`,
                                }} />
                        ))}
                    </div>
                    <p className="text-white/60 font-bold text-lg">
                        O&apos;qituvchi o&apos;yinni boshlashini kutmoqda{dots}
                    </p>
                </div>
            </div>
        </div>
    );
}
