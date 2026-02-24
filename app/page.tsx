'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();

    return (
        <div className="bg-landing min-h-screen flex flex-col">
            {/* Animated background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', top: '-15%', left: '-10%' }} />
                <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #FFD600, transparent)', bottom: '10%', right: '-5%', animationDelay: '1.5s' }} />
                <div className="absolute w-[300px] h-[300px] rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #00E676, transparent)', top: '40%', right: '20%', animationDelay: '3s' }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-black"
                        style={{ background: 'linear-gradient(135deg, #0056b3, #FFD600)' }}>Z</div>
                    <span className="text-2xl font-black text-white">
                        Zukk<span className="logo-z">oo</span>
                    </span>
                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(0,86,179,0.3)', border: '1px solid rgba(0,86,179,0.5)', color: '#60a5fa' }}>
                        TUIT · ATT
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/play')}
                        className="px-5 py-2.5 rounded-xl font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm">
                        📱 O&apos;yinga kirish
                    </button>
                    <button onClick={() => router.push('/teacher/create')} className="btn-primary text-sm px-5 py-2.5">
                        🎓 O&apos;qituvchi
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-bold text-sm"
                    style={{ background: 'rgba(0,86,179,0.2)', border: '1px solid rgba(0,86,179,0.4)', color: '#93c5fd' }}>
                    ⚡ Real-vaqt · WebSocket · 0.3s kechikish
                </div>

                <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-none tracking-tight">
                    Ta&apos;limni<br />
                    <span className="logo-z" style={{ fontSize: '1.1em' }}>O&apos;yinga</span>{' '}
                    <span style={{ color: 'white' }}>Aylantir</span>
                </h1>

                <p className="text-xl text-white/60 font-semibold max-w-2xl mb-10 leading-relaxed">
                    Zukkoo — TUIT talabalari uchun real-vaqt interaktiv viktorina platformasi.
                    O&apos;qituvchi savol tuzadi, talabalar telefondan javob beradi. Tezroq — ko&apos;proq ball!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-16">
                    <button onClick={() => router.push('/teacher/create')}
                        className="btn-primary text-lg px-8 py-4">
                        🎓 Quiz Yaratish
                    </button>
                    <button onClick={() => router.push('/play')}
                        className="px-8 py-4 rounded-2xl font-extrabold text-lg text-white transition-all hover:scale-105"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
                        📱 O&apos;yinga Kirish
                    </button>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                    {[
                        { icon: '⚡', title: 'Real-vaqt', desc: "WebSocket orqali 0.3s dan kam kechikish. Barcha o'yinchilar bir vaqtda ko'radi.", color: '#FFD600' },
                        { icon: '🤖', title: 'AI Savol Yaratuvchi', desc: "Groq LLaMA 3.3-70B yordamida mavzu bo'yicha savollar avtomatik yaratiladi.", color: '#00E676' },
                        { icon: '🏆', title: 'Tezlik + Ball', desc: "To'g'ri va tez javob = ko'proq ball. Real raqobat muhiti yaratadi.", color: '#0056b3' },
                    ].map((f, i) => (
                        <div key={i} className="glass p-6 text-left animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                                style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}>
                                {f.icon}
                            </div>
                            <h3 className="text-white font-extrabold text-lg mb-2">{f.title}</h3>
                            <p className="text-white/50 font-semibold text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-6 text-white/30 font-semibold text-sm">
                © 2026 Zukkoo · TUIT ATT bo&apos;limi · Barcha huquqlar himoyalangan
            </footer>
        </div>
    );
}
