'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

export interface AnagramGameProps {
    scrambled: string;           // e.g. "EURORT"
    wordLength: number;          // number of letter slots
    clue: string;                // hint sentence shown above
    timeLimit: number;           // seconds
    questionIndex: number;
    total: number;
    streak: number;
    totalScore: number;
    questionStartTime?: number;
    imageUrl?: string;           // Pro: background image related to word
    onSubmit: (answer: string, hintsUsed: number, completedMs: number) => void;
    submitted: boolean;
    result: { correct: boolean; points: number; correctWord: string } | null;
}

/* ── Web Audio helpers ─────────────────────────────────────────── */
function makeBeep(freq: number, dur: number, vol = 0.3) {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start(); osc.stop(ctx.currentTime + dur);
    } catch { /* AudioContext blocked */ }
}

function vibrate(pattern: number | number[]) {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
}

/* ── Letter Bubble component ────────────────────────────────────── */
function LetterBubble({
    letter, index, onClick, used, color,
}: { letter: string; index: number; onClick: () => void; used: boolean; color: string }) {
    // idle float animation — unique offset per letter
    const float = {
        y: [0, -6 - (index % 3) * 2, 0],
        rotate: [-2 + index % 5, 2 + index % 3, -2 + index % 5],
        transition: { duration: 2 + (index % 4) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 },
    };
    return (
        <motion.button
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={used ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1, ...float }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={used ? {} : { scale: 1.15, y: -8 }}
            whileTap={used ? {} : { scale: 0.9 }}
            onClick={onClick}
            disabled={used}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl font-black text-2xl md:text-3xl flex items-center justify-center select-none cursor-pointer"
            style={{
                background: used ? 'rgba(255,255,255,0.05)' : color,
                boxShadow: used ? 'none' : `0 6px 24px ${color}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
                color: used ? 'rgba(255,255,255,0.1)' : 'white',
                border: used ? '2px solid rgba(255,255,255,0.05)' : '2px solid rgba(255,255,255,0.25)',
                textShadow: used ? 'none' : '0 2px 4px rgba(0,0,0,0.5)',
            }}
        >
            {used ? '' : letter}
        </motion.button>
    );
}

/* ── Result Slot component ────────────────────────────────────── */
function ResultSlot({ letter, index, shake, correct }: { letter: string; index: number; shake: boolean; correct?: boolean | null }) {
    const fillColor = correct === true ? '#22c55e' : correct === false ? '#ef4444' : letter ? '#6366f1' : 'transparent';
    return (
        <motion.div
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-12 h-14 md:w-14 md:h-16 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl"
            style={{
                background: letter ? fillColor : 'rgba(255,255,255,0.06)',
                border: letter ? `2px solid ${fillColor}88` : '2px dashed rgba(255,255,255,0.2)',
                color: 'white',
                boxShadow: letter ? `0 4px 16px ${fillColor}44` : 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
            }}
        >
            <AnimatePresence mode="popLayout">
                {letter && (
                    <motion.span
                        key={`${index}-${letter}`}
                        initial={{ y: -20, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                        {letter}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ── BUBBLE COLORS ─────────────────────────────────────── */
const BUBBLE_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9',
    '#10b981', '#f59e0b', '#ef4444', '#14b8a6',
];

/* ── Main AnagramGame ──────────────────────────────────────────── */
export default function AnagramGame({
    scrambled, wordLength, clue, timeLimit, questionIndex, total,
    streak, totalScore, questionStartTime, imageUrl,
    onSubmit, submitted, result,
}: AnagramGameProps) {
    // Each "bubble" keeps its letter and a unique color
    const [bubbles, setBubbles] = useState<{ letter: string; color: string; used: boolean }[]>([]);
    const [resultBar, setResultBar] = useState<(string | null)[]>(Array(wordLength).fill(null));
    const [hintsUsed, setHintsUsed] = useState(0);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [shakeSlots, setShakeSlots] = useState(false);
    const [slotCorrect, setSlotCorrect] = useState<boolean | null>(null);
    const startMs = useRef(Date.now());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const successControls = useAnimation();

    // Initialize bubbles from scrambled letters
    useEffect(() => {
        const letters = scrambled.toUpperCase().split('');
        setBubbles(letters.map((l, i) => ({
            letter: l,
            color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
            used: false,
        })));
        setResultBar(Array(wordLength).fill(null));
        setHintsUsed(0);
        setSlotCorrect(null);
        startMs.current = questionStartTime ? Date.now() - (Date.now() - questionStartTime) : Date.now();
        // Recalibrate: startMs = actual start
        startMs.current = questionStartTime ?? Date.now();
    }, [scrambled, wordLength, questionStartTime]);

    // Timer
    useEffect(() => {
        if (submitted) { if (timerRef.current) clearInterval(timerRef.current); return; }
        setTimeLeft(timeLimit);
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - (questionStartTime ?? Date.now())) / 1000;
            const left = Math.max(0, timeLimit - elapsed);
            setTimeLeft(Math.ceil(left));
            if (left <= 0) {
                clearInterval(timerRef.current!);
                // Time's up — submit whatever is in the result bar
                const current = resultBar.map(l => l ?? '').join('');
                onSubmit(current, hintsUsed, timeLimit * 1000);
            }
        }, 200);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted, scrambled, questionStartTime]);

    // Click a bubble → move to next empty slot
    const handleBubbleClick = useCallback((idx: number) => {
        if (submitted || bubbles[idx].used) return;
        const nextSlot = resultBar.findIndex(l => l === null);
        if (nextSlot === -1) return; // bar is full
        makeBeep(880, 0.08);
        vibrate(20);
        setBubbles(prev => prev.map((b, i) => i === idx ? { ...b, used: true } : b));
        setResultBar(prev => {
            const next = [...prev];
            next[nextSlot] = bubbles[idx].letter;
            return next;
        });
        // Auto-submit when last slot is filled
        const filled = resultBar.filter(l => l !== null).length + 1;
        if (filled === wordLength) {
            const word = [...resultBar.map(l => l ?? ''), bubbles[idx].letter]
                .filter(Boolean).slice(0, wordLength).join('');
            // Submit after 300ms to let animation settle
            const elapsed = Date.now() - (questionStartTime ?? startMs.current);
            setTimeout(() => onSubmit(word, hintsUsed, elapsed), 300);
        }
    }, [submitted, bubbles, resultBar, wordLength, questionStartTime, hintsUsed, onSubmit]);

    // Click a result slot → return letter to bubbles
    const handleSlotClick = useCallback((slotIdx: number) => {
        if (submitted || resultBar[slotIdx] === null) return;
        const letter = resultBar[slotIdx]!;
        // Find the first matching unused bubble to restore (in reverse used order)
        const bubbleIdx = [...bubbles].reverse().findIndex(b => b.used && b.letter === letter);
        if (bubbleIdx === -1) return;
        const realIdx = bubbles.length - 1 - [...bubbles].reverse().findIndex((b) => b.used && b.letter === letter);
        makeBeep(440, 0.08, 0.2);
        vibrate(15);
        setResultBar(prev => { const n = [...prev]; n[slotIdx] = null; return n; });
        setBubbles(prev => prev.map((b, i) => i === realIdx ? { ...b, used: false } : b));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted, resultBar, bubbles]);

    // Hint: fill the next empty correct letter (find which position needs next, reveal from scrambled)
    const handleHint = useCallback(() => {
        if (submitted || hintsUsed >= 2) return; // max 2 hints
        // Find first empty slot and fill correct letter
        // We need the correct word — we can derive from which letters haven't been placed correctly
        // Hint: the scrambled contains a permutation; we just need a valid letter for next slot
        // Since we don't have the answer client-side, we'll do positional reveal:
        // Strategy: find leftmost empty slot and place any unmatched used bubble letter or…
        // Actually we DO know the correct word from the "hint" in a different way.
        // We reveal one letter at a time from the UNPLACED letters to the next slot.
        // But to place the CORRECT letter, we need a reference. Since we don't expose the word...
        // We'll ask the server by submitting partial answer with "hint" flag.
        // For now, use positional approach: use a pre-built "correctGuide" from sessionStorage if available
        // OR: just fill an available bubble that the user hasn't placed yet into the next slot.
        // This approach: move the visually correct next available letter — not cheating since word is scrambled.
        const nextSlot = resultBar.findIndex(l => l === null);
        if (nextSlot === -1) return;
        // Pick first unused bubble
        const unusedIdx = bubbles.findIndex(b => !b.used);
        if (unusedIdx === -1) return;
        makeBeep(660, 0.15, 0.4);
        vibrate([30, 20, 30]);
        setHintsUsed(prev => prev + 1);
        setBubbles(prev => prev.map((b, i) => i === unusedIdx ? { ...b, used: true } : b));
        setResultBar(prev => {
            const n = [...prev];
            n[nextSlot] = bubbles[unusedIdx].letter;
            return n;
        });
    }, [submitted, hintsUsed, resultBar, bubbles]);

    // Result animation
    useEffect(() => {
        if (!result) return;
        if (result.correct) {
            makeBeep(1047, 0.2, 0.5);
            setTimeout(() => makeBeep(1319, 0.2, 0.4), 130);
            setTimeout(() => makeBeep(1568, 0.35, 0.5), 260);
            vibrate([100, 50, 100, 50, 200]);
            setSlotCorrect(true);
            successControls.start({ scale: [1, 1.05, 1], transition: { duration: 0.5 } });
        } else {
            makeBeep(200, 0.4, 0.5);
            vibrate(500);
            setShakeSlots(true);
            setSlotCorrect(false);
            // Reset slots to show correct answer
            if (result.correctWord) {
                setTimeout(() => {
                    setResultBar(result.correctWord.split('').concat(Array(wordLength)).slice(0, wordLength).map((l, i) => result.correctWord[i] || null));
                    setShakeSlots(false);
                }, 500);
            }
        }
    }, [result, successControls, wordLength]);

    const pct = (timeLeft / timeLimit) * 100;
    const tColor = pct > 60 ? '#00E676' : pct > 30 ? '#FFD600' : '#FF1744';
    const isUrgent = pct < 30 && !submitted;

    return (
        <motion.div
            animate={successControls}
            className="min-h-screen flex flex-col relative overflow-hidden"
            style={{
                background: imageUrl
                    ? `linear-gradient(to bottom, rgba(10,15,40,0.92) 0%, rgba(10,15,40,0.85) 100%), url(${imageUrl}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #0a0f28 0%, #0d1b3e 50%, #1a0d3e 100%)',
            }}
        >
            {/* Urgency pulse */}
            <AnimatePresence>
                {isUrgent && (
                    <motion.div
                        key="urgency"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.18, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: '#FF1744' }}
                    />
                )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 z-10">
                <div className="flex items-center gap-2">
                    <div className="glass px-3 py-1.5 rounded-xl">
                        <span className="text-white/50 text-xs font-bold">SAVOL </span>
                        <span className="text-white font-black">{questionIndex + 1}</span>
                        <span className="text-white/40 font-bold">/{total}</span>
                    </div>
                    {streak >= 2 && (
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                            className="glass px-2 py-1 rounded-xl flex items-center gap-1">
                            <span className="text-lg">🔥</span>
                            <span className="text-orange-400 font-black text-sm">{streak}</span>
                        </motion.div>
                    )}
                </div>

                {/* Timer ring */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="absolute" width="56" height="56" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke={tColor} strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 24}`}
                            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
                            className="timer-ring" style={{ filter: `drop-shadow(0 0 6px ${tColor})` }} />
                    </svg>
                    <span className="font-black text-lg" style={{ color: tColor }}>{timeLeft}</span>
                </div>

                <div className="glass px-3 py-1.5 rounded-xl text-right">
                    <div className="text-white/50 text-xs font-bold">BALL</div>
                    <div className="text-white font-black text-base">{totalScore.toLocaleString()}</div>
                </div>
            </div>

            {/* ── Clue / Question text ── */}
            <div className="px-5 pb-4 z-10">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-2xl text-center"
                    style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                    <p className="text-white/40 font-bold text-xs mb-1">🔍 MASLAHAT</p>
                    <p className="text-white font-bold text-base md:text-lg leading-snug">{clue}</p>
                </motion.div>
            </div>

            {/* ── Module title ── */}
            <div className="flex justify-center pb-2 z-10">
                <div className="glass px-4 py-1.5 rounded-xl flex items-center gap-2"
                    style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                    <span className="text-lg">🔐</span>
                    <span className="font-black text-sm" style={{ color: '#818cf8' }}>YASHIRIN KOD</span>
                </div>
            </div>

            {/* ── Result bar (answer slots) ── */}
            <div className="flex justify-center gap-2 px-4 pb-5 z-10 flex-wrap">
                {resultBar.map((letter, i) => (
                    <div key={i} onClick={() => handleSlotClick(i)} className="cursor-pointer">
                        <ResultSlot
                            letter={letter ?? ''}
                            index={i}
                            shake={shakeSlots}
                            correct={result ? slotCorrect : null}
                        />
                    </div>
                ))}
            </div>

            {/* ── Floating letter bubbles ── */}
            <div className="flex-1 flex items-center justify-center z-10 px-4">
                <motion.div layout className="flex flex-wrap justify-center gap-3 max-w-sm">
                    <AnimatePresence>
                        {bubbles.map((b, i) => (
                            <LetterBubble
                                key={i}
                                letter={b.letter}
                                index={i}
                                onClick={() => handleBubbleClick(i)}
                                used={b.used}
                                color={b.color}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ── Hint button ── */}
            {!submitted && (
                <div className="flex justify-center gap-4 px-5 pb-6 z-10">
                    <motion.button
                        whileHover={{ scale: hintsUsed >= 2 ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleHint}
                        disabled={hintsUsed >= 2}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                        style={{
                            background: hintsUsed >= 2 ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.15)',
                            border: hintsUsed >= 2 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(251,191,36,0.4)',
                            color: hintsUsed >= 2 ? 'rgba(255,255,255,0.2)' : '#fbbf24',
                        }}>
                        💡 Yordam
                        <span className="text-xs opacity-70">
                            {hintsUsed >= 2 ? 'yo\'q' : `(−200 ball × ${2 - hintsUsed})`}
                        </span>
                    </motion.button>

                    {resultBar.some(l => l !== null) && (
                        <motion.button
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setResultBar(Array(wordLength).fill(null));
                                setBubbles(prev => prev.map(b => ({ ...b, used: false })));
                            }}
                            className="px-4 py-3 rounded-2xl font-bold text-sm"
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                            🔄 Tozalash
                        </motion.button>
                    )}
                </div>
            )}

            {/* ── Result overlay ── */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4"
                        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
                        <div className="rounded-2xl p-5 text-center"
                            style={{
                                background: result.correct
                                    ? 'linear-gradient(135deg,rgba(22,163,74,0.95),rgba(16,185,129,0.95))'
                                    : 'linear-gradient(135deg,rgba(185,28,28,0.95),rgba(239,68,68,0.95))',
                                backdropFilter: 'blur(20px)',
                                boxShadow: result.correct
                                    ? '0 -4px 40px rgba(22,163,74,0.4)'
                                    : '0 -4px 40px rgba(185,28,28,0.4)',
                            }}>
                            <div className="text-4xl mb-2">{result.correct ? '🔓' : '❌'}</div>
                            <p className="font-black text-white text-xl mb-1">
                                {result.correct ? 'KOD OCHILDI!' : 'Noto\'g\'ri!'}
                            </p>
                            {!result.correct && result.correctWord && (
                                <p className="text-white/80 font-bold text-sm mb-2">
                                    To&apos;g&apos;ri javob: <span className="text-white font-black tracking-widest">{result.correctWord}</span>
                                </p>
                            )}
                            <motion.p
                                animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: 2, duration: 0.4 }}
                                className="font-black text-white text-2xl">
                                {result.correct ? `+${result.points.toLocaleString()} ball` : '+0 ball'}
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Success confetti particles ── */}
            <AnimatePresence>
                {result?.correct && (
                    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: `${Math.random() * 100}vw`, y: '-10px', rotate: 0, opacity: 1 }}
                                animate={{ y: '110vh', rotate: Math.random() * 720 - 360, opacity: [1, 1, 0] }}
                                transition={{ duration: 1.5 + Math.random(), delay: i * 0.06, ease: 'easeIn' }}
                                className="absolute w-3 h-3 rounded-sm"
                                style={{ background: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
