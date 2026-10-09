'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { serverNow } from '@/lib/serverClock';
import { formatClock } from './utils';

export interface EngPublicQuestion { q: string; options: string[] | null; topic: string | null }

interface ArenaState {
    startedAt: number | null; durationSec: number; taskCount: number; playerCount: number;
    me: { solved: number; rank: number } | null;
    question?: EngPublicQuestion | null; attempts?: number;
}

type Feedback = { correct: boolean; answer: string; explain: string | null; given: string } | null;

const OPTION_STYLES = [
    'linear-gradient(135deg,#ef4444,#b91c1c)', 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    'linear-gradient(135deg,#f59e0b,#b45309)', 'linear-gradient(135deg,#22c55e,#15803d)',
];
const WRONG_PAUSE_MS = 2500;

/** Gapdagi "___" ni ajratib ko'rsatadi. */
function Sentence({ text, fill, ok }: { text: string; fill?: string; ok?: boolean }) {
    const parts = text.split('___');
    return (
        <>
            {parts.map((p, i) => (
                <span key={i}>
                    {p}
                    {i < parts.length - 1 && (
                        <span className={`inline-block min-w-[70px] mx-1 px-2 rounded-lg border-b-4 ${fill ? (ok ? 'border-emerald-400 text-emerald-300' : 'border-red-400 text-red-300') : 'border-sky-400 text-sky-300'}`}>
                            {fill ?? ' '}
                        </span>
                    )}
                </span>
            ))}
        </>
    );
}

