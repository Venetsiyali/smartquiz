'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry { nickname: string; avatar: string; score: number; streak: number; rank: number; }
interface QuestionPayload { questionIndex: number; total: number; text: string; options: string[]; timeLimit: number; imageUrl?: string; questionStartTime?: number; }
interface QuestionEndPayload { correctOptions: number[]; explanation?: string | null; options: string[]; leaderboard: LeaderboardEntry[]; isLastQuestion: boolean; }
interface Badge { nickname: string; avatar: string; badge: string; icon: string; desc: string; }
interface GameEndPayload { leaderboard: LeaderboardEntry[]; badges: Badge[]; }

const OPTION_COLORS = [
    { cls: 'btn-red', icon: '🔴', label: 'A' }, { cls: 'btn-blue', icon: '🔵', label: 'B' },
    { cls: 'btn-yellow', icon: '🟡', label: 'C' }, { cls: 'btn-green', icon: '🟢', label: 'D' },
];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const RANK_COLORS = ['#FFD600', '#C0C0C0', '#CD7F32', ...Array(7).fill('rgba(255,255,255,0.25)')];

function fireConfetti() {
    const end = Date.now() + 3500;
    const colors = ['#0056b3', '#FFD600', '#00E676', '#FF1744', '#ffffff'];
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();
}

