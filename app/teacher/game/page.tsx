'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';

interface LeaderboardEntry { nickname: string; score: number; rank: number; }
interface QuestionPayload { questionIndex: number; total: number; text: string; options: string[]; timeLimit: number; imageUrl?: string; }
interface QuestionEndPayload { correctOptions: number[]; leaderboard: LeaderboardEntry[]; isLastQuestion: boolean; }

const OPTION_COLORS = [
    { cls: 'btn-red', icon: '🔴' },
    { cls: 'btn-blue', icon: '🔵' },
    { cls: 'btn-yellow', icon: '🟡' },
    { cls: 'btn-green', icon: '🟢' },
];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export default function TeacherGamePage() {
    const router = useRouter();
    const pinRef = useRef<string | null>(null);
    const [phase, setPhase] = useState<'question' | 'leaderboard' | 'ended'>('question');
    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [questionEnd, setQuestionEnd] = useState<QuestionEndPayload | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const channelRef = useRef<any>(null);

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const startTimer = useCallback((seconds: number, pin: string) => {
        clearTimer();
        setTimeLeft(seconds);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
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
            setQuestion(payload);
            setPhase('question');
            setQuestionEnd(null);
            startTimer(payload.timeLimit, pin);
        });

        channelRef.current.bind('question-end', (payload: QuestionEndPayload) => {
            clearTimer();
            setQuestionEnd(payload);
            setPhase('leaderboard');
        });

        channelRef.current.bind('game-end', ({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
            clearTimer();
            setQuestionEnd({ correctOptions: [], leaderboard, isLastQuestion: true });
            setPhase('ended');
        });

        return () => {
            pusher.unsubscribe(`game-${pin}`);
            clearTimer();
        };
    }, [router, startTimer]);

    const handleNext = async () => {
        const pin = pinRef.current;
        if (!pin) return;
        await fetch('/api/game/next', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    };

    const timerPercent = question ? (timeLeft / question.timeLimit) * 100 : 100;
    const timerColor = timeLeft > (question?.timeLimit || 0) * 0.6 ? '#6BCB77' : timeLeft > (question?.timeLimit || 0) * 0.3 ? '#FFD93D' : '#FF6B6B';

    if (phase === 'question' && question) {
        return (
            <div className="bg-teacher min-h-screen flex flex-col items-center justify-between p-6 md:p-10">
                <div className="w-full flex items-center justify-between mb-6">
                    <div className="glass px-4 py-2 rounded-xl">
                        <span className="text-white/60 font-bold text-sm">Savol </span>
                        <span className="text-white font-extrabold">{question.questionIndex + 1}/{question.total}</span>
                    </div>
                    <div className="relative flex items-center justify-center">
                        <svg width="80" height="80" className="-rotate-90">
                            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                            <circle cx="40" cy="40" r="34" fill="none" stroke={timerColor} strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 34}`}
                                strokeDashoffset={`${2 * Math.PI * 34 * (1 - timerPercent / 100)}`}
                                className="timer-ring" style={{ filter: `drop-shadow(0 0 8px ${timerColor})` }} />
                        </svg>
                        <span className="absolute text-2xl font-black" style={{ color: timerColor }}>{timeLeft}</span>
                    </div>
                    <div className="glass px-4 py-2 rounded-xl opacity-0">.</div>
                </div>

                <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center gap-8">
                    {question.imageUrl && <img src={question.imageUrl} alt="Question" className="max-h-48 rounded-2xl object-cover shadow-2xl" />}
                    <h2 className="text-3xl md:text-5xl font-black text-white text-center leading-tight"
                        style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>{question.text}</h2>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {question.options.map((opt, i) => (
                            <div key={i} className={`btn-answer ${OPTION_COLORS[i].cls} text-xl md:text-2xl justify-center`}>
                                <span className="text-2xl">{OPTION_COLORS[i].icon}</span>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full mt-6">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${timerPercent}%`, background: timerColor, boxShadow: `0 0 12px ${timerColor}` }} />
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'leaderboard' && questionEnd) {
        return (
            <div className="bg-teacher min-h-screen flex flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-2xl space-y-6">
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-2xl font-extrabold text-white text-center mb-4">🏆 Reyting</h3>
                        <div className="space-y-3">
                            {questionEnd.leaderboard.map((entry, i) => (
                                <div key={i} className="flex items-center gap-4 leaderboard-item p-4 rounded-xl animate-slide-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}>
                                    <span className="text-3xl">{RANK_ICONS[i]}</span>
                                    <span className="flex-1 text-white font-bold text-lg">{entry.nickname}</span>
                                    <span className="text-yellow-400 font-extrabold text-xl">{entry.score.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full btn-primary text-center">
                        {questionEnd.isLastQuestion ? "🏁 O'yinni Yakunlash" : '➡️ Keyingi Savol'}
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'ended' && questionEnd) {
        return (
            <div className="bg-teacher min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-xl space-y-6">
                    <div className="text-8xl animate-bounce-in">🏆</div>
                    <h1 className="text-4xl font-black text-white">O&apos;yin Yakunlandi!</h1>
                    <div className="space-y-3">
                        {questionEnd.leaderboard.map((entry, i) => (
                            <div key={i} className="flex items-center gap-4 glass p-4 rounded-2xl animate-slide-up"
                                style={{ animationDelay: `${i * 0.15}s` }}>
                                <span className="text-4xl">{RANK_ICONS[i]}</span>
                                <span className="flex-1 text-white font-bold text-xl text-left">{entry.nickname}</span>
                                <span className="text-yellow-400 font-extrabold text-2xl">{entry.score.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => router.push('/')} className="btn-primary w-full">🏠 Bosh sahifaga qaytish</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-teacher min-h-screen flex items-center justify-center">
            <div className="text-center glass p-12 rounded-2xl">
                <div className="text-6xl mb-4 animate-spin-slow">⚡</div>
                <p className="text-white/60 font-bold text-xl">O&apos;yin yuklanmoqda...</p>
            </div>
        </div>
    );
}
