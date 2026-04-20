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
    // Investment system
    investChoice: 'invest' | 'save' | null;
    investPending: boolean; // true = invested last round, awaiting outcome
    flash: 'correct' | 'wrong' | null;
}

type Phase = 'loading' | 'intro' | 'question' | 'reveal' | 'invest' | 'victory';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAM_COLORS = [
    { hex: '#ef4444', bg: 'rgba(239,68,68,0.18)' },
    { hex: '#3b82f6', bg: 'rgba(59,130,246,0.18)' },
    { hex: '#22c55e', bg: 'rgba(34,197,94,0.18)' },
    { hex: '#f59e0b', bg: 'rgba(245,158,11,0.18)' },
];

const SHOP_IMAGES = ['', '/game/chodircha.png', '/game/torgoh.png', '/game/karvonsaroy.png', '/game/bozorboshi.png'];
const SHOP_NAMES  = ['', 'Chodircha', 'Torgoh', 'Karvonsaroy', 'Bozorboshi'];
const SHOP_COSTS  = [0, 0, 500, 1500, 4000];
const LABELS      = ['A', 'B', 'C', 'D'];
const INVEST_COST = 100;
const INVEST_MULT = 2.5; // x2.5 return on correct

const CHAR_IMGS: Record<string, string> = {
    polvon:  '/game/polvon.png',
    nargiza: '/game/nargiza.png',
    mirzo:   '/game/mirzo.png',
    kamola:  '/game/kamola.png',
};
const CHAR_NAMES: Record<string, string> = {
    polvon:  'Polvon Aka',
    nargiza: 'Nargiza',
    mirzo:   'Bobur Mirzo',
    kamola:  'Kamola',
};

