'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlitzGameProps {
    text: string;
    timeLimit: number;               // seconds (3–5)
    questionIndex: number;
    total: number;
    streak: number;
    totalScore: number;
    questionStartTime?: number;
    isPro?: boolean;
    distractionMode?: boolean;
    onAnswer: (optionIndex: number) => void;
    answered: boolean;
    lastResult: { correct: boolean; points: number } | null;
}

// Web Audio beep
function beep(freq: number, dur: number, vol = 0.4) {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start(); osc.stop(ctx.currentTime + dur);
    } catch { }
}

function vibrate(pattern: number | number[]) {
    try { if ('vibrate' in navigator) navigator.vibrate(pattern); } catch { }
}

export default function BlitzGame({
    text, timeLimit, questionIndex, total, streak, totalScore,
    questionStartTime, isPro = false, onAnswer, answered, lastResult,
}: BlitzGameProps) {
    const elapsed = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
    const [timeLeft, setTimeLeft] = useState(Math.max(1, timeLimit - elapsed));
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
    const [swapped, setSwapped] = useState(false);
    const [hidden, setHidden] = useState(false);
    const beeped = useRef(false);

    // Countdown timer
    useEffect(() => {
        beeped.current = false;
        const start = questionStartTime || Date.now();
        const tick = () => {
            const rem = Math.max(0, timeLimit - Math.floor((Date.now() - start) / 1000));
            setTimeLeft(rem);
            if (rem <= 1 && !beeped.current) { beep(220, 0.3); beeped.current = true; }
            else if (rem <= 2) beep(440, 0.15);
        };
        tick();
        timerRef.current = setInterval(tick, 500);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [questionIndex, timeLimit, questionStartTime]);

    // Result flash
    useEffect(() => {
        if (!lastResult) return;
        setFlash(lastResult.correct ? 'correct' : 'wrong');
        vibrate(lastResult.correct ? [40, 20, 40] : 200);
        const t = setTimeout(() => setFlash(null), 600);
        return () => clearTimeout(t);
    }, [lastResult]);

    // Distraction Mode (Pro, streak ≥ 5) — 30% chance swap/hide
    useEffect(() => {
        if (!isPro || streak < 5 || answered) return;
        if (Math.random() > 0.30) return;
        setHidden(true);
        const t1 = setTimeout(() => { setHidden(false); setSwapped(s => !s); }, 500);
        const t2 = setTimeout(() => setSwapped(false), 1300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [questionIndex, isPro, streak, answered]);

    const pct = (timeLeft / timeLimit) * 100;
    const tColor = timeLeft > timeLimit * 0.6 ? '#00E676' : timeLeft > timeLimit * 0.3 ? '#FFD600' : '#FF1744';
    const bgPulse = timeLeft <= Math.ceil(timeLimit * 0.4);

    const handleTap = useCallback((idx: number) => {
        if (answered) return;
        vibrate(40);
        beep(880, 0.1);
        onAnswer(swapped ? (idx === 0 ? 1 : 0) : idx);
    }, [answered, swapped, onAnswer]);

    const leftBtn = swapped
        ? { label: "NOTO'G'RI", emoji: '❌', bg: 'linear-gradient(160deg,#b91c1c,#ef4444)', idx: 1 }
        : { label: "TO'G'RI", emoji: '✅', bg: 'linear-gradient(160deg,#15803d,#22c55e)', idx: 0 };
    const rightBtn = swapped
        ? { label: "TO'G'RI", emoji: '✅', bg: 'linear-gradient(160deg,#15803d,#22c55e)', idx: 0 }
        : { label: "NOTO'G'RI", emoji: '❌', bg: 'linear-gradient(160deg,#b91c1c,#ef4444)', idx: 1 };

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden select-none"
            style={{ background: '#080f1a', touchAction: 'none' }}>

            {/* Pulsing background urgency */}
            <AnimatePresence>
                {bgPulse && (
                    <motion.div className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }} animate={{ opacity: [0, 0.18, 0] }}
                        transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
                        style={{ background: 'radial-gradient(ellipse at center, #FF1744 0%, transparent 70%)' }} />
                )}
            </AnimatePresence>

            {/* Flash overlay */}
            <AnimatePresence>
                {flash && (
                    <motion.div className="absolute inset-0 pointer-events-none z-50"
                        initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
                        style={{ background: flash === 'correct' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.4)' }} />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0 z-10"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3">
                    <div className="glass-blue px-3 py-1 rounded-xl">
                        <span className="text-white/50 font-bold text-sm">⚡ </span>
                        <span className="text-white font-extrabold">{questionIndex + 1}</span>
                        <span className="text-white/40 font-bold"> / {total}</span>
                    </div>
                    {streak >= 2 && (
                        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}
                            className="flex items-center gap-1 px-2 py-1 rounded-xl"
                            style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.4)' }}>
                            <span className="text-lg">🔥</span>
                            <span className="text-orange-400 font-black text-sm">{streak}</span>
                        </motion.div>
                    )}
                </div>

                {/* Timer ring */}
                <div className="relative flex items-center justify-center" style={{ width: 54, height: 54 }}>
                    <svg width="54" height="54" className="-rotate-90">
                        <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                        <circle cx="27" cy="27" r="22" fill="none" stroke={tColor} strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                            style={{ transition: 'stroke-dashoffset 0.5s linear', filter: `drop-shadow(0 0 6px ${tColor})` }} />
                    </svg>
                    <span className="absolute font-black text-base" style={{ color: tColor }}>{timeLeft}</span>
                </div>

                <div className="text-right">
                    <p className="text-white/30 font-bold text-xs">BALL</p>
                    <p className="text-white font-black text-lg">{totalScore.toLocaleString()}</p>
                </div>
            </div>

            {/* Statement */}
            <div className="flex-1 flex items-center justify-center px-6 z-10">
                <div className="text-center space-y-4 max-w-lg w-full">
                    <div className="glass px-2 py-1 rounded-xl inline-block">
                        <span className="text-white/40 font-black text-xs tracking-widest">⚡ BLIZ-SOHAT</span>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p key={questionIndex}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="text-white font-black leading-snug"
                            style={{ fontSize: text.length > 80 ? '1.2rem' : text.length > 50 ? '1.5rem' : '1.8rem' }}>
                            {text}
                        </motion.p>
                    </AnimatePresence>
                    {/* Result feedback */}
                    <AnimatePresence>
                        {lastResult && (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center gap-2">
                                <span className="text-3xl">{lastResult.correct ? '✅' : '❌'}</span>
                                {lastResult.correct && (
                                    <span className="font-black text-green-400 text-xl">+{lastResult.points}</span>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* THE BIG BUTTONS */}
            <AnimatePresence>
                {!hidden && (
                    <motion.div className="grid grid-cols-2 shrink-0 z-10" style={{ height: '42vh', minHeight: 160 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {[leftBtn, rightBtn].map((btn) => (
                            <motion.button key={btn.label}
                                onPointerDown={() => handleTap(btn.idx)}
                                disabled={answered}
                                whileTap={{ scale: 0.95 }}
                                className="flex flex-col items-center justify-center gap-3 font-black text-white select-none outline-none"
                                style={{
                                    background: btn.bg,
                                    opacity: answered ? 0.5 : 1,
                                    fontSize: '1.6rem',
                                    letterSpacing: '-0.02em',
                                    userSelect: 'none',
                                    WebkitTapHighlightColor: 'transparent',
                                    boxShadow: answered ? 'none' : 'inset 0 -4px 0 rgba(0,0,0,0.25)',
                                }}>
                                <span style={{ fontSize: '2.5rem' }}>{btn.emoji}</span>
                                <span>{btn.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Answered waiting */}
            {answered && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                    <motion.p animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }}
                        className="text-white/40 font-bold text-sm">
                        ⏳ Keyingi savol kutilmoqda...
                    </motion.p>
                </div>
            )}

            {/* Distraction mode hint (Pro) */}
            {isPro && swapped && (
                <div className="absolute top-20 left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <div className="glass px-3 py-1 rounded-xl">
                        <span className="text-yellow-400 font-black text-xs">😈 Tugmalar almashtirildi!</span>
                    </div>
                </div>
            )}
        </div>
    );
}