export default function TeacherGamePage() {
    const router = useRouter();
    const pinRef = useRef<string | null>(null);
    const [phase, setPhase] = useState<'loading' | 'question' | 'leaderboard' | 'badges' | 'ended'>('loading');
    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [questionEnd, setQuestionEnd] = useState<QuestionEndPayload | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const channelRef = useRef<any>(null);
    const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([]);

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const startTimer = useCallback((seconds: number, pin: string) => {
        clearTimer();
        setTimeLeft(seconds);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearTimer();
                    fetch('/api/game/end-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        const pin = sessionStorage.getItem('gamePin');
        if (!pin) { router.push('/teacher/create'); return; }
        pinRef.current = pin;
        const pusher = getPusherClient();
        channelRef.current = pusher.subscribe(`game-${pin}`);

        channelRef.current.bind('question-start', (payload: QuestionPayload) => {
            setQuestion(payload); setPhase('question'); setQuestionEnd(null);
            startTimer(payload.timeLimit, pin);
        });
        channelRef.current.bind('question-end', (payload: QuestionEndPayload) => {
            clearTimer(); setQuestionEnd(payload); setPhase('leaderboard');
        });
        channelRef.current.bind('game-end', (payload: GameEndPayload) => {
            clearTimer(); setFinalLeaderboard(payload.leaderboard); setBadges(payload.badges || []); setPhase('badges');
            setTimeout(fireConfetti, 300);
        });
        channelRef.current.bind('pusher:subscription_succeeded', () => {
            fetch('/api/game/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
        });

        return () => { pusher.unsubscribe(`game-${pin}`); clearTimer(); };
    }, [router, startTimer]);

    const handleNext = async () => {
        const pin = pinRef.current; if (!pin) return;
        await fetch('/api/game/next', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    };

    const pct = question ? (timeLeft / question.timeLimit) * 100 : 100;
    const tColor = !question ? '#0056b3' : timeLeft > question.timeLimit * 0.6 ? '#00E676' : timeLeft > question.timeLimit * 0.3 ? '#FFD600' : '#FF1744';

    /* ── Loading ── */
    if (phase === 'loading') return (
        <div className="bg-host min-h-screen flex items-center justify-center">
            <div className="text-center glass p-14 rounded-3xl">
                <div className="text-7xl mb-5 animate-spin-slow">⚡</div>
                <p className="text-white/50 font-bold text-2xl">O&apos;yin boshlanmoqda...</p>
            </div>
        </div>
    );

    /* ── Question Phase ── */
    if (phase === 'question' && question) return (
        <div className="bg-host min-h-screen flex flex-col">
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-white font-black text-lg">Zukk<span className="logo-z">oo</span></span>
                    <div className="glass-blue px-4 py-1.5 rounded-xl">
                        <span className="text-white/50 font-bold text-sm">Savol </span>
                        <span className="text-white font-extrabold">{question.questionIndex + 1}</span>
                        <span className="text-white/40 font-bold"> / {question.total}</span>
                    </div>
                </div>
                {/* Timer ring */}
                <div className="relative">
                    <svg width="90" height="90" className="-rotate-90">
                        <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                        <circle cx="45" cy="45" r="38" fill="none" stroke={tColor} strokeWidth="7" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 38}`}
                            strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct / 100)}`}
                            className="timer-ring" style={{ filter: `drop-shadow(0 0 10px ${tColor})` }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-black" style={{ color: tColor }}>{timeLeft}</span>
                </div>
                <div className="glass px-5 py-2 rounded-xl">
                    <span className="text-white/50 text-sm font-bold">PIN: </span>
                    <span className="text-yellow-400 font-black text-xl tracking-widest">{typeof window !== 'undefined' ? sessionStorage.getItem('gamePin') || '' : ''}</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8 md:px-16 py-8">
                {question.imageUrl && <img src={question.imageUrl} alt="" className="max-h-52 rounded-3xl object-cover shadow-2xl" />}
                <h2 className="text-3xl md:text-5xl font-black text-white text-center leading-tight max-w-5xl"
                    style={{ textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>{question.text}</h2>
                <div className="grid grid-cols-2 gap-5 w-full max-w-5xl">
                    {question.options.map((opt, i) => (
                        <div key={i} className={`btn-answer text-xl md:text-2xl justify-start`} style={i >= 2 ? { color: '#0a1a0a' } : {}}>
                            <span className="text-3xl">{OPTION_COLORS[i].icon}</span>
                            <span className="font-extrabold mr-2">{OPTION_COLORS[i].label}.</span>
                            <span>{opt}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="h-2 bg-white/10">
                <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, background: tColor, boxShadow: `0 0 14px ${tColor}` }} />
            </div>
        </div>
    );

    /* ── Leaderboard ── */
    if (phase === 'leaderboard' && questionEnd) return (
        <div className="bg-host min-h-screen flex flex-col items-center justify-center gap-6 p-8">
            {questionEnd.explanation && (
                <div className="glass-blue w-full max-w-2xl px-7 py-5 rounded-2xl border border-blue-500/30">
                    <p className="text-blue-300 font-bold text-xs tracking-widest mb-1">💡 BILASIZMI?</p>
                    <p className="text-white font-semibold text-base">{questionEnd.explanation}</p>
                </div>
            )}
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black text-white">🏆 Reyting</h2>
            </div>
            <div className="w-full max-w-2xl space-y-3">
                {questionEnd.leaderboard.map((e, i) => (
                    <motion.div key={i} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-5 p-4 rounded-2xl"
                        style={{ background: 'rgba(0,86,179,0.12)', border: `1px solid ${RANK_COLORS[i]}44` }}>
                        <span className="text-3xl">{RANK_ICONS[i]}</span>
                        <span className="text-3xl">{e.avatar}</span>
                        <span className="flex-1 text-white font-extrabold text-xl">{e.nickname}</span>
                        {e.streak >= 3 && (
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                                className="flex items-center gap-1">
                                <span className="text-2xl">🔥</span>
                                <span className="text-orange-400 font-black">{e.streak}</span>
                            </motion.div>
                        )}
                        <span className="font-black text-2xl" style={{ color: RANK_COLORS[i] }}>{e.score.toLocaleString()}</span>
                    </motion.div>
                ))}
            </div>
            <button onClick={handleNext} className="btn-primary text-xl px-10 py-5">
                {questionEnd.isLastQuestion ? '🏁 Yakunlash' : '➡️ Keyingi Savol'}
            </button>
        </div>
    );

    /* ── Badges Screen ── */
    if (phase === 'badges') return (
        <div className="bg-host min-h-screen flex flex-col items-center justify-center p-8 text-center">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl mb-4">🏆</motion.div>
            <h1 className="text-5xl font-black text-white mb-1">O&apos;yin Tugadi!</h1>
            <p className="text-white/40 mb-8 font-bold">Mukofotlar marosimi</p>

            {/* Badges */}
            {badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mb-8 w-full max-w-3xl">
                    {badges.map((b, i) => (
                        <motion.div key={i} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.3 }}
                            className="glass p-5 rounded-2xl text-center flex-1 min-w-48"
                            style={{ border: '1px solid rgba(255,214,0,0.3)' }}>
                            <div className="text-5xl mb-2">{b.icon}</div>
                            <p className="text-yellow-400 font-black text-lg">{b.badge}</p>
                            <p className="text-white font-extrabold text-base mt-1">{b.avatar} {b.nickname}</p>
                            <p className="text-white/40 text-xs mt-0.5">{b.desc}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Top 5 podium */}
            <div className="w-full max-w-xl space-y-3 mb-8">
                {finalLeaderboard.slice(0, 5).map((e, i) => (
                    <motion.div key={i} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: badges.length * 0.3 + i * 0.12 }}
                        className="flex items-center gap-4 p-4 rounded-2xl"
                        style={{ background: 'rgba(0,86,179,0.15)', border: `2px solid ${RANK_COLORS[i]}55` }}>
                        <span className="text-4xl">{RANK_ICONS[i]}</span>
                        <span className="text-3xl">{e.avatar}</span>
                        <span className="flex-1 text-white font-black text-xl text-left">{e.nickname}</span>
                        <span className="font-black text-2xl" style={{ color: RANK_COLORS[i] }}>{e.score.toLocaleString()}</span>
                    </motion.div>
                ))}
            </div>

            <button onClick={() => router.push('/')} className="btn-primary text-lg px-10 py-4">🏠 Bosh sahifaga</button>
        </div>
    );

    return null;
}