export default function EnglishArena({ state, pin, playerId, onChange }: {
    state: ArenaState; pin: string; playerId: string; onChange: () => void;
}) {
    const [question, setQuestion] = useState(state.question ?? null);
    const [attempt, setAttempt] = useState(state.attempts ?? 0);
    const [solved, setSolved] = useState(state.me?.solved ?? 0);
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [typed, setTyped] = useState('');
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const [streak, setStreak] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const goal = state.taskCount;

    useEffect(() => { const t = setInterval(() => setNow(serverNow()), 500); return () => clearInterval(t); }, []);

    // Server holati oldinga ketgan bo'lsa (masalan, sahifa qayta ochilgan) — moslashamiz
    useEffect(() => {
        if (busy || feedback) return;
        if ((state.attempts ?? 0) > attempt) {
            setAttempt(state.attempts ?? 0);
            setQuestion(state.question ?? null);
            setSolved(state.me?.solved ?? 0);
        } else if (!question && state.question) {
            setQuestion(state.question);
        }
    }, [state.attempts, state.question, state.me?.solved, attempt, busy, feedback, question]);

    useEffect(() => { if (question && !question.options) inputRef.current?.focus(); }, [question]);

    const submit = useCallback(async (answer: string) => {
        if (busy || feedback || !question || !answer.trim()) return;
        setBusy(true);
        try {
            const res = await fetch('/api/code-race/answer', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, playerId, attempt, answer }),
            });
            const data = await res.json();
            if (data.ended || data.finished) { onChange(); return; }
            if (data.stale) {
                setAttempt(data.attempts); setSolved(data.solved); setQuestion(data.question);
                return;
            }
            if (!res.ok) return;
            setSolved(data.solved);
            setFeedback({ correct: data.correct, answer: data.answer, explain: data.explain, given: answer });
            const next = () => {
                setFeedback(null); setTyped('');
                setAttempt(data.attempts); setQuestion(data.question);
            };
            if (data.correct) {
                setStreak(s => s + 1);
                if (navigator.vibrate) navigator.vibrate(40);
                if (data.finished) {
                    confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
                    setTimeout(onChange, 1200);
                } else {
                    setTimeout(next, 650);
                }
            } else {
                setStreak(0);
                if (navigator.vibrate) navigator.vibrate(250);
                setTimeout(next, WRONG_PAUSE_MS);
            }
        } catch {
            /* tarmoq uzildi — tugma qayta bosilishi mumkin */
        } finally {
            setBusy(false);
        }
    }, [busy, feedback, question, pin, playerId, attempt, onChange]);

    // Klaviatura: 1–4 variant tanlaydi
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!question?.options || feedback) return;
            const n = Number(e.key);
            if (n >= 1 && n <= question.options.length) submit(question.options[n - 1]);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [question, feedback, submit]);

    const remaining = (state.startedAt ?? 0) + state.durationSec * 1000 - now;
    const progress = Math.min(solved / Math.max(goal, 1), 1);

    return (
        <div className="min-h-screen bg-[#070b18] text-white p-4 md:p-6 flex flex-col">
            <div className="max-w-3xl w-full mx-auto flex flex-col gap-4 flex-1">
                {/* Yo'l: start → finish */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: 'linear-gradient(90deg,#0ea5e9,#22c55e)' }}
                            animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
                        <motion.span className="absolute top-1/2 text-2xl" style={{ y: '-50%', x: '-50%' }}
                            animate={{ left: `${Math.max(progress * 100, 4)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>🏎️</motion.span>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">🏁</span>
                    </div>
                    <div className={`px-3 py-2 rounded-xl font-black tabular-nums ${remaining < 60_000 ? 'bg-red-500/20 text-red-300' : 'bg-white/5'}`}>⏱ {formatClock(remaining)}</div>
                </div>
                <div className="flex justify-between text-sm font-black text-white/60">
                    <span>✅ {solved}/{goal}</span>
                    {streak >= 3 && <span className="text-orange-300">🔥 {streak} ketma-ket!</span>}
                    <span>O&apos;rningiz <span className="text-yellow-300">#{state.me?.rank ?? '–'}</span> / {state.playerCount}</span>
                </div>

                {/* Savol */}
                <AnimatePresence mode="wait">
                    {question && (
                        <motion.div key={attempt} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.2 }}
                            className={`relative rounded-3xl p-6 md:p-8 border-2 transition-colors ${feedback ? (feedback.correct ? 'border-emerald-400 bg-emerald-500/10' : 'border-red-400 bg-red-500/10') : 'border-white/10 bg-white/[0.04]'}`}>
                            {question.topic && <p className="text-sky-400 text-xs font-black uppercase tracking-widest mb-3">{question.topic}</p>}
                            <p className="text-2xl md:text-3xl font-bold leading-relaxed">
                                <Sentence text={question.q} fill={feedback ? (feedback.correct ? feedback.given : feedback.answer) : undefined} ok={!!feedback} />
                            </p>
                            {feedback && !feedback.correct && (
                                <div className="mt-4 rounded-xl bg-black/30 p-3 text-sm">
                                    <p className="font-black text-red-300">❌ Sizning javobingiz: <s>{feedback.given}</s> → to&apos;g&apos;risi: <span className="text-emerald-300">{feedback.answer}</span></p>
                                    {feedback.explain && <p className="text-white/70 mt-1">💡 {feedback.explain}</p>}
                                </div>
                            )}
                            {feedback?.correct && <p className="absolute right-5 top-4 text-3xl font-black text-emerald-300">+1</p>}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Javob */}
                {question?.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options.map((o, i) => {
                            const picked = feedback?.given === o;
                            const right = feedback && o === feedback.answer;
                            return (
                                <button key={o} onClick={() => submit(o)} disabled={!!feedback || busy}
                                    className="relative py-5 px-4 rounded-2xl text-xl font-black text-left transition-transform active:scale-95 disabled:cursor-default"
                                    style={{
                                        background: OPTION_STYLES[i % 4],
                                        opacity: feedback && !picked && !right ? 0.35 : 1,
                                        outline: right ? '4px solid #4ade80' : picked ? '4px solid #f87171' : 'none',
                                    }}>
                                    <span className="text-white/50 text-sm mr-2">{i + 1}</span>{o}
                                </button>
                            );
                        })}
                    </div>
                ) : question && (
                    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); submit(typed); }}>
                        <input ref={inputRef} value={typed} onChange={e => setTyped(e.target.value)} disabled={!!feedback}
                            autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Javobni yozing..."
                            className="flex-1 bg-white/5 border-2 border-white/15 rounded-2xl px-5 py-4 text-xl font-bold outline-none focus:border-sky-400" />
                        <button disabled={!typed.trim() || !!feedback || busy} className="px-6 rounded-2xl text-lg font-black disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)' }}>➜</button>
                    </form>
                )}
                {!question && <p className="text-center text-white/50 font-bold">⏳ Yuklanmoqda...</p>}
            </div>
        </div>
    );
}
