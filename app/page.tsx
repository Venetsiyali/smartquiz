'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="bg-game min-h-screen flex flex-col items-center justify-center p-6">
            {/* Animated orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #6C63FF, transparent)', top: '-10%', left: '-5%' }} />
                <div className="absolute w-80 h-80 rounded-full opacity-15 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FF6B6B, transparent)', bottom: '-5%', right: '-5%', animationDelay: '1s' }} />
                <div className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FFD93D, transparent)', top: '40%', right: '10%', animationDelay: '2s' }} />
            </div>

            {/* Logo */}
            <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                        style={{ background: 'linear-gradient(135deg, #6C63FF, #4834d4)', boxShadow: '0 8px 32px rgba(108,99,255,0.5)' }}>
                        ⚡
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white">
                        Smart<span style={{ color: '#6C63FF' }}>Quiz</span>
                    </h1>
                </div>
                <p className="text-white/60 text-xl font-semibold">
                    Real-vaqt rejimida ta&apos;limiy viktorina platformasi
                </p>
            </div>

            {/* Role Selection */}
            <div className={`w-full max-w-lg space-y-4 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Teacher Card */}
                <button
                    onClick={() => router.push('/teacher/create')}
                    className="w-full glass p-6 rounded-2xl text-left hover:scale-105 transition-all duration-200 cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6C63FF, #4834d4)' }}>
                            👨‍🏫
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
                                O&apos;qituvchi
                            </h2>
                            <p className="text-white/60 font-semibold">
                                Quiz yarating va o&apos;yinni boshqaring
                            </p>
                        </div>
                        <div className="text-white/40 text-2xl group-hover:translate-x-2 transition-transform">→</div>
                    </div>
                </button>

                {/* Student Card */}
                <button
                    onClick={() => router.push('/play')}
                    className="w-full glass p-6 rounded-2xl text-left hover:scale-105 transition-all duration-200 cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #FF6B6B, #ee0979)' }}>
                            🎮
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-extrabold text-white group-hover:text-pink-300 transition-colors">
                                O&apos;yinchi
                            </h2>
                            <p className="text-white/60 font-semibold">
                                PIN yoki QR kod orqali kiring
                            </p>
                        </div>
                        <div className="text-white/40 text-2xl group-hover:translate-x-2 transition-transform">→</div>
                    </div>
                </button>
            </div>

            {/* Footer */}
            <p className={`mt-12 text-white/30 text-sm font-semibold transition-all duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                ⚡ WebSocket orqali real-vaqt ulanish
            </p>
        </div>
    );
}
