'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────

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
    { hex: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)' },
    { hex: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.5)' },
    { hex: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.5)' },
    { hex: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)' },
];

const SHOP_IMAGES = ['', '/game/chodircha.png', '/game/torgoh.png', '/game/karvonsaroy.png', '/game/bozorboshi.png'];
const SHOP_NAMES = ['', 'Chodircha', 'Torgoh', 'Karvonsaroy', 'Bozorboshi'];
const SHOP_COSTS = [0, 0, 500, 1500, 4000];

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

    // ── Load session ─────────────────────────────────────────────────────────
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
                    colorBg: TEAM_COLORS[t.teamIndex]?.bg ?? 'rgba(239,68,68,0.15)',
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

    // ── Intro → question ─────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'intro') return;
        const t = setTimeout(() => { revealedRef.current = false; setPhase('question'); }, 3500);
        return () => clearTimeout(t);
    }, [phase]);

    // ── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'question' || paused) return;
        if (timer <= 0) { doReveal(); return; }
        timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timer, paused]);

    // ── Auto-reveal when all answered ────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'question' || teams.length === 0) return;
        if (teams.every(t => t.thisAnswer !== null)) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setTimeout(doReveal, 700);
        }
    }, [teams, phase]);

    // ── Reveal logic ─────────────────────────────────────────────────────────
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
        setTimeout(() => setCoinPops({}), 1800);
    }, [questions, qIndex]);

    // ── Answer ───────────────────────────────────────────────────────────────
    const handleAnswer = (teamIndex: number, answerIndex: number) => {
        if (phase !== 'question' || paused) return;
        setTeams(prev => prev.map(t =>
            t.index === teamIndex && t.thisAnswer === null
                ? { ...t, thisAnswer: answerIndex }
                : t
        ));
    };

    // ── Next question ─────────────────────────────────────────────────────────
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

    // ── Ranked teams ─────────────────────────────────────────────────────────
    const rankedTeams = [...teams].sort((a, b) => b.coins - a.coins);

    // ── Loading ───────────────────────────────────────────────────────────────
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
    const teamCount = teams.length;

    // ── INTRO ─────────────────────────────────────────────────────────────────
    if (phase === 'intro') {
        return (
            <div className="fixed inset-0 overflow-hidden" style={{ background: '#1a0a00' }}>
                <Image src="/game/bozor.png" alt="bozor" fill className="object-cover opacity-60" priority />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
                    <div className="animate-[bounceIn_0.6s_ease-out]" style={{ animation: 'bounceIn 0.6s ease-out' }}>
                        <Image
                            src={CHAR_IMGS[sessionData.character] ?? '/game/polvon.png'}
                            alt="character"
                            width={200}
                            height={280}
                            className="object-contain drop-shadow-2xl"
                            style={{ filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.5))' }}
                        />
                    </div>
                    <div className="text-center px-4">
                        <h1 className="text-6xl font-black text-white mb-2" style={{ textShadow: '0 0 40px rgba(245,158,11,0.6)' }}>
                            🏪 Bozor ochildi!
                        </h1>
                        <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                            {CHAR_NAMES[sessionData.character]} sizni kutmoqda
                        </p>
                        <p className="text-white/50 text-lg font-semibold mt-2">
                            {teamCount} jamoa · {questions.length} savol · {sessionData.timePerQ}s
                        </p>
                    </div>
                    {/* Team preview */}
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

    // ── VICTORY ───────────────────────────────────────────────────────────────
    if (phase === 'victory') {
        const winner = rankedTeams[0];
        return (
            <div className="fixed inset-0 overflow-hidden" style={{ background: '#1a0a00' }}>
                <Image src="/game/bozor.png" alt="bozor" fill className="object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 px-4">
                    <div className="text-8xl animate-bounce">🏆</div>
                    <h1 className="text-5xl font-black text-center" style={{ color: '#f59e0b', textShadow: '0 0 60px rgba(245,158,11,0.7)' }}>
                        G'olib: {winner?.name}!
                    </h1>
                    <div className="flex flex-col gap-3 w-full max-w-md">
                        {rankedTeams.map((t, i) => (
                            <div key={t.index} className="flex items-center gap-4 rounded-2xl px-5 py-3" style={{ background: i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)', border: i === 0 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)' }}>
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
                        🔄 Yangi o'yin
                    </button>
                </div>
            </div>
        );
    }

    // ── QUESTION + REVEAL ─────────────────────────────────────────────────────
    const isReveal = phase === 'reveal';
    const correctIndex = currentQ?.correctIndex ?? 0;

    // Layout helpers
    const is2teams = teamCount === 2;
    const is4teams = teamCount === 4;

    return (
        <div className="fixed inset-0 overflow-hidden select-none" style={{ touchAction: 'manipulation' }}>
            {/* Background */}
            <Image src="/game/bozor.png" alt="bozor" fill className="object-cover" priority />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

            {/* Teacher control toggle — small tap zone top-center */}
            <button
                onPointerDown={() => setShowTeacherCtrl(v => !v)}
                className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-1 rounded-full text-xs font-black opacity-30 hover:opacity-70 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'white', touchAction: 'manipulation' }}
            >
                ⚙️ {showTeacherCtrl ? 'Yopish' : 'Boshqaruv'}
            </button>

            {/* Teacher control panel */}
            {showTeacherCtrl && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex gap-2 px-4 py-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.2)', touchAction: 'manipulation' }}>
                    <button onPointerDown={() => setPaused(p => !p)} className="px-4 py-2 rounded-xl font-black text-sm" style={{ background: paused ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', color: paused ? '#22c55e' : '#fbbf24' }}>
                        {paused ? '▶ Davom' : '⏸ Pauza'}
                    </button>
                    {isReveal && (
                        <button onPointerDown={handleNext} className="px-4 py-2 rounded-xl font-black text-sm" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                            ⏭ Keyingisi
                        </button>
                    )}
                    <button onPointerDown={() => { if (timerRef.current) clearTimeout(timerRef.current); setTimer(t => t + 10); }} className="px-4 py-2 rounded-xl font-black text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        +10s
                    </button>
                    <button onPointerDown={doReveal} className="px-4 py-2 rounded-xl font-black text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        O'tkazish
                    </button>
                </div>
            )}

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 z-30" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full transition-all duration-500" style={{ width: `${((qIndex) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
            </div>

            {/* ── MAIN LAYOUT ─────────────────────────────────────────────── */}
            <div className={`absolute inset-0 z-20 flex ${is4teams ? 'flex-col' : 'flex-row'} items-stretch pt-4`}>

                {/* 2-team: [Team0] [Center] [Team1] */}
                {/* 3-team: [Team0] [Center] [Team1], Team2 below center */}
                {/* 4-team: top row [T0][Center][T1], bottom row [T2][space][T3] */}

                {is4teams ? (
                    // 4 teams: top row + bottom row
                    <>
                        <div className="flex flex-row flex-1">
                            <TeamZone team={teams[0]} q={currentQ} isReveal={isReveal} correctIndex={correctIndex} onAnswer={handleAnswer} coinPop={coinPops[0]} />
                            <QuestionCenter q={currentQ} qIndex={qIndex} total={questions.length} timer={timer} timePerQ={sessionData.timePerQ} charImg={CHAR_IMGS[sessionData.character]} isReveal={isReveal} correctIndex={correctIndex} onNext={handleNext} paused={paused} economyOn={sessionData.economyOn} />
                            <TeamZone team={teams[1]} q={currentQ} isReveal={isReveal} correctIndex={correctIndex} onAnswer={handleAnswer} coinPop={coinPops[1]} />
                        </div>
                        <div className="flex flex-row" style={{ height: '42%' }}>
                            <TeamZone team={teams[2]} q={currentQ} isReveal={isReveal} correctIndex={correctIndex} onAnswer={handleAnswer} coinPop={coinPops[2]} />
                            <div className="flex-1" /> {/* empty center */}
                            <TeamZone team={teams[3]} q={currentQ} isReveal={isReveal} correctIndex={correctIndex} onAnswer={handleAnswer} coinPop={coinPops[3]} />
                        </div>
                    </>
                ) : (
                    // 2-3 teams: side by side
                    <>
                        <TeamZone team={teams[0]} q={currentQ} isReveal={isReveal} correctIndex={correctIndex} onAnswer={handleAnswer} coinPop={coinPops[0]} />
                        <QuestionCenter q={currentQ} qIndex={qIndex} total={questions.length} timer={timer} timePerQ={sessionData.timePerQ} charImg={CHAR_IMGS[sessionData.character]} isReveal={isReveal} correctIndex={correctIndex} onNext={handleNext} paused={paused} economyOn={sessionData.economyOn} />
                        <div className="flex flex-col flex-none" style={{ width: '30%' }}>
                            <TeamZone team={teams[1]} q={currentQ} isReveal={isReveal} correctIndex={correctIndex} onAnswer={handleAnswer} coinPop={coinPops[1]} />
                            {teams[2] && (
                                <TeamZone team={teams[2]} q={currentQ} isReveal={isReveal} correctIndex={correctIndex} onAnswer={handleAnswer} coinPop={coinPops[2]} />
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Paused overlay */}
            {paused && (
                <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
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

// ─── Team Zone ────────────────────────────────────────────────────────────────

function TeamZone({ team, q, isReveal, correctIndex, onAnswer, coinPop }: {
    team: TeamState;
    q: Question;
    isReveal: boolean;
    correctIndex: number;
    onAnswer: (teamIndex: number, answerIndex: number) => void;
    coinPop: boolean;
}) {
    if (!team || !q) return null;

    const answered = team.thisAnswer !== null;
    const LABELS = ['A', 'B', 'C', 'D'];

    const getBtnStyle = (optIndex: number) => {
        const isSelected = team.thisAnswer === optIndex;
        const isCorrect = optIndex === correctIndex;

        if (isReveal) {
            if (isCorrect) return { background: 'rgba(34,197,94,0.35)', border: '2px solid #22c55e', color: 'white' };
            if (isSelected && !isCorrect) return { background: 'rgba(239,68,68,0.35)', border: '2px solid #ef4444', color: 'rgba(255,255,255,0.7)' };
            return { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' };
        }
        if (isSelected) return { background: `${team.colorBg}`, border: `2px solid ${team.colorHex}`, color: 'white' };
        return { background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.15)', color: 'white' };
    };

    return (
        <div
            className="flex flex-col items-center gap-2 p-3 relative"
            style={{ width: '30%', minWidth: 0, background: `${team.colorBg}`, borderRight: `3px solid ${team.colorHex}40`, borderLeft: `3px solid ${team.colorHex}40` }}
        >
            {/* Shop + name */}
            <div className="flex flex-col items-center gap-1 w-full">
                <div className="relative w-24 h-20 md:w-32 md:h-24">
                    <Image
                        src={SHOP_IMAGES[team.shopLevel]}
                        alt={SHOP_NAMES[team.shopLevel]}
                        fill
                        className="object-contain"
                        style={{ filter: team.justUpgraded ? 'drop-shadow(0 0 16px gold)' : undefined }}
                    />
                    {team.justUpgraded && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-black px-2 py-0.5 rounded-full animate-bounce" style={{ background: '#f59e0b', color: '#1a0a00', whiteSpace: 'nowrap' }}>
                            ⬆ Yangi daraja!
                        </div>
                    )}
                </div>
                <p className="font-black text-base md:text-lg text-center leading-tight" style={{ color: team.colorHex }}>
                    {team.name}
                </p>
                <p className="text-white/40 text-xs font-bold">{SHOP_NAMES[team.shopLevel]}</p>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-1.5 relative">
                <Image src="/game/sum.png" alt="coin" width={20} height={20} className="object-contain" />
                <span className="font-black text-xl md:text-2xl" style={{ color: '#f59e0b' }}>{team.coins}</span>
                {coinPop && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-sm animate-ping pointer-events-none" style={{ color: '#22c55e' }}>+100</span>
                )}
            </div>

            {/* Combo badge */}
            {team.combo >= 2 && (
                <div className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                    🔥 {team.combo}x Combo
                </div>
            )}

            {/* Answer status */}
            {answered && !isReveal && (
                <div className="text-xs font-black px-3 py-1 rounded-xl" style={{ background: `${team.colorBg}`, border: `1px solid ${team.colorHex}`, color: team.colorHex }}>
                    ✓ Javob berildi
                </div>
            )}

            {isReveal && team.lastCorrect !== null && (
                <div className="text-2xl font-black">{team.lastCorrect ? '✅' : '❌'}</div>
            )}

            {/* Answer buttons */}
            <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                {q.options.map((opt, i) => (
                    <button
                        key={i}
                        onPointerDown={() => onAnswer(team.index, i)}
                        disabled={answered || isReveal}
                        className="rounded-xl p-2 md:p-3 font-bold transition-all active:scale-95 disabled:cursor-default text-left"
                        style={{
                            ...getBtnStyle(i),
                            fontSize: 'clamp(11px, 1.5vw, 16px)',
                            minHeight: '56px',
                            touchAction: 'manipulation',
                        }}
                    >
                        <span className="font-black mr-1" style={{ fontSize: 'clamp(12px, 1.8vw, 20px)' }}>{LABELS[i]}</span>
                        <span className="leading-tight">{opt}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Question Center ──────────────────────────────────────────────────────────

function QuestionCenter({ q, qIndex, total, timer, timePerQ, charImg, isReveal, correctIndex, onNext, paused, economyOn }: {
    q: Question;
    qIndex: number;
    total: number;
    timer: number;
    timePerQ: number;
    charImg: string;
    isReveal: boolean;
    correctIndex: number;
    onNext: () => void;
    paused: boolean;
    economyOn: boolean;
}) {
    if (!q) return null;
    const timerPct = (timer / timePerQ) * 100;
    const timerColor = timer > timePerQ * 0.5 ? '#22c55e' : timer > timePerQ * 0.25 ? '#f59e0b' : '#ef4444';
    const LABELS = ['A', 'B', 'C', 'D'];

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 py-2 relative">
            {/* Character (small, top) */}
            <div className="absolute top-2 right-2 w-16 h-20 md:w-20 md:h-24 opacity-80">
                <Image src={charImg} alt="char" fill className="object-contain object-bottom" />
            </div>

            {/* Question counter */}
            <p className="text-white/40 font-black text-sm tracking-widest uppercase">
                {qIndex + 1} / {total}
            </p>

            {/* Timer ring */}
            <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="46%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8%" />
                    <circle cx="50%" cy="50%" r="46%" fill="none" stroke={timerColor} strokeWidth="8%"
                        strokeDasharray={`${timerPct * 2.89} 289`}
                        style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }} />
                </svg>
                <span className="font-black text-xl md:text-2xl" style={{ color: timerColor }}>{paused ? '⏸' : timer}</span>
            </div>

            {/* Question text */}
            <div className="w-full rounded-2xl px-5 py-4 text-center" style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <p className="text-white font-black leading-snug" style={{ fontSize: 'clamp(18px, 3vw, 36px)' }}>
                    {q.text}
                </p>
            </div>

            {/* Correct answer reveal */}
            {isReveal && (
                <div className="w-full rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.5)' }}>
                    <p className="font-black text-sm md:text-base" style={{ color: '#22c55e' }}>
                        ✅ To'g'ri javob: <span className="font-black">{LABELS[correctIndex]}. {q.options[correctIndex]}</span>
                    </p>
                    {q.explanation && (
                        <p className="text-white/50 text-xs md:text-sm mt-1 font-semibold">{q.explanation}</p>
                    )}
                </div>
            )}

            {/* Economy hint */}
            {economyOn && !isReveal && (
                <p className="text-white/25 text-xs font-bold">💰 To'g'ri javob = +100 so'm</p>
            )}

            {/* Next button (reveal phase only, large touch target) */}
            {isReveal && (
                <button
                    onPointerDown={onNext}
                    className="w-full py-4 rounded-2xl font-black text-lg md:text-xl transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', color: 'white', touchAction: 'manipulation', marginTop: 4 }}
                >
                    {qIndex + 1 >= total ? '🏆 O\'yinni tugatish' : '⏭ Keyingi savol'}
                </button>
            )}
        </div>
    );
}
