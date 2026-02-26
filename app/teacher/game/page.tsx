'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '@/lib/subscriptionContext';
import BlitzRaceBar from '@/components/BlitzRaceBar';
import TeamRaceTrack, { type TeamData } from '@/components/TeamRaceTrack';



interface LeaderboardEntry { nickname: string; avatar: string; score: number; streak: number; rank: number; }
interface MatchPair { term: string; definition: string; }
interface QuestionPayload {
    questionIndex: number; total: number; text: string; options: string[];
    type?: 'multiple' | 'truefalse' | 'order' | 'match' | 'blitz' | 'anagram';
    pairs?: MatchPair[];
    timeLimit: number; imageUrl?: string; questionStartTime?: number;
}

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
    const { isPro } = useSubscription();
    const pinRef = useRef<string | null>(null);
    const [phase, setPhase] = useState<'loading' | 'question' | 'leaderboard' | 'badges' | 'ended'>('loading');
    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [questionEnd, setQuestionEnd] = useState<QuestionEndPayload | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const channelRef = useRef<any>(null);
    const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([]);
    // Blitz race bar state
    const [blitzLeaderboard, setBlitzLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [blitzAnsweredCount, setBlitzAnsweredCount] = useState(0);
    const [blitzTotalPlayers, setBlitzTotalPlayers] = useState(0);
    // Team mode state
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [teamCombo, setTeamCombo] = useState<{ teamId: string; bonus: number } | null>(null);

    // AI Voice synthesis
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const speakQuestion = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'uz-UZ';
        utt.rate = 0.9;
        utt.pitch = 1.0;
        utt.volume = 1.0;
        // Try to find Uzbek voice, fall back to default
        const voices = window.speechSynthesis.getVoices();
        const uzVoice = voices.find(v => v.lang.startsWith('uz')) ||
            voices.find(v => v.lang.startsWith('ru')) ||
            voices[0];
        if (uzVoice) utt.voice = uzVoice;
        window.speechSynthesis.speak(utt);
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
        const pusher = getPusherClient();
        channelRef.current = pusher.subscribe(`game-${pin}`);

        channelRef.current.bind('question-start', (payload: QuestionPayload) => {
            setQuestion(payload); setPhase('question'); setQuestionEnd(null);
            // Reset blitz state on new question
            if (payload.type === 'blitz') {
                setBlitzAnsweredCount(0);
            }
            startTimer(payload.timeLimit, pin);
            if (voiceEnabled) speakQuestion(payload.text);
        });
        // Blitz race bar: live updates as players answer
        channelRef.current.bind('blitz-answer-update', (data: { leaderboard: LeaderboardEntry[]; answeredCount: number; totalPlayers: number }) => {
            setBlitzLeaderboard(data.leaderboard);
            setBlitzAnsweredCount(data.answeredCount);
            setBlitzTotalPlayers(data.totalPlayers);
        });
        // Team mode listeners
        channelRef.current.bind('team-assigned', (data: { teams: TeamData[] }) => {
            setTeams(data.teams);
        });
        channelRef.current.bind('team-update', (data: { teams: TeamData[]; combo?: { teamId: string; bonus: number } | null }) => {
            setTeams(data.teams);
            if (data.combo) {
                setTeamCombo(data.combo);
                setTimeout(() => setTeamCombo(null), 2500);
            }
        });

        channelRef.current.bind('question-end', (payload: QuestionEndPayload) => {
            clearTimer();
            if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
            setQuestionEnd(payload); setPhase('leaderboard');
        });
        channelRef.current.bind('game-end', (payload: GameEndPayload) => {
            clearTimer(); setFinalLeaderboard(payload.leaderboard); setBadges(payload.badges || []); setPhase('badges');
            setTimeout(fireConfetti, 300);
        });
        channelRef.current.bind('pusher:subscription_succeeded', () => {
            fetch('/api/game/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
        });

        return () => { pusher.unsubscribe(`game-${pin}`); clearTimer(); if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
    }, [router, startTimer, voiceEnabled, speakQuestion]);

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

    /* ── Blitz Question Phase — full BlitzRaceBar takeover ── */
    if (phase === 'question' && question?.type === 'blitz') return (
        <BlitzRaceBar
            leaderboard={blitzLeaderboard}
            answeredCount={blitzAnsweredCount}
            totalPlayers={blitzTotalPlayers}
            questionIndex={question.questionIndex}
            total={question.total}
            timeLeft={timeLeft}
            timeLimit={question.timeLimit}
            questionText={question.text}
            pin={typeof window !== 'undefined' ? sessionStorage.getItem('gamePin') || '' : ''}
            onSkip={async () => {
                const pin = typeof window !== 'undefined' ? sessionStorage.getItem('gamePin') || '' : '';
                await fetch('/api/game/blitz-next', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin, fromIndex: question.questionIndex }),
                });
            }}
        />
    );

    /* ── Anagram Question Phase — projector view ── */
    if (phase === 'question' && question?.type === 'anagram') return (
        <div className="bg-host min-h-screen flex flex-col items-center justify-center gap-8 p-8"
            style={{
                background: question.imageUrl
                    ? `linear-gradient(to bottom, rgba(10,15,40,0.93) 0%, rgba(10,15,40,0.88) 100%), url(${question.imageUrl}) center/cover no-repeat`
                    : undefined,
            }}>
            <div className="glass px-5 py-2 rounded-xl flex items-center gap-2" style={{ border: '1px solid rgba(99,102,241,0.4)' }}>
                <span className="text-2xl">🔐</span>
                <span className="font-black tracking-widest" style={{ color: '#818cf8' }}>YASHIRIN KOD</span>
                <span className="text-white/40 font-bold text-sm ml-2">Savol {question.questionIndex + 1}/{question.total}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white text-center leading-tight max-w-4xl"
                style={{ textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>{question.text}</h2>
            {/* Timer */}
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                    <svg className="absolute" width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34" fill="none" stroke={tColor} strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                            className="timer-ring" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-black text-2xl" style={{ color: tColor }}>{timeLeft}</span>
                </div>
            </div>
            <motion.p
                animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white/50 font-bold text-lg">
                🔐 Talabalar so&apos;zni tiklashmoqda...
            </motion.p>
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
                <div className="flex items-center gap-3">
                    <button onClick={() => {
                        const next = !voiceEnabled;
                        setVoiceEnabled(next);
                        if (!next && typeof window !== 'undefined') window.speechSynthesis?.cancel();
                    }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                        style={{
                            background: voiceEnabled ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.07)',
                            border: `1px solid ${voiceEnabled ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.15)'}`,
                            color: voiceEnabled ? '#00E676' : 'rgba(255,255,255,0.4)',
                        }}>
                        {voiceEnabled ? '🎙️' : '🔇'} AI Ovoz
                    </button>
                    <div className="glass px-5 py-2 rounded-xl">
                        <span className="text-white/50 text-sm font-bold">PIN: </span>
                        <span className="text-yellow-400 font-black text-xl tracking-widest">{typeof window !== 'undefined' ? sessionStorage.getItem('gamePin') || '' : ''}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8 md:px-16 py-8">
                {/* Question type badge */}
                <div className="flex items-center gap-2 mb-2">
                    {question.type === 'match' && (
                        <div className="glass px-3 py-1 rounded-xl">
                            <span className="font-black text-sm" style={{ color: '#a78bfa' }}>💎 TERMINLAR JANGI</span>
                        </div>
                    )}
                    {question.type === 'order' && (
                        <div className="glass px-3 py-1 rounded-xl">
                            <span className="text-yellow-400 font-black text-sm">🔗 MANTIQIY ZANJIR</span>
                        </div>
                    )}
                </div>

                {question.imageUrl && <img src={question.imageUrl} alt="" className="max-h-52 rounded-3xl object-cover shadow-2xl" />}
                <h2 className="text-3xl md:text-5xl font-black text-white text-center leading-tight max-w-5xl"
                    style={{ textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>{question.text}</h2>

                {/* Match type — show pair preview on host screen */}
                {question.type === 'match' && question.pairs && (
                    <div className="w-full max-w-3xl">
                        <div className="grid grid-cols-2 gap-3">
                            {question.pairs.slice(0, 4).map((p, i) => (
                                <div key={i} className="glass p-3 rounded-xl flex items-center gap-3 opacity-70">
                                    <span className="text-2xl">💎</span>
                                    <div>
                                        <p className="text-blue-300 font-black text-sm">{p.term}</p>
                                        <p className="text-purple-300 font-bold text-xs opacity-70">{p.definition}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {question.pairs.length > 4 && (
                            <p className="text-white/30 text-center text-sm font-bold mt-2">+{question.pairs.length - 4} ta juft ko&apos;rsatilmadi</p>
                        )}
                        <motion.p
                            animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-center text-white/50 font-bold text-lg mt-4">
                            ⏳ Talabalar juftliklarni taqashtirmoqda...
                        </motion.p>
                    </div>
                )}

                {/* Order type — waiting message */}
                {question.type === 'order' && (
                    <motion.p
                        animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-center text-white/50 font-bold text-2xl">
                        ⏳ Talabalar tartiblab javob bermoqda...
                    </motion.p>
                )}

                {/* MCQ/TF — show option grid as before */}
                {(question.type === 'multiple' || question.type === 'truefalse' || !question.type) && (
                    <div className="grid grid-cols-2 gap-5 w-full max-w-5xl">
                        {question.options.map((opt, i) => (
                            <div key={i} className={`btn-answer text-xl md:text-2xl justify-start`}>
                                <span className="text-3xl">{OPTION_COLORS[i].icon}</span>
                                <span className="font-extrabold mr-2">{OPTION_COLORS[i].label}.</span>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="h-2 bg-white/10">
                <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, background: tColor, boxShadow: `0 0 14px ${tColor}` }} />
            </div>

            {/* Team Race Track — fixed right overlay during question */}
            {teams.length > 0 && (
                <div className="fixed right-4 top-24 w-72 z-30">
                    <TeamRaceTrack
                        teams={teams}
                        maxScore={Math.max(...teams.map(t => t.score), 1) * 1.5}
                        combo={teamCombo}
                        isPro={isPro}
                        phase="question"
                        onShield={async (teamId) => {
                            const pin = typeof window !== 'undefined' ? sessionStorage.getItem('gamePin') || '' : '';
                            await fetch('/api/game/team-shield', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ pin, teamId }),
                            });
                        }}
                    />
                </div>
            )}
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
