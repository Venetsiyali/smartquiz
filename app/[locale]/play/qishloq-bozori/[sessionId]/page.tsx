'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

interface TeamState {
    index: number;
    name: string;
    colorHex: string;
    colorBg: string;
    coins: number;
    shopLevel: number;
    combo: number;
    thisAnswer: number | null;
    lastCorrect: boolean | null;
    justUpgraded: boolean;
}

type Phase = 'loading' | 'intro' | 'question' | 'reveal' | 'victory';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_COLORS = [
    { hex: '#ef4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)' },
    { hex: '#3b82f6', bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.5)' },
    { hex: '#22c55e', bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.5)' },
    { hex: '#f59e0b', bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.5)' },
];

const SHOP_IMAGES = ['', '/game/chodircha.png', '/game/torgoh.png', '/game/karvonsaroy.png', '/game/bozorboshi.png'];
const SHOP_NAMES = ['', 'Chodircha', 'Torgoh', 'Karvonsaroy', 'Bozorboshi'];
const SHOP_COSTS = [0, 0, 500, 1500, 4000];
const LABELS = ['A', 'B', 'C', 'D'];

const CHAR_IMGS: Record<string, string> = {
    polvon: '/game/polvon.png',
    nilufar: '/game/nilufar.png',
    mirzo: '/game/mirzo.png',
    kamola: '/game/kamola.png',
};
const CHAR_NAMES: Record<string, string> = {
    polvon: 'Polvon Aka',
    nilufar: 'Dr. Nilufar',
    mirzo: 'Bobur Mirzo',
    kamola: 'Kamola',
};

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function coinsForCorrect(combo: number): number {
    let base = 100;
    if (combo >= 3) base += 50;
    return base;
}