// Random market events (shown at start of invest phase)
const MARKET_EVENTS = [
    { emoji: '📈', text: 'Bozorda narxlar oshdi!', bonus: '+50 so\'m' },
    { emoji: '🐪', text: 'Savdo karvoni keldi!', bonus: 'Investitsiya ×3' },
    { emoji: '☀️', text: 'Hosil yaxshi bo\'ldi!', bonus: 'Do\'kon bepul upgrade' },
    { emoji: '🌧️', text: 'Yomg\'ir sababli savdo pasaydi', bonus: 'Ehtiyot bo\'ling' },
    { emoji: '🏺', text: 'Yangi tovarlar keldi!', bonus: 'Investitsiya foydali' },
    { emoji: '💎', text: 'Toshkent yarmarkasi!', bonus: 'To\'g\'ri javob = +150' },
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function coinsForCorrect(combo: number, invested: boolean, eventBonus: number): number {
    let base = 100 + eventBonus;
    if (combo >= 3) base += 50;
    if (invested) base = Math.round(base * INVEST_MULT);
    return base;
}

function shopLevelForCoins(coins: number): number {
    if (coins >= SHOP_COSTS[4]) return 4;
    if (coins >= SHOP_COSTS[3]) return 3;
    if (coins >= SHOP_COSTS[2]) return 2;
    return 1;
}

// ─── CSS Animations (injected once) ──────────────────────────────────────────

const ANIM_CSS = `
@keyframes coinFloat {
    0%   { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-60px) scale(1.4); opacity: 0; }
}
@keyframes shakeX {
    0%,100% { transform: translateX(0); }
    20%,60% { transform: translateX(-8px); }
    40%,80% { transform: translateX(8px); }
}
@keyframes correctFlash {
    0%   { background: rgba(34,197,94,0.6); }
    100% { background: transparent; }
}
@keyframes wrongFlash {
    0%   { background: rgba(239,68,68,0.5); }
    100% { background: transparent; }
}
@keyframes timerPulse {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.2); }
}
@keyframes goldShine {
    0%,100% { box-shadow: 0 0 12px rgba(245,158,11,0.4); }
    50%     { box-shadow: 0 0 32px rgba(245,158,11,0.9), 0 0 60px rgba(245,158,11,0.5); }
}
@keyframes upgradePopIn {
    0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
}
@keyframes investPulse {
    0%,100% { transform: scale(1); box-shadow: 0 0 0 rgba(245,158,11,0); }
    50%     { transform: scale(1.03); box-shadow: 0 0 20px rgba(245,158,11,0.5); }
}
.anim-coinFloat  { animation: coinFloat 1.2s ease-out forwards; }
.anim-shake      { animation: shakeX 0.5s ease; }
.anim-correct    { animation: correctFlash 0.8s ease-out forwards; }
.anim-wrong      { animation: wrongFlash 0.6s ease-out forwards; }
.anim-timerPulse { animation: timerPulse 0.4s ease infinite; }
.anim-goldShine  { animation: goldShine 1.5s ease-in-out infinite; }
.anim-upgradeIn  { animation: upgradePopIn 0.5s cubic-bezier(.34,1.56,.64,1) forwards; }
.anim-slideUp    { animation: slideUp 0.35s ease-out forwards; }
.anim-invest     { animation: investPulse 1.2s ease-in-out infinite; }
`;

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function QishloqBozoriGame() {
    const params    = useParams();
    const sessionId = params?.sessionId as string;

    const [sessionData,      setSessionData]      = useState<any>(null);
    const [questions,        setQuestions]        = useState<Question[]>([]);
    const [phase,            setPhase]            = useState<Phase>('loading');
    const [qIndex,           setQIndex]           = useState(0);
    const [timer,            setTimer]            = useState(20);
    const [teams,            setTeams]            = useState<TeamState[]>([]);
    const [coinPops,         setCoinPops]         = useState<Record<number, number>>({}); // teamIndex → earned amount
    const [showTeacherCtrl,  setShowTeacherCtrl]  = useState(false);
    const [paused,           setPaused]           = useState(false);
    const [investTimer,      setInvestTimer]      = useState(10);
    const [marketEvent,      setMarketEvent]      = useState(MARKET_EVENTS[0]);
    const [eventBonus,       setEventBonus]       = useState(0);

    const revealedRef = useRef(false);
    const timerRef    = useRef<NodeJS.Timeout | null>(null);
    const investRef   = useRef<NodeJS.Timeout | null>(null);

    // Inject CSS once
    useEffect(() => {
        if (document.getElementById('bozor-anim')) return;
        const s = document.createElement('style');
        s.id = 'bozor-anim';
        s.textContent = ANIM_CSS;
        document.head.appendChild(s);
    }, []);

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
                    colorBg:  TEAM_COLORS[t.teamIndex]?.bg  ?? 'rgba(239,68,68,0.18)',
                    coins: 0, shopLevel: 1, combo: 0,
                    thisAnswer: null, lastCorrect: null, justUpgraded: false,
                    investChoice: null, investPending: false, flash: null,
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

    // ── Question timer ───────────────────────────────────────────────────────
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
            setTimeout(doReveal, 600);
        }
    }, [teams, phase]);

    // ── Invest timer countdown ───────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'invest') return;
        if (investTimer <= 0) { proceedToNext(); return; }
        investRef.current = setTimeout(() => setInvestTimer(t => t - 1), 1000);
        return () => { if (investRef.current) clearTimeout(investRef.current); };
    }, [phase, investTimer]);

    // ── Reveal logic ─────────────────────────────────────────────────────────
    const doReveal = useCallback(() => {
        if (revealedRef.current) return;
        revealedRef.current = true;
        setPhase('reveal');

        const correctIndex = questions[qIndex]?.correctIndex ?? 0;
        const pops: Record<number, number> = {};

        setTeams(prev => prev.map(t => {
            const isCorrect  = t.thisAnswer === correctIndex;
            const earned     = isCorrect ? coinsForCorrect(t.combo + 1, t.investPending, eventBonus) : 0;
            // If invested but wrong, lose the investment
            const investLoss = (!isCorrect && t.investPending) ? INVEST_COST : 0;
            const newCoins   = Math.max(0, t.coins + earned - investLoss);
            const newCombo   = isCorrect ? t.combo + 1 : 0;
            const newLevel   = shopLevelForCoins(newCoins);
            const upgraded   = newLevel > t.shopLevel;
            if (earned > 0) pops[t.index] = earned;
            return {
                ...t,
                coins: newCoins, shopLevel: newLevel, combo: newCombo,
                lastCorrect: isCorrect, justUpgraded: upgraded,
                investPending: false,
                flash: isCorrect ? 'correct' : 'wrong',
            };
        }));

        setCoinPops(pops);
        setTimeout(() => {
            setCoinPops({});
            setTeams(prev => prev.map(t => ({ ...t, flash: null })));
        }, 1500);
    }, [questions, qIndex, eventBonus]);

    // ── Move to invest phase ─────────────────────────────────────────────────
    const goToInvest = () => {
        const evt = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
        setMarketEvent(evt);
        // Some events give bonus coins on next correct
        setEventBonus(evt.emoji === '💎' ? 50 : 0);
        setTeams(prev => prev.map(t => ({ ...t, investChoice: null })));
        setInvestTimer(10);
        setPhase('invest');
    };

    // ── Process invest choices then next question ─────────────────────────────
    const proceedToNext = useCallback(() => {
        if (qIndex + 1 >= questions.length) {
            setPhase('victory');
            fetch(`/api/game/bozor/sessions/${sessionId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'finished' }),
            });
            return;
        }
        // Apply invest choices
        setTeams(prev => prev.map(t => {
            const investing = t.investChoice === 'invest' && t.coins >= INVEST_COST;
            return {
                ...t,
                coins: investing ? t.coins - INVEST_COST : t.coins,
                investPending: investing,
                investChoice: null,
                thisAnswer: null, lastCorrect: null, justUpgraded: false,
            };
        }));
        revealedRef.current = false;
        setQIndex(i => i + 1);
        setTimer(sessionData?.timePerQ ?? 20);
        setPhase('question');
    }, [qIndex, questions.length, sessionId, sessionData]);

    // ── Answer ───────────────────────────────────────────────────────────────
    const handleAnswer = (teamIndex: number, answerIndex: number) => {
        if (phase !== 'question' || paused) return;
        setTeams(prev => prev.map(t =>
            t.index === teamIndex && t.thisAnswer === null
                ? { ...t, thisAnswer: answerIndex }
                : t
        ));
    };

    // ── Invest choice ─────────────────────────────────────────────────────────
    const handleInvestChoice = (teamIndex: number, choice: 'invest' | 'save') => {
        if (phase !== 'invest') return;
        setTeams(prev => prev.map(t =>
            t.index === teamIndex && t.investChoice === null ? { ...t, investChoice: choice } : t
        ));
    };

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

    const currentQ    = questions[qIndex];
    const isReveal    = phase === 'reveal';
    const isInvest    = phase === 'invest';
    const correctIndex = currentQ?.correctIndex ?? 0;

    // ── INTRO ─────────────────────────────────────────────────────────────────
    if (phase === 'intro') {
        return (
            <div className="fixed inset-0 overflow-hidden" style={{ background: '#1a0a00' }}>
                <Image src="/game/bozor.png" alt="bozor" fill className="object-cover opacity-60" priority />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
                    <div className="anim-slideUp">
                        <Image src={CHAR_IMGS[sessionData.character] ?? '/game/polvon.png'} alt="char"
                            width={200} height={280} className="object-contain drop-shadow-2xl"
                            style={{ filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.5))' }} />
                    </div>
                    <div className="text-center px-4 anim-slideUp" style={{ animationDelay: '0.2s' }}>
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
                    <div className="flex gap-4 mt-2 anim-slideUp" style={{ animationDelay: '0.4s' }}>
                        {teams.map(t => (
                            <div key={t.index} className="px-5 py-2 rounded-xl font-black text-sm"
                                style={{ background: t.colorBg, border: `2px solid ${t.colorHex}`, color: t.colorHex }}>
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
        return (
            <div className="fixed inset-0 overflow-hidden" style={{ background: '#1a0a00' }}>
                <Image src="/game/bozor.png" alt="bozor" fill className="object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 px-4">
                    <div className="text-8xl animate-bounce">🏆</div>
                    <h1 className="text-5xl font-black text-center anim-slideUp"
                        style={{ color: '#f59e0b', textShadow: '0 0 60px rgba(245,158,11,0.7)' }}>
                        G&apos;olib: {rankedTeams[0]?.name}!
                    </h1>
                    <div className="flex flex-col gap-3 w-full max-w-lg">
                        {rankedTeams.map((t, i) => (
                            <div key={t.index} className="flex items-center gap-4 rounded-2xl px-5 py-3 anim-slideUp"
                                style={{
                                    animationDelay: `${i * 0.1}s`,
                                    background: i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                                    border: i === 0 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                                }}>
                                <span className="text-2xl font-black w-8 text-center"
                                    style={{ color: i === 0 ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
                                    {['🥇','🥈','🥉','4️⃣'][i]}
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
                    <button onClick={() => window.location.href = window.location.href.replace(/\/[^/]+$/, '')}
                        className="mt-4 px-10 py-4 rounded-2xl font-black text-lg active:scale-95 transition-all anim-goldShine"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', color: 'white' }}>
                        🔄 Yangi o&apos;yin
                    </button>
                </div>
            </div>
        );
    }

    // ── INVEST PHASE ──────────────────────────────────────────────────────────
    if (isInvest) {
        const allChosen = teams.every(t => t.investChoice !== null);
        return (
            <div className="fixed inset-0 overflow-hidden select-none" style={{ touchAction: 'manipulation' }}>
                <Image src="/game/bozor.png" alt="bozor" fill className="object-cover" priority />
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} />

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-4">
                    {/* Market event banner */}
                    <div className="anim-slideUp text-center px-6 py-4 rounded-2xl"
                        style={{ background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.5)', backdropFilter: 'blur(8px)' }}>
                        <p className="text-4xl mb-1">{marketEvent.emoji}</p>
                        <p className="font-black text-white text-xl">{marketEvent.text}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: '#f59e0b' }}>{marketEvent.bonus}</p>
                    </div>

                    {/* Invest countdown */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl"
                            style={{ background: 'rgba(245,158,11,0.2)', border: '2px solid #f59e0b', color: '#f59e0b' }}>
                            {investTimer}
                        </div>
                        <p className="text-white/60 font-bold text-sm">Qaror qiling</p>
                        {allChosen && (
                            <button onPointerDown={proceedToNext}
                                className="px-4 py-2 rounded-xl font-black text-sm anim-goldShine"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#1a0a00' }}>
                                ▶ Davom
                            </button>
                        )}
                    </div>

                    {/* Team invest cards */}
                    <div className="flex flex-row gap-3 w-full max-w-5xl">
                        {teams.map(t => (
                            <div key={t.index} className="flex-1 rounded-2xl overflow-hidden anim-slideUp"
                                style={{ background: t.colorBg, border: `2px solid ${t.colorHex}60` }}>
                                {/* Team header */}
                                <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${t.colorHex}30` }}>
                                    <div className="relative w-8 h-7 flex-shrink-0">
                                        <Image src={SHOP_IMAGES[t.shopLevel]} alt="" fill className="object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-xs leading-none truncate" style={{ color: t.colorHex }}>{t.name}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Image src="/game/sum.png" alt="coin" width={10} height={10} className="object-contain" />
                                            <span className="font-black text-xs" style={{ color: '#f59e0b' }}>{t.coins}</span>
                                        </div>
                                    </div>
                                    {t.lastCorrect !== null && (
                                        <span className="text-lg">{t.lastCorrect ? '✅' : '❌'}</span>
                                    )}
                                </div>

                                {/* Choice buttons */}
                                <div className="p-2 flex flex-col gap-2">
                                    {t.investChoice !== null ? (
                                        <div className="text-center py-3 rounded-xl font-black text-sm"
                                            style={t.investChoice === 'invest'
                                                ? { background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '2px solid #f59e0b' }
                                                : { background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '2px solid #3b82f6' }}>
                                            {t.investChoice === 'invest' ? '💰 Investitsiya!' : '🔒 Xavfsiz'}
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onPointerDown={() => handleInvestChoice(t.index, 'invest')}
                                                disabled={t.coins < INVEST_COST}
                                                className="w-full py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-30"
                                                style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.5)', touchAction: 'manipulation' }}>
                                                💰 Investitsiya
                                                <br />
                                                <span className="font-semibold opacity-70 text-[10px]">-{INVEST_COST} → ×{INVEST_MULT} (to&apos;g&apos;ri bo&apos;lsa)</span>
                                            </button>
                                            <button
                                                onPointerDown={() => handleInvestChoice(t.index, 'save')}
                                                className="w-full py-2.5 rounded-xl font-black text-xs transition-all active:scale-95"
                                                style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)', touchAction: 'manipulation' }}>
                                                🔒 Xavfsiz saqlash
                                                <br />
                                                <span className="font-semibold opacity-70 text-[10px]">Pul saqlanadi</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── QUESTION + REVEAL ─────────────────────────────────────────────────────
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
            <button onPointerDown={() => setShowTeacherCtrl(v => !v)}
                className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-1 rounded-full text-xs font-black opacity-25 hover:opacity-70 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white', touchAction: 'manipulation' }}>
                ⚙️ {showTeacherCtrl ? 'Yopish' : 'Boshqaruv'} · {qIndex + 1}/{questions.length}
            </button>

            {showTeacherCtrl && (
                <div className="absolute top-9 left-1/2 -translate-x-1/2 z-50 flex gap-2 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', touchAction: 'manipulation' }}>
                    <button onPointerDown={() => setPaused(p => !p)} className="px-4 py-2 rounded-xl font-black text-sm"
                        style={{ background: paused ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', color: paused ? '#22c55e' : '#fbbf24' }}>
                        {paused ? '▶ Davom' : '⏸ Pauza'}
                    </button>
                    {isReveal && (
                        <button onPointerDown={goToInvest} className="px-4 py-2 rounded-xl font-black text-sm"
                            style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                            💰 Investitsiya
                        </button>
                    )}
                    {isReveal && (
                        <button onPointerDown={proceedToNext} className="px-4 py-2 rounded-xl font-black text-sm"
                            style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                            ⏭ Keyingisi
                        </button>
                    )}
                    <button onPointerDown={() => { if (timerRef.current) clearTimeout(timerRef.current); setTimer(t => t + 10); }}
                        className="px-4 py-2 rounded-xl font-black text-sm"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>+10s</button>
                    <button onPointerDown={doReveal} className="px-4 py-2 rounded-xl font-black text-sm"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>O&apos;tkazish</button>
                </div>
            )}

            {/* ── MAIN 3-ROW LAYOUT ───────────────────────────────────────── */}
            <div className="absolute inset-0 z-20 flex flex-col pt-1" style={{ paddingBottom: 0 }}>

                {/* ROW 1: Score bar (20%) */}
                <div className="flex flex-row gap-2 px-3 py-2" style={{ height: '20%', minHeight: 0 }}>
                    {teams.map(t => (
                        <ScoreCard key={t.index} team={t} isReveal={isReveal} coinPop={coinPops[t.index] ?? 0} />
                    ))}
                </div>

                {/* ROW 2: Question center (35%) */}
                <div className="flex flex-col items-center justify-center px-4 gap-2 relative" style={{ height: '35%', minHeight: 0 }}>
                    {/* Character */}
                    <div className="absolute top-0 right-3 opacity-75" style={{ width: 50, height: 64 }}>
                        <Image src={CHAR_IMGS[sessionData.character]} alt="char" fill className="object-contain object-bottom" />
                    </div>

                    <TimerRing timer={timer} timePerQ={sessionData.timePerQ} paused={paused} />

                    <div className="w-full max-w-3xl rounded-2xl px-5 py-3 text-center anim-slideUp"
                        style={{ background: 'rgba(0,0,0,0.82)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                        <p className="text-white font-black leading-snug" style={{ fontSize: 'clamp(14px, 2.4vw, 32px)' }}>
                            {currentQ?.text}
                        </p>
                    </div>

                    {isReveal && (
                        <div className="w-full max-w-3xl rounded-xl px-4 py-2 text-center anim-slideUp"
                            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.5)' }}>
                            <p className="font-black" style={{ color: '#22c55e', fontSize: 'clamp(11px, 1.4vw, 16px)' }}>
                                ✅ To&apos;g&apos;ri: {LABELS[correctIndex]}. {currentQ?.options[correctIndex]}
                            </p>
                            {currentQ?.explanation && (
                                <p className="text-white/50 font-semibold mt-0.5" style={{ fontSize: 'clamp(10px, 1.1vw, 13px)' }}>
                                    {currentQ.explanation}
                                </p>
                            )}
                        </div>
                    )}

                    {sessionData.economyOn && !isReveal && (
                        <p className="text-white/25 font-bold" style={{ fontSize: 'clamp(9px, 1vw, 12px)' }}>
                            💰 To&apos;g&apos;ri javob = +100 so&apos;m {teams.some(t => t.investPending) ? '(ba\'zi jamoalar investitsiya qilgan!)' : ''}
                        </p>
                    )}

                    {isReveal && (
                        <div className="flex gap-3">
                            <button onPointerDown={goToInvest}
                                className="px-6 py-2.5 rounded-2xl font-black transition-all active:scale-95 anim-invest"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#1a0a00', fontSize: 'clamp(12px, 1.4vw, 18px)', touchAction: 'manipulation' }}>
                                💰 Bozor vaqti
                            </button>
                            <button onPointerDown={proceedToNext}
                                className="px-6 py-2.5 rounded-2xl font-black transition-all active:scale-95"
                                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 'clamp(12px, 1.4vw, 18px)', touchAction: 'manipulation' }}>
                                {qIndex + 1 >= questions.length ? "🏆 Tugatish" : '⏭ O&apos;tkazish'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ROW 3: Answer columns (45%) */}
                <div className="flex flex-row gap-2 px-3 pb-2 pt-1" style={{ height: '45%', minHeight: 0 }}>
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
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({ team, isReveal, coinPop }: { team: TeamState; isReveal: boolean; coinPop: number }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 relative overflow-hidden"
            style={{
                background: team.colorBg,
                border: `2px solid ${team.colorHex}55`,
                animation: team.flash === 'correct' ? 'correctFlash 0.8s ease-out' : team.flash === 'wrong' ? 'wrongFlash 0.6s ease-out' : undefined,
            }}>

            <div className="relative flex-shrink-0" style={{ width: 38, height: 32 }}>
                <Image src={SHOP_IMAGES[team.shopLevel]} alt={SHOP_NAMES[team.shopLevel]} fill className="object-contain"
                    style={{ filter: team.justUpgraded ? 'drop-shadow(0 0 10px gold)' : undefined }} />
            </div>

            <p className="font-black text-center leading-none" style={{ color: team.colorHex, fontSize: 'clamp(10px, 1.3vw, 17px)' }}>
                {team.name}
            </p>
            <p className="text-white/30 font-bold" style={{ fontSize: 'clamp(8px, 0.9vw, 12px)' }}>
                {SHOP_NAMES[team.shopLevel]}
            </p>

            <div className="flex items-center gap-1 relative">
                <Image src="/game/sum.png" alt="coin" width={13} height={13} className="object-contain" />
                <span className="font-black" style={{ color: '#f59e0b', fontSize: 'clamp(12px, 1.5vw, 20px)' }}>{team.coins}</span>
                {coinPop > 0 && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 font-black whitespace-nowrap anim-coinFloat pointer-events-none"
                        style={{ color: '#22c55e', fontSize: 'clamp(11px, 1.3vw, 16px)' }}>
                        +{coinPop}
                    </span>
                )}
            </div>

            {team.combo >= 2 && (
                <div className="font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 'clamp(8px, 0.9vw, 11px)' }}>
                    🔥 {team.combo}x
                </div>
            )}

            {team.investPending && (
                <div className="font-black px-1.5 py-0.5 rounded-full anim-invest" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '9px', border: '1px solid rgba(245,158,11,0.4)' }}>
                    💰 Investitsiya
                </div>
            )}

            {team.justUpgraded && (
                <div className="absolute top-0 inset-x-0 flex justify-center">
                    <div className="font-black px-2 py-0.5 rounded-b-xl anim-upgradeIn whitespace-nowrap"
                        style={{ background: '#f59e0b', color: '#1a0a00', fontSize: '9px' }}>
                        ⬆ Yangi daraja!
                    </div>
                </div>
            )}

            {isReveal && team.lastCorrect !== null && (
                <div className="absolute top-1 right-1.5 text-base">{team.lastCorrect ? '✅' : '❌'}</div>
            )}

            {team.thisAnswer !== null && !isReveal && (
                <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: team.colorHex }} />
            )}
        </div>
    );
}

