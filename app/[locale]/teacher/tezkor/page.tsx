'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';
import { serverNow, syncServerClock } from '@/lib/serverClock';
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
interface PlayerJoinedPayload { player: { id: string; nickname: string } }

function fireConfetti() {
    const end = Date.now() + 3500;
    const colors = ['#0056b3', '#FFD600', '#00E676', '#FF1744', '#ffffff'];
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    })();
}

interface PlayerView { id: string; nickname: string; avatar?: string; score: number; correctCount: number; isJumping: boolean }
interface Reveal { correctOptions: number[]; explanation: string | null; isLastQuestion: boolean }

const MAX_LANES = 8;
const AUTO_NEXT_SEC = 8;

export default function TezkorGamePage() {
    const router = useRouter();
    const pinRef = useRef<string | null>(null);
    const [phase, setPhase] = useState<'loading' | 'question' | 'leaderboard' | 'badges' | 'ended'>('loading');
    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [reveal, setReveal] = useState<Reveal | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [players, setPlayers] = useState<PlayerView[]>([]);
    const [answered, setAnswered] = useState(0);
    const [autoNextTime, setAutoNextTime] = useState<number | null>(null);
    const [nextBusy, setNextBusy] = useState(false);
    const [musicOn, setMusicOn] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const questionRef = useRef<QuestionPayload | null>(null);
    const phaseRef = useRef(phase);
    const endedForRef = useRef<number>(-1);
    const answeredIdsRef = useRef<Set<string>>(new Set());
    phaseRef.current = phase;
    questionRef.current = question;

    // Musiqa: brauzer avtomatik ijroni bloklashi mumkin — shuning uchun yoqish/o'chirish tugmasi bor
    useEffect(() => {
        const audio = new Audio('/music/Puddle_Hop_Waltz.mp3');
        audio.loop = true;
        audio.volume = 0.4;
        audioRef.current = audio;
        audio.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false));
        return () => { audio.pause(); audio.currentTime = 0; };
    }, []);

    const toggleMusic = () => {
        const a = audioRef.current; if (!a) return;
        if (musicOn) { a.pause(); setMusicOn(false); }
        else a.play().then(() => setMusicOn(true)).catch(() => {});
    };

    const mergePlayers = (list: any[]) => setPlayers(prev => list.map(p => ({
        id: p.id, nickname: p.nickname, avatar: p.avatar,
        score: p.score || 0, correctCount: p.correctCount || 0,
        isJumping: prev.find(x => x.id === p.id)?.isJumping ?? false,
    })));

    const showQuestion = (payload: QuestionPayload) => {
        if (questionRef.current?.questionIndex !== payload.questionIndex) {
            answeredIdsRef.current = new Set();
            setAnswered(0);
        }
        setQuestion(payload); setReveal(null); setAutoNextTime(null); setPhase('question');
    };

    /** Serverdagi joriy holatni olib, ekranni moslaydi (sahifa qayta ochilganda, internet tiklanganda). */
    const resync = useCallback(async () => {
        const pin = pinRef.current; if (!pin) return;
        try {
            const res = await fetch(`/api/game/state?pin=${pin}`, { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data.players)) mergePlayers(data.players);
            if (data.status === 'lobby') {
                await fetch('/api/game/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
                return;
            }
            if (data.status === 'ended') {
                setFinalLeaderboard(data.leaderboard || []); setBadges(data.badges || []); setPhase('badges');
                return;
            }
            if (data.currentQuestion) {
                if (data.status === 'question') {
                    showQuestion(data.currentQuestion);
                    setAnswered(a => Math.max(a, data.answeredCount || 0));
                } else if (data.status === 'leaderboard') {
                    setQuestion(data.currentQuestion);
                    setAnswered(a => Math.max(a, data.answeredCount || 0));
                    if (data.reveal) setReveal(data.reveal);
                    setPhase(prev => {
                        if (prev !== 'leaderboard' && data.reveal && !data.reveal.isLastQuestion) setAutoNextTime(AUTO_NEXT_SEC);
                        return 'leaderboard';
                    });
                }
            }
        } catch { /* keyingi urinishda */ }
    }, []);

    useEffect(() => {
        const pin = sessionStorage.getItem('gamePin');
        if (!pin) { router.push('/teacher/create'); return; }
        pinRef.current = pin;
        syncServerClock();

        const pusher = getPusherClient();
        const gameCh = pusher.subscribe(`game-${pin}`);
        const hostChannel = pusher.subscribe(`host-${pin}`);

        hostChannel.bind('player-joined', ({ player: u }: PlayerJoinedPayload) => {
            setPlayers(prev => prev.some(p => p.id === u.id)
                ? prev
                : [...prev, { id: u.id, nickname: u.nickname, score: 0, correctCount: 0, isJumping: false }]);
        });

        gameCh.bind('question-start', (payload: QuestionPayload) => showQuestion(payload));

        // Har bir javob o'qituvchiga keladi: hisoblagich uchun; to'g'ri bo'lsa — qurbaqa sakraydi
        hostChannel.bind('player-answered', (data: { playerId: string; isCorrect: boolean; currentCorrectCount: number; score: number }) => {
            if (!answeredIdsRef.current.has(data.playerId)) {
                answeredIdsRef.current.add(data.playerId);
                setAnswered(answeredIdsRef.current.size);
            }
            if (!data.isCorrect) return;
            setPlayers(prev => prev.map(p => p.id === data.playerId
                ? { ...p, score: data.score, correctCount: data.currentCorrectCount, isJumping: true } : p));
            setTimeout(() => setPlayers(prev => prev.map(p => p.id === data.playerId ? { ...p, isJumping: false } : p)), 600);
        });

        gameCh.bind('question-end', (payload: QuestionEndPayload & { correctOptions?: number[]; explanation?: string | null }) => {
            setReveal({ correctOptions: payload.correctOptions || [], explanation: payload.explanation ?? null, isLastQuestion: payload.isLastQuestion });
            setPhase('leaderboard');
            setAutoNextTime(payload.isLastQuestion ? null : AUTO_NEXT_SEC);
            // Reyting faqat top-10 ni yuboradi — barcha o'yinchilar ballini serverdan olamiz
            resync();
        });

        gameCh.bind('game-end', (payload: GameEndPayload) => {
            setFinalLeaderboard(payload.leaderboard); setBadges(payload.badges || []); setPhase('badges');
            setTimeout(fireConfetti, 300);
        });

        resync();
        gameCh.bind('pusher:subscription_succeeded', resync);
        pusher.connection.bind('connected', resync);
        const onVisible = () => { if (document.visibilityState === 'visible') resync(); };
        document.addEventListener('visibilitychange', onVisible);
        // Pusher xabari yo'qolsa ham ekran qotib qolmasin
        const poll = setInterval(() => { if (phaseRef.current !== 'badges') resync(); }, 10_000);

        return () => {
            clearInterval(poll);
            document.removeEventListener('visibilitychange', onVisible);
            pusher.connection.unbind('connected', resync);
            pusher.unsubscribe(`game-${pin}`); pusher.unsubscribe(`host-${pin}`);
        };
    }, [router, resync]);

    // Taymer server soati bo'yicha: Pusher xabari kechiksa ham hamma ekranda bir xil
    useEffect(() => {
        if (phase !== 'question' || !question) return;
        const tick = () => {
            const start = question.questionStartTime ?? serverNow();
            const left = Math.max(0, Math.ceil((start + question.timeLimit * 1000 - serverNow()) / 1000));
            setTimeLeft(left);
            if (left <= 0 && endedForRef.current !== question.questionIndex) {
                endedForRef.current = question.questionIndex;
                fetch('/api/game/end-question', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: pinRef.current, questionIndex: question.questionIndex }),
                }).catch(() => { endedForRef.current = -1; });
            }
        };
        tick();
        const t = setInterval(tick, 250);
        return () => clearInterval(t);
    }, [phase, question]);

    const handleNext = useCallback(async () => {
        const pin = pinRef.current; if (!pin || nextBusy) return;
        setNextBusy(true); setAutoNextTime(null);
        const fromIndex = questionRef.current?.questionIndex;
        // Server band bo'lsa — qayta urinamiz; fromIndex tufayli takroriy so'rov savolni o'tkazib yubormaydi
        for (let attempt = 0; attempt < 4; attempt++) {
            try {
                const res = await fetch('/api/game/next', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin, fromIndex }),
                });
                if (res.ok) break;
            } catch { /* tarmoq */ }
            await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        }
        setNextBusy(false);
        resync();
    }, [nextBusy, resync]);

    useEffect(() => {
        if (autoNextTime === null || phase !== 'leaderboard') return;
        if (autoNextTime <= 0) { handleNext(); return; }
        const timer = setTimeout(() => setAutoNextTime(prev => (prev !== null ? prev - 1 : null)), 1000);
        return () => clearTimeout(timer);
    }, [autoNextTime, phase, handleNext]);

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

    const totalQ = question?.total || 1;
    // Ko'p o'quvchida: eng oldingi 8 tasi yo'lakda, qolganlari "+N" bo'lib ko'rsatiladi
    const ranked = [...players].sort((a, b) => b.correctCount - a.correctCount || b.score - a.score);
    const lanes = ranked.slice(0, MAX_LANES);
    const hidden = ranked.length - lanes.length;
    const laneHeight = lanes.length > 6 ? 'h-16' : lanes.length > 4 ? 'h-20' : 'h-28';

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
                
                <div className="flex items-center gap-3">
                    <button onClick={toggleMusic} title={musicOn ? "Musiqani o'chirish" : 'Musiqani yoqish'}
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-xl">{musicOn ? '🔊' : '🔇'}</button>
                    <div className="px-3 py-1.5 rounded-xl bg-white/10 font-black text-white" title="Javob berganlar">
                        ✋ {answered}/{players.length}
                    </div>
                    {phase === 'question' ? (
                        <span className={`text-3xl font-black tabular-nums ${timeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                            {timeLeft}s
                        </span>
                    ) : phase === 'leaderboard' ? (
                        <button onClick={handleNext} disabled={nextBusy} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-black px-6 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                            {nextBusy ? '⏳' : reveal?.isLastQuestion ? '🏁 Yakunlash' : `➡️ Keyingi savol ${autoNextTime !== null ? `(${autoNextTime}s)` : ''}`}
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Question Text (Optional overlay at the top) */}
            {question && (
                <div className="relative z-20 w-full flex justify-center mt-6 px-4">
                    <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 p-6 rounded-3xl max-w-4xl text-center shadow-2xl">
                        <h2 className="text-2xl md:text-4xl font-black text-white leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                            {question.text}
                        </h2>
                        {/* Savol tugagach — to'g'ri javob proyektorda: sinf bilan muhokama qilish uchun */}
                        {phase === 'leaderboard' && reveal && question.options?.length > 0 && (
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                {question.options.map((o, i) => {
                                    const ok = reveal.correctOptions.includes(i);
                                    return (
                                        <span key={i} className={`px-4 py-2 rounded-xl font-black text-lg ${ok ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]' : 'bg-white/10 text-white/40'}`}>
                                            {ok ? '✅ ' : ''}{o}
                                        </span>
                                    );
                                })}
                                {reveal.explanation && <p className="w-full text-white/70 font-semibold mt-1">💡 {reveal.explanation}</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Race Track */}
            <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-10 py-10 overflow-hidden">
                <div className="w-full max-w-7xl mx-auto space-y-3">
                    {lanes.map(player => {
                        // Progress based on exact correct answers
                        const correct = player.correctCount || 0;
                        let progressPct = (correct / totalQ) * 100;
                        if (progressPct > 100) progressPct = 100;
                        if (progressPct < 0) progressPct = 0;

                        return (
                            <motion.div layout key={player.id} className={`relative w-full ${laneHeight} bg-black/20 rounded-full border border-white/5`}>
                                {/* ── Lily pads + Frog share ONE coordinate space ── */}
                                <div className="absolute inset-y-0 left-10 right-10">
                                    {/* Lily pads: pad i is at exactly i/totalQ * 100% */}
                                    {Array.from({ length: totalQ + 1 }).map((_, i) => {
                                        const padPct = totalQ === 0 ? 0 : (i / totalQ) * 100;
                                        return (
                                            <div
                                                key={i}
                                                className="absolute w-12 h-12 -translate-x-1/2"
                                                style={{ left: `${padPct}%`, bottom: '8px' }}
                                            >
                                                <div className="w-full h-full bg-[url('/game/tezkor/lilypad.webp')] bg-contain bg-center bg-no-repeat drop-shadow-lg opacity-75" />
                                            </div>
                                        );
                                    })}

                                    {/* Frog: same left % as corresponding lily pad */}
                                    <div
                                        className="absolute -translate-x-1/2 z-20 flex flex-col items-end transition-[left] duration-[700ms]"
                                        style={{
                                            left: `${progressPct}%`,
                                            bottom: '8px',
                                            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        }}
                                    >
                                        {/* Nickname above frog */}
                                        <span className="self-center bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-md mb-0.5 whitespace-nowrap shadow">
                                            {player.nickname}
                                        </span>

                                        {/* Frog + shadow — w-12 h-12 matches lily pad size */}
                                        <div className="relative w-12 h-12">
                                            {/* Soya */}
                                            <div
                                                className="absolute bottom-0 left-1/2 w-10 h-2.5 bg-black/70 rounded-full blur-sm transition-all duration-[600ms]"
                                                style={{
                                                    transform: `translateX(-50%) ${player.isJumping ? 'scaleX(0.4) scaleY(0.3)' : 'scaleX(1) scaleY(1)'}`,
                                                    opacity: player.isJumping ? 0.1 : 0.6,
                                                }}
                                            />
                                            {/* Qurbaqa rasmi */}
                                            <div
                                                className="absolute inset-0 bg-contain bg-bottom bg-no-repeat transition-all duration-[600ms]"
                                                style={{
                                                    transformOrigin: 'bottom center',
                                                    backgroundImage: `url('/game/tezkor/${player.isJumping ? 'frog_jump.webp' : 'frog_idle.webp'}')`,
                                                    transform: player.isJumping
                                                        ? 'translateY(-36px) scaleX(1.1) scaleY(1.18) rotate(7deg)'
                                                        : 'translateY(0) scale(1) rotate(0deg)',
                                                }}
                                            />
                                        </div>

                                        {/* Score */}
                                        <span className="self-center text-emerald-300 font-black text-[11px] mt-0.5 drop-shadow">
                                            {player.score.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {hidden > 0 && (
                        <p className="text-center text-white/70 font-black bg-black/40 rounded-full py-2">
                            🐸 yana {hidden} ta o&apos;quvchi poygada — reytingni savol oxirida ko&apos;rasiz
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