function shopLevelForCoins(coins: number): number {
    if (coins >= SHOP_COSTS[4]) return 4;
    if (coins >= SHOP_COSTS[3]) return 3;
    if (coins >= SHOP_COSTS[2]) return 2;
    return 1;
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function QishloqBozoriGame() {
    const params = useParams();
    const sessionId = params?.sessionId as string;

    const [sessionData, setSessionData] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [phase, setPhase] = useState<Phase>('loading');
    const [qIndex, setQIndex] = useState(0);
    const [timer, setTimer] = useState(20);
    const [teams, setTeams] = useState<TeamState[]>([]);
    const [coinPops, setCoinPops] = useState<Record<number, boolean>>({});
    const [showTeacherCtrl, setShowTeacherCtrl] = useState(false);
    const [paused, setPaused] = useState(false);

    const revealedRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetch(`/api/game/bozor/sessions/${sessionId}`)
            .then(r => r.json())
            .then(data => {
                setSessionData(data);
                setQuestions(shuffle(data.questions as Question[]));
                setTeams((data.teams as any[]).map(t => ({
                    index: t.teamIndex,
                    name: t.name,
                    colorHex: TEAM_COLORS[t.teamIndex]?.hex ?? '#ef4444',
                    colorBg: TEAM_COLORS[t.teamIndex]?.bg ?? 'rgba(239,68,68,0.18)',
                    coins: 0,
                    shopLevel: 1,
                    combo: 0,
                    thisAnswer: null,
                    lastCorrect: null,
                    justUpgraded: false,
                })));
                setTimer(data.timePerQ ?? 20);
                setPhase('intro');
            });
    }, [sessionId]);

    useEffect(() => {
        if (phase !== 'intro') return;
        const t = setTimeout(() => { revealedRef.current = false; setPhase('question'); }, 3500);
        return () => clearTimeout(t);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'question' || paused) return;
        if (timer <= 0) { doReveal(); return; }
        timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timer, paused]);

    useEffect(() => {
        if (phase !== 'question' || teams.length === 0) return;
        if (teams.every(t => t.thisAnswer !== null)) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setTimeout(doReveal, 700);
        }
    }, [teams, phase]);

    const doReveal = useCallback(() => {
        if (revealedRef.current) return;
        revealedRef.current = true;
        setPhase('reveal');

        const correctIndex = questions[qIndex]?.correctIndex ?? 0;
        const pops: Record<number, boolean> = {};

        setTeams(prev => prev.map(t => {
            const isCorrect = t.thisAnswer === correctIndex;
            const earned = isCorrect ? coinsForCorrect(t.combo + 1) : 0;
            const newCoins = t.coins + earned;
            const newCombo = isCorrect ? t.combo + 1 : 0;
            const newLevel = shopLevelForCoins(newCoins);
            const upgraded = newLevel > t.shopLevel;
            if (isCorrect) pops[t.index] = true;
            return { ...t, coins: newCoins, shopLevel: newLevel, combo: newCombo, lastCorrect: isCorrect, justUpgraded: upgraded };
        }));

        setCoinPops(pops);
        setTimeout(() => setCoinPops({}), 2000);
    }, [questions, qIndex]);

    const handleAnswer = (teamIndex: number, answerIndex: number) => {
        if (phase !== 'question' || paused) return;
        setTeams(prev => prev.map(t =>
            t.index === teamIndex && t.thisAnswer === null
                ? { ...t, thisAnswer: answerIndex }
                : t
        ));
    };

    const handleNext = () => {
        if (qIndex + 1 >= questions.length) {
            setPhase('victory');
            fetch(`/api/game/bozor/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'finished' }),
            });
            return;
        }
        revealedRef.current = false;
        setQIndex(i => i + 1);
        setTeams(prev => prev.map(t => ({ ...t, thisAnswer: null, lastCorrect: null, justUpgraded: false })));
        setTimer(sessionData?.timePerQ ?? 20);
        setPhase('question');
    };

    const rankedTeams = [...teams].sort((a, b) => b.coins - a.coins);

    if (phase === 'loading' || !sessionData) {
        return (
            <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#1a0a00' }}>
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🏪</div>
                    <p className="text-white/50 font-black text-xl">Bozor ochilmoqda...</p>
                </div>
            </div>
        );
    }

    const currentQ = questions[qIndex];

    if (phase === 'intro') {
        return (
            <div className="fixed inset-0 overflow-hidden" style={{ background: '#1a0a00' }}>
                <Image src="/game/bozor.png" alt="bozor" fill className="object-cover opacity-60" priority />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
                    <Image
                        src={CHAR_IMGS[sessionData.character] ?? '/game/polvon.png'}
                        alt="character" width={200} height={280}
                        className="object-contain drop-shadow-2xl"
                        style={{ filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.5))' }}
                    />
                    <div className="text-center px-4">
                        <h1 className="text-6xl font-black text-white mb-2" style={{ textShadow: '0 0 40px rgba(245,158,11,0.6)' }}>
                            🏪 Bozor ochildi!
                        </h1>
                        <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                            {CHAR_NAMES[sessionData.character]} sizni kutmoqda
                        </p>
                        <p className="text-white/50 text-lg font-semibold mt-2">
                            {teams.length} jamoa · {questions.length} savol · {sessionData.timePerQ}s
                        </p>
                    </div>
                    <div className="flex gap-4 mt-2">
                        {teams.map(t => (
                            <div key={t.index} className="px-5 py-2 rounded-xl font-black text-sm" style={{ background: t.colorBg, border: `2px solid ${t.colorHex}`, color: t.colorHex }}>
                                {t.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'victory') {
        const winner = rankedTeams[0];
        return (
            <div className="fixed inset-0 overflow-hidden" style={{ background: '#1a0a00' }}>
                <Image src="/game/bozor.png" alt="bozor" fill className="object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 px-4">
                    <div className="text-8xl animate-bounce">🏆</div>
                    <h1 className="text-5xl font-black text-center" style={{ color: '#f59e0b', textShadow: '0 0 60px rgba(245,158,11,0.7)' }}>
                        G&apos;olib: {winner?.name}!
                    </h1>
                    <div className="flex flex-col gap-3 w-full max-w-md">
                        {rankedTeams.map((t, i) => (
                            <div key={t.index} className="flex items-center gap-4 rounded-2xl px-5 py-3"
                                style={{ background: i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)', border: i === 0 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)' }}>
                                <span className="text-2xl font-black w-8 text-center" style={{ color: i === 0 ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
                                    {['🥇', '🥈', '🥉', '4️⃣'][i]}
                                </span>
                                <div className="flex-1">
                                    <p className="font-black text-white text-lg">{t.name}</p>
                                    <p className="text-xs font-semibold" style={{ color: t.colorHex }}>{SHOP_NAMES[t.shopLevel]}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Image src="/game/sum.png" alt="coin" width={24} height={24} className="object-contain" />
                                    <span className="font-black text-xl" style={{ color: '#f59e0b' }}>{t.coins}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => window.location.href = window.location.href.replace(/\/[^/]+$/, '')}
                        className="mt-4 px-10 py-4 rounded-2xl font-black text-lg active:scale-95 transition-all"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', color: 'white' }}
                    >
                        🔄 Yangi o&apos;yin
                    </button>
                </div>
            </div>
        );
    }

    const isReveal = phase === 'reveal';
    const correctIndex = currentQ?.correctIndex ?? 0;

    return (
        <div className="fixed inset-0 overflow-hidden select-none" style={{ touchAction: 'manipulation' }}>
            {/* Background */}
            <Image src="/game/bozor.png" alt="bozor" fill className="object-cover" priority />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.52)' }} />

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 z-30" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full transition-all duration-500"
                    style={{ width: `${(qIndex / questions.length) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
            </div>

            {/* Teacher control toggle */}
            <button
                onPointerDown={() => setShowTeacherCtrl(v => !v)}
                className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-1 rounded-full text-xs font-black opacity-25 hover:opacity-70 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white', touchAction: 'manipulation' }}
            >
                ⚙️ {showTeacherCtrl ? 'Yopish' : 'Boshqaruv'} · {qIndex + 1}/{questions.length}
            </button>

            {/* Teacher control panel */}
            {showTeacherCtrl && (
                <div className="absolute top-9 left-1/2 -translate-x-1/2 z-50 flex gap-2 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', touchAction: 'manipulation' }}>
                    <button onPointerDown={() => setPaused(p => !p)} className="px-4 py-2 rounded-xl font-black text-sm"
                        style={{ background: paused ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', color: paused ? '#22c55e' : '#fbbf24' }}>
                        {paused ? '▶ Davom' : '⏸ Pauza'}
                    </button>
                    {isReveal && (
                        <button onPointerDown={handleNext} className="px-4 py-2 rounded-xl font-black text-sm"
                            style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                            ⏭ Keyingisi
                        </button>
                    )}
                    <button onPointerDown={() => { if (timerRef.current) clearTimeout(timerRef.current); setTimer(t => t + 10); }}
                        className="px-4 py-2 rounded-xl font-black text-sm"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        +10s
                    </button>
                    <button onPointerDown={doReveal} className="px-4 py-2 rounded-xl font-black text-sm"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        O&apos;tkazish
                    </button>
                </div>
            )}

            {/* ── MAIN 3-ROW LAYOUT ───────────────────────────────────────── */}
            <div className="absolute inset-0 z-20 flex flex-col pt-1">

                {/* ── ROW 1: Score bar (top ~22%) ── */}
                <div className="flex flex-row gap-2 px-3 py-2" style={{ height: '22%' }}>
                    {teams.map(t => (
                        <ScoreCard key={t.index} team={t} isReveal={isReveal} coinPop={!!coinPops[t.index]} />
                    ))}
                </div>

                {/* ── ROW 2: Question center (~38%) ── */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 gap-2 relative">
                    {/* Character */}
                    <div className="absolute top-0 right-4 w-14 h-18 opacity-75" style={{ height: '72px' }}>
                        <Image src={CHAR_IMGS[sessionData.character]} alt="char" fill className="object-contain object-bottom" />
                    </div>

                    {/* Timer ring */}
                    <TimerRing timer={timer} timePerQ={sessionData.timePerQ} paused={paused} />

                    {/* Question box */}
                    <div className="w-full max-w-3xl rounded-2xl px-6 py-4 text-center"
                        style={{ background: 'rgba(0,0,0,0.82)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                        <p className="text-white font-black leading-snug" style={{ fontSize: 'clamp(16px, 2.6vw, 34px)' }}>
                            {currentQ?.text}
                        </p>
                    </div>

                    {/* Correct answer reveal */}
                    {isReveal && (
                        <div className="w-full max-w-3xl rounded-xl px-4 py-2.5 text-center"
                            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.5)' }}>
                            <p className="font-black text-sm" style={{ color: '#22c55e', fontSize: 'clamp(12px, 1.6vw, 18px)' }}>
                                ✅ To&apos;g&apos;ri javob: {LABELS[correctIndex]}. {currentQ?.options[correctIndex]}
                            </p>
                            {currentQ?.explanation && (
                                <p className="text-white/50 text-xs mt-1 font-semibold">{currentQ.explanation}</p>
                            )}
                        </div>
                    )}

                    {/* Economy hint */}
                    {sessionData.economyOn && !isReveal && (
                        <p className="text-white/25 text-xs font-bold">💰 To&apos;g&apos;ri javob = +100 so&apos;m</p>
                    )}

                    {/* Next button */}
                    {isReveal && (
                        <button
                            onPointerDown={handleNext}
                            className="px-10 py-3 rounded-2xl font-black text-base active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', color: 'white', touchAction: 'manipulation', fontSize: 'clamp(14px, 1.8vw, 22px)' }}
                        >
                            {qIndex + 1 >= questions.length ? "🏆 O'yinni tugatish" : '⏭ Keyingi savol'}
                        </button>
                    )}
                </div>

                {/* ── ROW 3: Answer buttons (bottom ~40%) ── */}
                <div className="flex flex-row gap-2 px-3 pb-3 pt-1" style={{ height: '40%' }}>
                    {teams.map(t => (
                        <AnswerColumn
                            key={t.index}
                            team={t}
                            q={currentQ}
                            isReveal={isReveal}
                            correctIndex={correctIndex}
                            onAnswer={handleAnswer}
                        />
                    ))}
                </div>
            </div>

            {/* Paused overlay */}
            {paused && (
                <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}>
                    <div className="text-center">
                        <div className="text-8xl mb-4">⏸</div>
                        <p className="text-white font-black text-4xl">Pauza</p>
                        <p className="text-white/50 text-lg mt-2">Davom etish uchun boshqaruvdan bosing</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Score Card (top bar) ─────────────────────────────────────────────────────

function ScoreCard({ team, isReveal, coinPop }: { team: TeamState; isReveal: boolean; coinPop: boolean }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 relative overflow-hidden"
            style={{ background: team.colorBg, border: `2px solid ${team.colorHex}55` }}>

            {/* Shop image */}
            <div className="relative" style={{ width: 44, height: 36 }}>
                <Image
                    src={SHOP_IMAGES[team.shopLevel]}
                    alt={SHOP_NAMES[team.shopLevel]}
                    fill
                    className="object-contain"
                    style={{ filter: team.justUpgraded ? 'drop-shadow(0 0 10px gold)' : undefined }}
                />
            </div>

            {/* Team name */}
            <p className="font-black text-center leading-tight" style={{ color: team.colorHex, fontSize: 'clamp(11px, 1.4vw, 18px)' }}>
                {team.name}
            </p>

            {/* Shop name */}
            <p className="text-white/35 font-bold" style={{ fontSize: 'clamp(9px, 1vw, 13px)' }}>
                {SHOP_NAMES[team.shopLevel]}
            </p>

            {/* Coins */}
            <div className="flex items-center gap-1 relative">
                <Image src="/game/sum.png" alt="coin" width={14} height={14} className="object-contain" />
                <span className="font-black" style={{ color: '#f59e0b', fontSize: 'clamp(13px, 1.6vw, 22px)' }}>{team.coins}</span>
                {coinPop && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-black text-sm animate-bounce pointer-events-none whitespace-nowrap"
                        style={{ color: '#22c55e' }}>+100</span>
                )}
            </div>

            {/* Combo */}
            {team.combo >= 2 && (
                <div className="font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 'clamp(9px, 1vw, 12px)' }}>
                    🔥 {team.combo}x Combo
                </div>
            )}

            {/* Upgrade badge */}
            {team.justUpgraded && (
                <div className="absolute top-0 inset-x-0 flex justify-center">
                    <div className="font-black px-2 py-0.5 rounded-b-xl animate-bounce whitespace-nowrap"
                        style={{ background: '#f59e0b', color: '#1a0a00', fontSize: '10px' }}>
                        ⬆ Yangi daraja!
                    </div>
                </div>
            )}

            {/* Result icon */}
            {isReveal && team.lastCorrect !== null && (
                <div className="absolute top-1 right-2 text-lg">{team.lastCorrect ? '✅' : '❌'}</div>
            )}

            {/* Answered dot */}
            {team.thisAnswer !== null && !isReveal && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ background: team.colorHex }} />
            )}
        </div>
    );
}

// ─── Timer Ring ───────────────────────────────────────────────────────────────

function TimerRing({ timer, timePerQ, paused }: { timer: number; timePerQ: number; paused: boolean }) {
    const pct = (timer / timePerQ) * 100;
    const color = timer > timePerQ * 0.5 ? '#22c55e' : timer > timePerQ * 0.25 ? '#f59e0b' : '#ef4444';
    const r = 38;
    const circ = 2 * Math.PI * r;
    return (
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
                    strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                    style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }} />
            </svg>
            <span className="font-black text-2xl" style={{ color }}>{paused ? '⏸' : timer}</span>
        </div>
    );
}

// ─── Answer Column (bottom section per team) ──────────────────────────────────

function AnswerColumn({ team, q, isReveal, correctIndex, onAnswer }: {
    team: TeamState;
    q: Question;
    isReveal: boolean;
    correctIndex: number;
    onAnswer: (teamIndex: number, answerIndex: number) => void;
}) {
    if (!team || !q) return null;
    const answered = team.thisAnswer !== null;

    const getBtnStyle = (i: number) => {
        const isSelected = team.thisAnswer === i;
        const isCorrect = i === correctIndex;

        if (isReveal) {
            if (isCorrect) return { background: 'rgba(34,197,94,0.35)', border: '2px solid #22c55e', color: 'white' };
            if (isSelected && !isCorrect) return { background: 'rgba(239,68,68,0.3)', border: '2px solid #ef4444', color: 'rgba(255,255,255,0.6)' };
            return { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' };
        }
        if (isSelected) return { background: team.colorBg, border: `2px solid ${team.colorHex}`, color: 'white' };
        if (answered) return { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' };
        return { background: 'rgba(0,0,0,0.55)', border: `1px solid ${team.colorHex}55`, color: 'white' };
    };

    return (
        <div className="flex-1 flex flex-col gap-1.5 rounded-2xl p-2"
            style={{ background: `${team.colorBg}`, border: `2px solid ${team.colorHex}40` }}>

            {/* Team label in answer area */}
            <div className="text-center font-black leading-none mb-0.5" style={{ color: team.colorHex, fontSize: 'clamp(10px, 1.2vw, 15px)' }}>
                {answered && !isReveal
                    ? <span style={{ color: team.colorHex }}>✓ Javob berildi</span>
                    : team.name
                }
            </div>

            {/* 4 buttons stacked vertically */}
            {q.options.map((opt, i) => (
                <button
                    key={i}
                    onPointerDown={() => onAnswer(team.index, i)}
                    disabled={answered || isReveal}
                    className="flex-1 rounded-xl px-2 py-1 font-bold transition-all active:scale-95 disabled:cursor-default text-left flex items-center gap-1.5"
                    style={{
                        ...getBtnStyle(i),
                        fontSize: 'clamp(11px, 1.3vw, 16px)',
                        touchAction: 'manipulation',
                        minHeight: 0,
                    }}
                >
                    <span className="font-black shrink-0 w-5 text-center" style={{ fontSize: 'clamp(12px, 1.5vw, 18px)' }}>
                        {LABELS[i]}
                    </span>
                    <span className="leading-tight line-clamp-2">{opt}</span>
                </button>
            ))}
        </div>
    );
}