// ─── Timer Ring ───────────────────────────────────────────────────────────────

function TimerRing({ timer, timePerQ, paused }: { timer: number; timePerQ: number; paused: boolean }) {
    const pct   = (timer / timePerQ) * 100;
    const color = timer > timePerQ * 0.5 ? '#22c55e' : timer > timePerQ * 0.25 ? '#f59e0b' : '#ef4444';
    const r     = 36;
    const circ  = 2 * Math.PI * r;
    const urgent = timer <= 5 && timer > 0;
    return (
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 72, height: 72 }}>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                    style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }} />
            </svg>
            <span className={`font-black text-xl ${urgent ? 'anim-timerPulse' : ''}`} style={{ color }}>
                {paused ? '⏸' : timer}
            </span>
        </div>
    );
}

// ─── Answer Column ────────────────────────────────────────────────────────────

function AnswerColumn({ team, q, isReveal, correctIndex, onAnswer }: {
    team: TeamState; q: Question; isReveal: boolean; correctIndex: number;
    onAnswer: (teamIndex: number, answerIndex: number) => void;
}) {
    if (!team || !q) return null;
    const answered = team.thisAnswer !== null;

    const getBtnStyle = (i: number) => {
        const sel  = team.thisAnswer === i;
        const corr = i === correctIndex;
        if (isReveal) {
            if (corr)       return { background: 'rgba(34,197,94,0.4)',  border: '2px solid #22c55e', color: 'white' };
            if (sel && !corr) return { background: 'rgba(239,68,68,0.35)', border: '2px solid #ef4444', color: 'rgba(255,255,255,0.7)' };
            return { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' };
        }
        if (sel)     return { background: team.colorBg, border: `2px solid ${team.colorHex}`, color: 'white' };
        if (answered) return { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' };
        return { background: 'rgba(0,0,0,0.5)', border: `1px solid ${team.colorHex}40`, color: 'white' };
    };

    return (
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={{
                background: team.colorBg,
                border: `2px solid ${team.colorHex}40`,
                minHeight: 0,
                animation: team.flash === 'wrong' ? 'shakeX 0.5s ease' : undefined,
            }}>

            {/* Team label */}
            <div className="px-2 py-1 text-center flex-shrink-0" style={{ borderBottom: `1px solid ${team.colorHex}25` }}>
                <span className="font-black leading-none" style={{ color: team.colorHex, fontSize: 'clamp(10px, 1.2vw, 14px)' }}>
                    {answered && !isReveal
                        ? <span>✓ Javob berildi</span>
                        : team.name
                    }
                </span>
            </div>

            {/* Buttons — take remaining space equally */}
            <div className="flex flex-col flex-1 gap-1 p-1.5" style={{ minHeight: 0 }}>
                {q.options.map((opt, i) => (
                    <button
                        key={i}
                        onPointerDown={() => onAnswer(team.index, i)}
                        disabled={answered || isReveal}
                        className="flex-1 rounded-xl px-2 py-0 font-bold transition-all active:scale-95 disabled:cursor-default text-left flex items-center gap-1.5 overflow-hidden"
                        style={{
                            ...getBtnStyle(i),
                            fontSize: 'clamp(10px, 1.2vw, 15px)',
                            touchAction: 'manipulation',
                            minHeight: 0,
                            lineHeight: 1.2,
                        }}
                    >
                        <span className="font-black flex-shrink-0 w-5 text-center" style={{ fontSize: 'clamp(11px, 1.4vw, 17px)' }}>
                            {LABELS[i]}
                        </span>
                        <span className="overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                            {opt}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
