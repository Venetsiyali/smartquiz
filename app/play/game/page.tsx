'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';

interface QuestionPayload { questionIndex: number; total: number; text: string; options: string[]; timeLimit: number; imageUrl?: string; }
interface AnswerResult { correct: boolean; points: number; totalScore: number; correctOptions: number[]; }
interface LeaderboardEntry { nickname: string; score: number; rank: number; }

const ANSWER_STYLES = [
    { cls: 'btn-red', icon: '🔴' },
    { cls: 'btn-blue', icon: '🔵' },
    { cls: 'btn-yellow', icon: '🟡' },
    { cls: 'btn-green', icon: '🟢' },
];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export default function StudentGamePage() {
    const router = useRouter();
    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [result, setResult] = useState<AnswerResult | null>(null);
    const [phase, setPhase] = useState<'waiting' | 'question' | 'feedback' | 'between' | 'ended'>('waiting');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pinRef = useRef('');
    const playerIdRef = useRef('');

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    useEffect(() => {
        const pin = sessionStorage.getItem('playerPin');
        const pid = sessionStorage.getItem('playerId');
        if (!pin || !pid) { router.push('/play'); return; }
        pinRef.current = pin;
        playerIdRef.current = pid;

        const pusher = getPusherClient();

        // Game channel (broadcasts)
        const gameCh = pusher.subscribe(`game-${pin}`);
        gameCh.bind('question-start', (payload: QuestionPayload) => {
            setQuestion(payload);
            setSelected(null);
            setResult(null);
            setPhase('question');
            setTimeLeft(payload.timeLimit);
            clearTimer();
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { clearTimer(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        });

        gameCh.bind('question-end', ({ leaderboard: lb }: { leaderboard: LeaderboardEntry[] }) => {
            clearTimer();
            setLeaderboard(lb);
            setPhase('between');
        });

        gameCh.bind('game-end', ({ leaderboard: lb }: { leaderboard: LeaderboardEntry[] }) => {
            clearTimer();
            setLeaderboard(lb);
            setPhase('ended');
        });

        // Private player channel for individual answer result
        const playerCh = pusher.subscribe(`player-${pid}`);
        playerCh.bind('answer-result', (r: AnswerResult) => {
            clearTimer();
            setResult(r);
            setTotalScore(r.totalScore);
            setPhase('feedback');
        });

        return () => {
            pusher.unsubscribe(`game-${pin}`);
            pusher.unsubscribe(`player-${pid}`);
            clearTimer();
        };
    }, [router]);

    const handleAnswer = async (optIndex: number) => {
        if (selected !== null || phase !== 'question') return;
        setSelected(optIndex);
        await fetch('/api/game/answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinRef.current, playerId: playerIdRef.current, optionIndex: optIndex }),
        });
    };

    const timerPercent = question ? (timeLeft / question.timeLimit) * 100 : 100;
    const timerColor = timeLeft > (question?.timeLimit || 0) * 0.6 ? '#6BCB77' : timeLeft > (question?.timeLimit || 0) * 0.3 ? '#FFD93D' : '#FF6B6B';

    if (phase === 'question' && question) {
        return (
            <div className="bg-game min-h-screen flex flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="glass px-3 py-1.5 rounded-xl">
                        <span className="text-white/50 text-xs font-bold">Savol </span>
                        <span className="text-white font-extrabold text-sm">{question.questionIndex + 1}/{question.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${timerPercent}%`, background: timerColor }} />
                        </div>
                        <span className="font-extrabold text-xl" style={{ color: timerColor }}>{timeLeft}</span>
                    </div>
                    <div className="glass px-3 py-1.5 rounded-xl">
                        <span className="text-yellow-400 font-extrabold text-sm">{totalScore.toLocaleString()} 🏅</span>
                    </div>
                </div>

                <div className="glass p-4 rounded-2xl mb-4 text-center">
                    <p className="text-white/60 text-xs font-bold mb-2">SAVOL</p>
                    {question.imageUrl && <img src={question.imageUrl} alt="q" className="w-full max-h-32 object-cover rounded-xl mb-3" />}
                    <p className="text-white font-bold text-lg leading-snug">{question.text}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 flex-1">
                    {question.options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                            className={`btn-answer ${ANSWER_STYLES[i].cls} flex-col h-full min-h-28 ${selected === i ? 'ring-4 ring-white scale-95' : ''}`}>
                            <span className="text-3xl">{ANSWER_STYLES[i].icon}</span>
                            <span className="text-base font-bold text-center leading-snug">{opt}</span>
                        </button>
                    ))}
                </div>

                {selected !== null && (
                    <p className="text-white/60 font-bold text-center mt-4 animate-pulse">Javob yuborildi...</p>
                )}
            </div>
        );
    }

    if (phase === 'feedback' && result) {
        return (
            <div className="bg-game min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div className="w-36 h-36 rounded-full flex items-center justify-center text-7xl mb-8 animate-bounce-in"
                    style={{
                        background: result.correct ? 'linear-gradient(135deg, #6BCB77, #11998e)' : 'linear-gradient(135deg, #FF6B6B, #ee0979)',
                        boxShadow: result.correct ? '0 0 60px rgba(107,203,119,0.6)' : '0 0 60px rgba(255,107,107,0.6)',
                    }}>
                    {result.correct ? '✅' : '❌'}
                </div>
                <h2 className="text-4xl font-black text-white mb-4">{result.correct ? "To'g'ri!" : "Noto'g'ri!"}</h2>
                {result.correct && (
                    <div className="glass px-8 py-4 rounded-2xl mb-4 animate-slide-up">
                        <p className="text-white/60 font-bold text-sm">BALL QO&apos;SHILDI</p>
                        <p className="text-4xl font-black" style={{ color: '#FFD93D' }}>+{result.points}</p>
                    </div>
                )}
                <div className="glass px-8 py-4 rounded-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <p className="text-white/60 font-bold text-sm">JAMI BALL</p>
                    <p className="text-3xl font-black text-white">{result.totalScore.toLocaleString()} 🏅</p>
                </div>
                <p className="text-white/40 font-bold mt-6 animate-pulse">Keyingi savol kutilmoqda...</p>
            </div>
        );
    }

    if (phase === 'between') {
        const myNick = sessionStorage.getItem('playerNickname') || '';
        return (
            <div className="bg-game min-h-screen flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl font-black text-white mb-6">🏆 Hozirgi natijalar</h2>
                <div className="w-full max-w-sm space-y-3 mb-6">
                    {leaderboard.map((entry, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-slide-up"
                            style={{ background: entry.nickname === myNick ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.08)', border: entry.nickname === myNick ? '2px solid #6C63FF' : 'none', animationDelay: `${i * 0.1}s` }}>
                            <span className="text-2xl">{RANK_ICONS[i]}</span>
                            <span className="flex-1 font-bold text-white">{entry.nickname} {entry.nickname === myNick ? '(Siz)' : ''}</span>
                            <span className="text-yellow-400 font-extrabold">{entry.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <p className="text-white/50 font-bold animate-pulse">Keyingi savol yuklanmoqda...</p>
            </div>
        );
    }

    if (phase === 'ended') {
        const myNick = sessionStorage.getItem('playerNickname') || '';
        const myEntry = leaderboard.find((e) => e.nickname === myNick);
        return (
            <div className="bg-game min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div className="text-7xl mb-6 animate-bounce-in">🎉</div>
                <h1 className="text-4xl font-black text-white mb-2">O&apos;yin Tugadi!</h1>
                {myEntry && (
                    <div className="glass px-8 py-5 rounded-2xl mb-6 animate-scale-in">
                        <p className="text-white/60 font-bold text-sm">SIZNING NATIJANGIZ</p>
                        <p className="text-5xl font-black text-white">{RANK_ICONS[myEntry.rank - 1] || `#${myEntry.rank}`}</p>
                        <p className="text-2xl font-extrabold text-yellow-400">{myEntry.score.toLocaleString()} ball</p>
                    </div>
                )}
                <div className="w-full max-w-sm space-y-3 mb-8">
                    {leaderboard.slice(0, 3).map((entry, i) => (
                        <div key={i} className="flex items-center gap-3 glass p-4 rounded-2xl animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                            <span className="text-3xl">{RANK_ICONS[i]}</span>
                            <span className="flex-1 font-bold text-white">{entry.nickname}</span>
                            <span className="text-yellow-400 font-extrabold text-lg">{entry.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => router.push('/')} className="btn-primary w-full max-w-sm">🏠 Bosh sahifaga qaytish</button>
            </div>
        );
    }

    return (
        <div className="bg-game min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">⚡</div>
                <p className="text-white/60 font-bold text-xl">O&apos;yin boshlanishini kutmoqda...</p>
            </div>
        </div>
    );
}
