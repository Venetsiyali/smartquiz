'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';

interface QuestionPayload { questionIndex: number; total: number; text: string; options: string[]; timeLimit: number; imageUrl?: string; questionStartTime?: number; }
interface AnswerResult { correct: boolean; points: number; totalScore: number; correctOptions: number[]; }
interface LeaderboardEntry { nickname: string; score: number; rank: number; }

const STYLES = [
    { cls: 'btn-red', icon: '🔴', label: 'A', light: false },
    { cls: 'btn-blue', icon: '🔵', label: 'B', light: false },
    { cls: 'btn-yellow', icon: '🟡', label: 'C', light: true },
    { cls: 'btn-green', icon: '🟢', label: 'D', light: true },
];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
const RANK_COLORS = ['#FFD600', '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)'];

function vibrate(pattern: number | number[]) {
    try { if ('vibrate' in navigator) navigator.vibrate(pattern); } catch { }
}

export default function StudentGamePage() {
    const router = useRouter();
    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [result, setResult] = useState<AnswerResult | null>(null);
    const [phase, setPhase] = useState<'loading' | 'question' | 'feedback' | 'between' | 'ended'>('loading');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pinRef = useRef('');
    const playerIdRef = useRef('');

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const startTimer = (q: QuestionPayload) => {
        clearTimer();
        const elapsed = q.questionStartTime ? Math.floor((Date.now() - q.questionStartTime) / 1000) : 0;
        const rem = Math.max(1, q.timeLimit - elapsed);
        setTimeLeft(rem);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => { if (prev <= 1) { clearTimer(); return 0; } return prev - 1; });
        }, 1000);
    };

    const showQuestion = (payload: QuestionPayload) => {
        setQuestion(payload); setSelected(null); setResult(null); setPhase('question');
        startTimer(payload);
        vibrate(30);
    };

    useEffect(() => {
        const pin = sessionStorage.getItem('playerPin');
        const pid = sessionStorage.getItem('playerId');
        if (!pin || !pid) { router.push('/play'); return; }
        pinRef.current = pin; playerIdRef.current = pid;

        // Fetch current state from Redis first
        fetch(`/api/game/state?pin=${pin}`)
            .then(r => r.json())
            .then(data => {
                if (data.status === 'question' && data.currentQuestion) showQuestion(data.currentQuestion);
                else if (data.status === 'ended') setPhase('ended');
            }).catch(() => { });

        // Pusher subscriptions for future events
        const pusher = getPusherClient();
        const gameCh = pusher.subscribe(`game-${pin}`);
        gameCh.bind('question-start', (payload: QuestionPayload) => showQuestion(payload));
        gameCh.bind('question-end', ({ leaderboard: lb }: { leaderboard: LeaderboardEntry[] }) => {
            clearTimer(); setLeaderboard(lb); setPhase('between');
        });
        gameCh.bind('game-end', ({ leaderboard: lb }: { leaderboard: LeaderboardEntry[] }) => {
            clearTimer(); setLeaderboard(lb); setPhase('ended'); vibrate([100, 50, 200]);
        });

        const playerCh = pusher.subscribe(`player-${pid}`);
        playerCh.bind('answer-result', (r: AnswerResult) => {
            clearTimer(); setResult(r); setTotalScore(r.totalScore); setPhase('feedback');
            vibrate(r.correct ? [80, 40, 80] : 300);
        });

        return () => { pusher.unsubscribe(`game-${pin}`); pusher.unsubscribe(`player-${pid}`); clearTimer(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const handleAnswer = async (i: number) => {
        if (selected !== null || phase !== 'question') return;
        setSelected(i); vibrate(40);
        await fetch('/api/game/answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinRef.current, playerId: playerIdRef.current, optionIndex: i }),
        });
    };

    const pct = question ? (timeLeft / question.timeLimit) * 100 : 100;
    const tColor = !question ? '#0056b3' : timeLeft > question.timeLimit * 0.6 ? '#00E676' : timeLeft > question.timeLimit * 0.3 ? '#FFD600' : '#FF1744';

    /* ── Loading ── */
    if (phase === 'loading') return (
        <div className="bg-player min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl font-black animate-bounce"
                    style={{ background: 'linear-gradient(135deg, #0056b3, #FFD600)' }}>Z</div>
                <p className="text-white/50 font-bold text-lg animate-pulse">Savol yuklanmoqda...</p>
            </div>
        </div>
    );

    /* ── Question ── */
    if (phase === 'question' && question) return (
        <div className="bg-player min-h-screen flex flex-col p-4" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-black"
                        style={{ background: 'linear-gradient(135deg, #0056b3, #FFD600)' }}>Z</div>
                    <div className="glass-blue px-3 py-1.5 rounded-xl">
                        <span className="text-white font-extrabold text-sm">{question.questionIndex + 1}/{question.total}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-28 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: tColor }} />
                    </div>
                    <span className="font-black text-xl w-8 text-right" style={{ color: tColor }}>{timeLeft}</span>
                </div>
                <div className="glass px-3 py-1.5 rounded-xl">
                    <span className="text-yellow-400 font-extrabold text-sm">{totalScore.toLocaleString()} 🏅</span>
                </div>
            </div>

            {/* Question card */}
            <div className="glass p-4 rounded-2xl mb-4">
                {question.imageUrl && <img src={question.imageUrl} alt="" className="w-full max-h-36 object-cover rounded-xl mb-3" />}
                <p className="text-white font-extrabold text-lg leading-snug text-center">{question.text}</p>
            </div>

            {/* Answer grid */}
            <div className={`grid gap-3 flex-1 ${question.options.length === 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {question.options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                        className={`btn-answer flex-col h-full min-h-24 rounded-2xl ${STYLES[i].cls}
              ${selected === i ? 'ring-4 ring-white scale-95 brightness-125' : ''}
              ${selected !== null && selected !== i ? 'opacity-60' : ''}`}
                        style={{ color: STYLES[i].light ? '#0a1a0a' : 'white' }}>
                        <span className="text-4xl">{STYLES[i].icon}</span>
                        <span className="text-sm font-extrabold mt-1 text-center leading-snug px-1">{opt}</span>
                    </button>
                ))}
            </div>

            {selected !== null && phase === 'question' && (
                <p className="text-center text-white/50 font-bold text-sm mt-3 animate-pulse">⏳ O&apos;qituvchi javoblar tugashini kutmoqda...</p>
            )}
        </div>
    );

    /* ── Feedback ── */
    if (phase === 'feedback' && result) return (
        <div className="bg-player min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="w-36 h-36 rounded-full flex items-center justify-center text-7xl mb-8 animate-bounce-in"
                style={{
                    background: result.correct ? 'linear-gradient(135deg, #00E676, #009944)' : 'linear-gradient(135deg, #FF1744, #aa0030)',
                    boxShadow: result.correct ? '0 0 60px rgba(0,230,118,0.6)' : '0 0 60px rgba(255,23,68,0.6)',
                }}>
                {result.correct ? '✅' : '❌'}
            </div>
            <h2 className="text-4xl font-black text-white mb-4">{result.correct ? "To'g'ri!" : "Noto'g'ri!"}</h2>
            {result.correct && (
                <div className="glass-blue px-8 py-4 rounded-2xl mb-4 animate-slide-up">
                    <p className="text-white/50 font-bold text-sm">QO&apos;SHILDI</p>
                    <p className="text-5xl font-black" style={{ color: '#FFD600' }}>+{result.points}</p>
                </div>
            )}
            <div className="glass px-8 py-4 rounded-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <p className="text-white/50 font-bold text-sm">JAMI BALL</p>
                <p className="text-3xl font-black text-white">{result.totalScore.toLocaleString()} 🏅</p>
            </div>
            <div className="flex gap-2 mt-8">
                {[0, 1, 2].map(i => <div key={i} className="w-3 h-3 rounded-full animate-bounce"
                    style={{ background: ['#0056b3', '#FFD600', '#00E676'][i], animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <p className="text-white/40 font-bold mt-2 text-sm">Keyingi savol kutilmoqda...</p>
        </div>
    );

    /* ── Between ── */
    if (phase === 'between') {
        const myNick = sessionStorage.getItem('playerNickname') || '';
        return (
            <div className="bg-player min-h-screen flex flex-col items-center justify-center p-5">
                <h2 className="text-2xl font-black text-white mb-5">🏆 Natijalar</h2>
                <div className="w-full max-w-sm space-y-2.5 mb-5">
                    {leaderboard.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl animate-slide-up"
                            style={{
                                background: e.nickname === myNick ? 'rgba(0,86,179,0.3)' : 'rgba(255,255,255,0.07)',
                                border: e.nickname === myNick ? '2px solid #0056b3' : 'none',
                                animationDelay: `${i * 0.1}s`,
                            }}>
                            <span className="text-2xl">{RANK_ICONS[i]}</span>
                            <span className="flex-1 font-bold text-white text-sm">{e.nickname}{e.nickname === myNick ? ' (Siz)' : ''}</span>
                            <span className="font-extrabold text-base" style={{ color: RANK_COLORS[i] }}>{e.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    {[0, 1, 2].map(i => <div key={i} className="w-3 h-3 rounded-full animate-bounce"
                        style={{ background: ['#0056b3', '#FFD600', '#00E676'][i], animationDelay: `${i * 0.2}s` }} />)}
                </div>
                <p className="text-white/40 font-bold mt-2 text-sm animate-pulse">Keyingi savol yuklanmoqda...</p>
            </div>
        );
    }

    /* ── Game Ended ── */
    if (phase === 'ended') {
        const myNick = sessionStorage.getItem('playerNickname') || '';
        const myEntry = leaderboard.find(e => e.nickname === myNick);
        return (
            <div className="bg-player min-h-screen flex flex-col items-center justify-center p-5 text-center">
                <div className="text-7xl mb-5 animate-bounce-in">🎉</div>
                <h1 className="text-3xl font-black text-white mb-1">O&apos;yin Tugadi!</h1>
                <p className="text-white/40 font-semibold mb-6 text-sm">Zukk<span className="logo-z">oo</span> · TUIT ATT</p>
                {myEntry && (
                    <div className="glass-blue px-8 py-5 rounded-2xl mb-5 animate-scale-in">
                        <p className="text-white/50 font-bold text-xs">SIZNING NATIJANGIZ</p>
                        <p className="text-5xl mt-1">{RANK_ICONS[myEntry.rank - 1] || `#${myEntry.rank}`}</p>
                        <p className="text-2xl font-extrabold mt-1" style={{ color: '#FFD600' }}>{myEntry.score.toLocaleString()} ball</p>
                    </div>
                )}
                <div className="w-full max-w-sm space-y-2 mb-7">
                    {leaderboard.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 glass p-3.5 rounded-2xl animate-slide-up" style={{ animationDelay: `${i * 0.12}s` }}>
                            <span className="text-3xl">{RANK_ICONS[i]}</span>
                            <span className="flex-1 font-bold text-white text-sm">{e.nickname}</span>
                            <span className="font-extrabold" style={{ color: RANK_COLORS[i] }}>{e.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => router.push('/')} className="btn-primary w-full max-w-sm justify-center">🏠 Bosh sahifa</button>
            </div>
        );
    }

    return null;
}
