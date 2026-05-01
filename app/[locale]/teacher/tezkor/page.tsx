'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry { nickname: string; avatar: string; score: number; streak: number; rank: number; id?: string; }
interface QuestionPayload {
    questionIndex: number; total: number; text: string; options: string[];
    timeLimit: number; imageUrl?: string; questionStartTime?: number;
}
interface QuestionEndPayload { leaderboard: LeaderboardEntry[]; isLastQuestion: boolean; }
interface Badge { nickname: string; avatar: string; badge: string; icon: string; desc: string; }
interface GameEndPayload { leaderboard: LeaderboardEntry[]; badges: Badge[]; }
interface PlayerJoinedPayload { players: any[] }

function fireConfetti() {
    const end = Date.now() + 3500;
    const colors = ['#0056b3', '#FFD600', '#00E676', '#FF1744', '#ffffff'];
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();
}

export default function TezkorGamePage() {
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
    const [players, setPlayers] = useState<{ id: string; nickname: string; score: number; correctCount: number; isJumping: boolean }[]>([]);

    const [autoNextTime, setAutoNextTime] = useState<number | null>(null);

    // Audio setup
    useEffect(() => {
        const audio = new Audio('/music/Puddle_Hop_Waltz.mp3');
        audio.loop = true;
        audio.volume = 0.4;
        audio.play().catch(err => console.log('Audio autoplay prevented:', err));

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

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
        
        // Initial state fetch
        fetch(`/api/game/state?pin=${pin}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.players) {
                    setPlayers(data.players.map((p: any) => ({
                        id: p.id,
                        nickname: p.nickname,
                        score: p.score || 0,
                        correctCount: p.correctCount || 0,
                        isJumping: false
                    })));
                }
            })
            .catch(err => console.error(err));

        const pusher = getPusherClient();
        channelRef.current = pusher.subscribe(`game-${pin}`);

        // Track new players joining (though they mostly join in lobby, some might reconnect)
        channelRef.current.bind('player-joined', ({ players: updated }: PlayerJoinedPayload) => {
            setPlayers(prev => {
                const newPlayers = [...prev];
                updated.forEach(u => {
                    if (!newPlayers.find(p => p.id === u.id)) {
                        newPlayers.push({ id: u.id, nickname: u.nickname, score: 0, correctCount: 0, isJumping: false });
                    }
                });
                return newPlayers;
            });
        });

        channelRef.current.bind('question-start', (payload: QuestionPayload) => {
            setQuestion(payload); setPhase('question'); setQuestionEnd(null);
            startTimer(payload.timeLimit, pin);
        });

        // Track answers for jumping animation
        // Assume server sends some answer update, or we parse from question-end.
        // Wait, does the server emit individual answer updates to teacher?
        // Let's rely on question-end leaderboard for now or simulate it.
        // Zukkoo classic doesn't seem to emit live scores per player, just team or blitz live updates.
        // If we want frogs to jump *live*, we should ideally have an event. 
        // Let's add a 'player-answered' bind just in case we add it to the server.
        channelRef.current.bind('player-answered', (data: { playerId: string; isCorrect: boolean; currentCorrectCount: number; score: number }) => {
            if (data.isCorrect) {
                setPlayers(prev => prev.map(p => {
                    if (p.id === data.playerId) {
                        return { ...p, score: data.score, correctCount: data.currentCorrectCount, isJumping: true };
                    }
                    return p;
                }));
                // Reset jumping state after animation completes
                setTimeout(() => {
                    setPlayers(prev => prev.map(p => p.id === data.playerId ? { ...p, isJumping: false } : p));
                }, 600);
            }
        });

        channelRef.current.bind('question-end', (payload: QuestionEndPayload) => {
            clearTimer();
            setQuestionEnd(payload);
            setPhase('leaderboard');
            if (!payload.isLastQuestion) {
                setAutoNextTime(5);
            } else {
                setAutoNextTime(null);
            }
            // Sync final scores for this round
            setPlayers(prev => {
                return prev.map(p => {
                    const lbEntry = payload.leaderboard.find(l => l.nickname === p.nickname);
                    if (lbEntry) {
                        return { ...p, score: lbEntry.score };
                    }
                    return p;
                });
            });
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

    useEffect(() => {
        if (autoNextTime === null || phase !== 'leaderboard') return;
        if (autoNextTime <= 0) {
            handleNext();
            setAutoNextTime(null);
            return;
        }
        const timer = setTimeout(() => {
            setAutoNextTime(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => clearTimeout(timer);
    }, [autoNextTime, phase]);

    const handleNext = async () => {
        const pin = pinRef.current; if (!pin) return;
        setAutoNextTime(null);
        await fetch('/api/game/next', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    };

    const handlePlayAgain = async () => {
        const pin = pinRef.current; if (!pin) return;
        try {
            await fetch('/api/game/reset-for-continue', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            router.push(`/teacher/create?continuePin=${pin}&mode=tezkor`);
        } catch (err) {
            console.error(err);
        }
    };

    const totalQ = question?.total || 10;
    
    /* ── Loading ── */
    if (phase === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a]">
            <div className="text-center glass p-14 rounded-3xl">
                <div className="text-7xl mb-5 animate-spin-slow">🐸</div>
                <p className="text-white/50 font-bold text-2xl">Sehrli ko'lga sayohat boshlanmoqda...</p>
            </div>
        </div>
    );

    /* ── Badges Screen (same as classic for now) ── */
    if (phase === 'badges') return (
        <div className="bg-[#0d1b2a] min-h-screen flex flex-col items-center justify-center p-8 text-center">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl mb-4">🏆</motion.div>
            <h1 className="text-5xl font-black text-white mb-1">Poyga Tugadi!</h1>
            <p className="text-white/40 mb-8 font-bold">Marraga yetib kelganlar</p>

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

            <div className="w-full max-w-xl space-y-3 mb-8">
                {finalLeaderboard.slice(0, 5).map((e, i) => (
                    <motion.div key={i} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: badges.length * 0.3 + i * 0.12 }}
                        className="flex items-center gap-4 p-4 rounded-2xl"
                        style={{ background: 'rgba(52,211,153,0.15)', border: `2px solid rgba(52,211,153,0.4)` }}>
                        <span className="text-4xl">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                        <span className="text-3xl">{e.avatar}</span>
                        <span className="flex-1 text-white font-black text-xl text-left">{e.nickname}</span>
                        <span className="font-black text-2xl text-emerald-400">{e.score.toLocaleString()}</span>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-xl">
                <button onClick={() => router.push('/')} className="btn-primary flex-1 text-lg px-8 py-4 bg-gray-600 hover:bg-gray-500 text-white shadow-none">🏠 Bosh sahifaga</button>
                <button onClick={handlePlayAgain} className="btn-primary flex-1 text-lg px-8 py-4 bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    🔄 Yana o&apos;ynash <br /><span className="text-xs opacity-70">(Shu o&apos;yinchilar bilan)</span>
                </button>
            </div>
        </div>
    );

    /* ── Race Track View (Question + Leaderboard share this view) ── */
    return (
        <div className="relative min-h-screen bg-black overflow-hidden flex flex-col font-sans">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{ 
                        backgroundImage: 'url(/game/tezkor/lake_bg.webp)',
                        filter: 'brightness(0.85) saturate(1.2)'
                    }} 
                />
            </div>

            {/* Header info overlay */}
            <div className="relative z-20 flex items-center justify-between px-8 py-4 bg-black/40 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-black text-2xl drop-shadow-md">Zukkoo Tezkor</span>
                    {question && (
                        <div className="bg-emerald-500/20 border border-emerald-500/40 px-4 py-1.5 rounded-xl ml-4">
                            <span className="text-white/80 font-bold text-sm">Savol </span>
                            <span className="text-white font-extrabold">{question.questionIndex + 1}</span>
                            <span className="text-white/60 font-bold"> / {question.total}</span>
                        </div>
                    )}
                </div>
                
                {phase === 'question' ? (
                    <div className="flex items-center gap-3">
                        <span className="text-white/60 font-bold text-lg">Vaqt:</span>
                        <span className={`text-3xl font-black ${timeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                ) : phase === 'leaderboard' ? (
                    <button onClick={handleNext} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        {questionEnd?.isLastQuestion ? '🏁 Yakunlash' : `➡️ Keyingi Savol ${autoNextTime !== null ? `(${autoNextTime}s)` : ''}`}
                    </button>
                ) : null}
            </div>

            {/* Question Text (Optional overlay at the top) */}
            {question && (
                <div className="relative z-20 w-full flex justify-center mt-6 px-4">
                    <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 p-6 rounded-3xl max-w-4xl text-center shadow-2xl">
                        <h2 className="text-2xl md:text-4xl font-black text-white leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                            {question.text}
                        </h2>
                    </div>
                </div>
            )}

            {/* Race Track */}
            <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-10 py-10 overflow-hidden">
                <div className="w-full max-w-7xl mx-auto space-y-8">
                    {players.map((player, index) => {
                        // Progress based on exact correct answers
                        const correct = player.correctCount || 0;
                        let progressPct = (correct / totalQ) * 100;
                        if (progressPct > 100) progressPct = 100;
                        if (progressPct < 0) progressPct = 0;

                        return (
                            <div key={player.id} className="relative w-full h-24 flex items-center bg-black/20 rounded-full border border-white/5 py-2">
                                {/* Lily pads distributed evenly */}
                                <div className="absolute inset-y-0 left-10 right-10 flex justify-between items-center opacity-60">
                                    {Array.from({ length: totalQ + 1 }).map((_, i) => (
                                        <div key={i} className="w-12 h-12 relative flex-shrink-0">
                                            <div className="w-full h-full bg-[url('/game/tezkor/lilypad.webp')] bg-contain bg-center bg-no-repeat drop-shadow-lg" />
                                        </div>
                                    ))}
                                </div>
                                
                                {/* The Frog */}
                                <div className="absolute inset-y-0 left-10 right-10 pointer-events-none px-6">
                                    <div className="relative w-full h-full">
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-20 transition-all duration-[700ms]"
                                            style={{ 
                                                left: `${progressPct}%`,
                                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                                            }}
                                        >
                                            <span className="bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-md mb-1 whitespace-nowrap">
                                                {player.nickname}
                                            </span>
                                            <div 
                                                className="w-16 h-16 bg-contain bg-center bg-no-repeat drop-shadow-2xl transition-transform duration-[600ms]"
                                                style={{ 
                                                    backgroundImage: `url('/game/tezkor/${player.isJumping ? 'frog_jump.webp' : 'frog_idle.webp'}')`,
                                                    transform: player.isJumping ? 'translateY(-35px) scale(1.15) rotate(5deg)' : 'translateY(0) scale(1) rotate(0deg)'
                                                }}
                                            />
                                            <span className="text-emerald-400 font-black text-sm mt-1 drop-shadow-md">
                                                {player.score.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
