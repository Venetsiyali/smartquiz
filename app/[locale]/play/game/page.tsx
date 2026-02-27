'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';
import { motion, AnimatePresence } from 'framer-motion';
import SortGame from '@/components/SortGame';
import MatchGame, { type MatchPair, type MatchResult } from '@/components/MatchGame';
import BlitzGame from '@/components/BlitzGame';
import AnagramGame from '@/components/AnagramGame';
import TeamHUD, { type TeamData } from '@/components/TeamHUD';


interface QuestionPayload {
    questionIndex: number; total: number; text: string; options: string[];
    optionImages?: string[]; type?: 'multiple' | 'truefalse' | 'order' | 'match' | 'blitz' | 'anagram';
    pairs?: MatchPair[];
    anagramScrambled?: string; anagramWordLength?: number;
    timeLimit: number; imageUrl?: string; questionStartTime?: number;

}
interface AnswerResult {
    correct: boolean; points: number; totalScore: number; streak: number;
    streakFire?: boolean;
    correctOptions: number[]; explanation: string | null; options: string[];
    optionImages?: string[] | null;
    selectedOption: number;
    submittedOrder?: number[] | null;
    correctCount?: number | null;
    questionType?: string;
    matchResult?: MatchResult | null;
    correctWord?: string; // anagram
}

interface QuestionEndPayload {
    correctOptions: number[]; explanation?: string | null; options: string[];
    optionImages?: string[] | null;
    questionType?: string;
    leaderboard: LeaderboardEntry[]; isLastQuestion: boolean;
}
interface LeaderboardEntry { nickname: string; avatar: string; score: number; streak: number; rank: number; }
interface Badge { nickname: string; avatar: string; badge: string; icon: string; desc: string; }

const STYLES = [
    { icon: '🔴', label: 'A', isLight: false }, { icon: '🔵', label: 'B', isLight: false },
    { icon: '🟡', label: 'C', isLight: true }, { icon: '🟢', label: 'D', isLight: true },
];
const OPTION_BG = ['#e11d48', '#1d4ed8', '#ca8a04', '#15803d'];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const RANK_COLORS = ['#FFD600', '#C0C0C0', '#CD7F32', ...Array(7).fill('rgba(255,255,255,0.25)')];

function vibrate(pattern: number | number[]) {
    try { if ('vibrate' in navigator) navigator.vibrate(pattern); } catch { }
}

type PagePhase = 'loading' | 'question' | 'feedback' | 'review' | 'between' | 'ended';

export default function StudentGamePage() {
    const router = useRouter();
    const [question, setQuestion] = useState<QuestionPayload | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [result, setResult] = useState<AnswerResult | null>(null);
    const [phase, setPhase] = useState<PagePhase>('loading');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [reviewCountdown, setReviewCountdown] = useState(5);
    const [timeLeft, setTimeLeft] = useState(0);
    // Sorting game state
    const [sortItems, setSortItems] = useState<{ id: string; text: string; imageUrl?: string }[]>([]);
    const [sortSubmitted, setSortSubmitted] = useState(false);
    // Match game state
    const [matchSubmitted, setMatchSubmitted] = useState(false);
    // Blitz game state
    const [blitzSubmitted, setBlitzSubmitted] = useState(false);
    const [blitzResult, setBlitzResult] = useState<{ correct: boolean; points: number } | null>(null);
    // Anagram game state
    const [anagramSubmitted, setAnagramSubmitted] = useState(false);
    const [anagramResult, setAnagramResult] = useState<{ correct: boolean; points: number; correctWord: string } | null>(null);
    // Team mode state
    const [myTeam, setMyTeam] = useState<TeamData | null>(null);
    const [allTeams, setAllTeams] = useState<TeamData[]>([]);
    const [teamCombo, setTeamCombo] = useState(false);
    const [justCorrect, setJustCorrect] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reviewRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pinRef = useRef('');
    const playerIdRef = useRef('');
    const nextPhaseRef = useRef<PagePhase>('between');

    const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

    const startReviewTimer = (nextPhase: PagePhase) => {
        nextPhaseRef.current = nextPhase;
        setReviewCountdown(5);
        reviewRef.current = setInterval(() => {
            setReviewCountdown(prev => {
                if (prev <= 1) { clearInterval(reviewRef.current!); setPhase(nextPhaseRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const showQuestion = (payload: QuestionPayload) => {
        clearTimer(); if (reviewRef.current) clearInterval(reviewRef.current);
        setQuestion(payload); setSelected(null); setResult(null); setPhase('question');
        setSortSubmitted(false);
        setMatchSubmitted(false);
        setBlitzSubmitted(false);
        setBlitzResult(null);
        setAnagramSubmitted(false);
        setAnagramResult(null);

        // Build sort items with randomized IDs (server already shuffled order)
        if (payload.type === 'order') {
            setSortItems(payload.options.map((text, idx) => ({
                id: `item-${idx}`,
                text,
                imageUrl: payload.optionImages?.[idx],
            })));
        }
        const elapsed = payload.questionStartTime ? Math.floor((Date.now() - payload.questionStartTime) / 1000) : 0;
        const rem = Math.max(1, payload.timeLimit - elapsed);
        setTimeLeft(rem);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => { if (prev <= 1) { clearTimer(); return 0; } return prev - 1; });
        }, 1000);
        vibrate(30);
    };

    useEffect(() => {
        const pin = sessionStorage.getItem('playerPin');
        const pid = sessionStorage.getItem('playerId');
        if (!pin || !pid) { router.push('/play'); return; }
        pinRef.current = pin; playerIdRef.current = pid;
        setTotalScore(0);

        fetch(`/api/game/state?pin=${pin}`)
            .then(r => r.json())
            .then(data => { if (data.status === 'question' && data.currentQuestion) showQuestion(data.currentQuestion); })
            .catch(() => { });

        const pusher = getPusherClient();
        const gameCh = pusher.subscribe(`game-${pin}`);
        gameCh.bind('question-start', (payload: QuestionPayload) => showQuestion(payload));
        // Blitz: 1-second gap between questions
        gameCh.bind('blitz-between', () => {
            clearTimer();
            setPhase('between');
        });
        gameCh.bind('question-end', (payload: QuestionEndPayload) => {

            clearTimer();
            // If already in feedback/review, stay — review auto-advances to between
            if (phase === 'question') {
                setLeaderboard(payload.leaderboard);
                setPhase('between');
            } else {
                // Will advance naturally via review countdown
                nextPhaseRef.current = 'between';
                setLeaderboard(payload.leaderboard);
            }
        });
        gameCh.bind('game-end', ({ leaderboard: lb, badges: bs }: { leaderboard: LeaderboardEntry[]; badges: Badge[] }) => {
            clearTimer(); if (reviewRef.current) clearInterval(reviewRef.current);
            setLeaderboard(lb); setBadges(bs || []);
            setPhase('ended'); vibrate([100, 50, 200]);
        });
        gameCh.bind('return-to-lobby', () => {
            router.push('/play/waiting');
        });

        const playerCh = pusher.subscribe(`player-${pid}`);
        playerCh.bind('answer-result', (r: AnswerResult) => {
            clearTimer(); setResult(r); setTotalScore(r.totalScore);
            setStreak(r.streak);
            // Blitz: just flash result inline, stay in question phase (auto-advance from server)
            if (r.questionType === 'blitz') {
                setBlitzSubmitted(true);
                setBlitzResult({ correct: r.correct, points: r.points });
                return;
            }
            // Anagram: stay in question phase — AnagramGame shows its own result overlay
            if (r.questionType === 'anagram') {
                setAnagramSubmitted(true);
                setAnagramResult({ correct: r.correct, points: r.points, correctWord: r.correctWord || '' });
                // Auto-advance to review after 3s
                setTimeout(() => { setPhase('review'); startReviewTimer('between'); }, 3000);
                return;
            }
            setPhase('feedback');
            vibrate(r.correct ? [80, 40, 80] : 300);
            setTimeout(() => { setPhase('review'); startReviewTimer('between'); }, 2000);
        });
        // Team mode: assign my team and listen for updates
        const myPlayerId = pid;
        gameCh.bind('team-assigned', (data: { teams: TeamData[]; playerTeams: { id: string; teamId: string }[] }) => {
            setAllTeams(data.teams);
            const pt = data.playerTeams.find(p => p.id === myPlayerId);
            if (pt) {
                const t = data.teams.find(t => t.id === pt.teamId);
                if (t) setMyTeam(t);
            }
        });
        gameCh.bind('team-update', (data: { teams: TeamData[]; combo?: { teamId: string; bonus: number } | null }) => {
            setAllTeams(data.teams);
            setMyTeam(prev => {
                if (!prev) return prev;
                return data.teams.find(t => t.id === prev.id) || prev;
            });
            if (data.combo) {
                setTeamCombo(true);
                setTimeout(() => setTeamCombo(false), 2500);
            }
        });

        return () => {
            pusher.unsubscribe(`game-${pin}`); pusher.unsubscribe(`player-${pid}`);
            clearTimer(); if (reviewRef.current) clearInterval(reviewRef.current);
        };
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

    // Submit sorted order
    const handleSortSubmit = async (orderedIds: string[]) => {
        if (sortSubmitted || phase !== 'question') return;
        setSortSubmitted(true); vibrate(40);
        // Map IDs back to indices
        const submittedOrder = orderedIds.map(id => parseInt(id.replace('item-', '')));
        await fetch('/api/game/answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinRef.current, playerId: playerIdRef.current, submittedOrder }),
        });
    };

    // Submit match result when all pairs matched
    const handleMatchComplete = async (mr: MatchResult) => {
        if (matchSubmitted || phase !== 'question') return;
        setMatchSubmitted(true);
        vibrate(mr.cleanSweep ? [80, 40, 80, 40, 120] : 60);
        await fetch('/api/game/answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinRef.current, playerId: playerIdRef.current, matchResult: mr }),
        });
    };

    const handleBlitzAnswer = async (optionIndex: number) => {
        if (blitzSubmitted || phase !== 'question') return;
        setBlitzSubmitted(true);
        vibrate(40);
        await fetch('/api/game/answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinRef.current, playerId: playerIdRef.current, optionIndex }),
        });
    };

    const handleAnagramSubmit = async (answer: string, hintsUsed: number, completedMs: number) => {
        if (anagramSubmitted || phase !== 'question') return;
        setAnagramSubmitted(true);
        vibrate(40);
        await fetch('/api/game/answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pin: pinRef.current, playerId: playerIdRef.current,
                anagramAnswer: answer, anagramHintsUsed: hintsUsed, anagramCompletedMs: completedMs,
            }),
        });
    };

    const pct = question ? (timeLeft / question.timeLimit) * 100 : 100;

    const tColor = !question ? '#0056b3' : timeLeft > question.timeLimit * 0.6 ? '#00E676' : timeLeft > question.timeLimit * 0.3 ? '#FFD600' : '#FF1744';
    const myNick = typeof window !== 'undefined' ? sessionStorage.getItem('playerNickname') || '' : '';
    const myAvatar = typeof window !== 'undefined' ? sessionStorage.getItem('playerAvatar') || '🤖' : '🤖';

    /* ── TeamHUD — persistent overlay across all phases ── */
    // (renders fixed overlay; safe to include before early-returns)
    const teamHud = myTeam ? (
        <TeamHUD
            myTeam={myTeam}
            allTeams={allTeams}
            justAnsweredCorrect={justCorrect}
            comboTriggered={teamCombo}
        />
    ) : null;

    /* ── Blitz ── full screen takeover */
    if (phase === 'question' && question?.type === 'blitz') return (
        <>
            {teamHud}
            <BlitzGame
                text={question.text}
                timeLimit={question.timeLimit}
                questionIndex={question.questionIndex}
                total={question.total}
                streak={streak}
                totalScore={totalScore}
                questionStartTime={question.questionStartTime}
                onAnswer={handleBlitzAnswer}
                answered={blitzSubmitted}
                lastResult={blitzResult}
            />
        </>
    );

    /* ── Anagram ── full screen takeover */
    if (phase === 'question' && question?.type === 'anagram') return (
        <AnagramGame
            scrambled={question.anagramScrambled || question.text}
            wordLength={question.anagramWordLength || (question.anagramScrambled?.length ?? question.text.length)}
            clue={question.text}
            timeLimit={question.timeLimit}
            questionIndex={question.questionIndex}
            total={question.total}
            streak={streak}
            totalScore={totalScore}
            questionStartTime={question.questionStartTime}
            imageUrl={question.imageUrl}
            onSubmit={handleAnagramSubmit}
            submitted={anagramSubmitted}
            result={anagramResult}
        />
    );

    /* ── Loading ── */
    if (phase === 'loading') return (

        <div className="bg-player min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="text-7xl animate-bounce">🎮</div>
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
                    <div className="glass-blue px-3 py-1.5 rounded-xl">
                        <span className="text-white font-extrabold text-sm">{question.questionIndex + 1}/{question.total}</span>
                    </div>
                    {question.type === 'order' && (
                        <div className="glass px-2.5 py-1 rounded-xl">
                            <span className="text-yellow-400 font-black text-xs">🔗 ZANJIR</span>
                        </div>
                    )}
                    {question.type === 'match' && (
                        <div className="glass px-2.5 py-1 rounded-xl">
                            <span className="font-black text-xs" style={{ color: '#a78bfa' }}>💎 MATCH</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {streak >= 3 && (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
                            className="flex items-center gap-1 glass px-2 py-1 rounded-lg">
                            <span className="text-base">🔥</span>
                            <span className="text-orange-400 font-black text-sm">{streak}</span>
                        </motion.div>
                    )}
                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: tColor }} />
                    </div>
                    <span className="font-black text-xl w-7 text-right" style={{ color: tColor }}>{timeLeft}</span>
                </div>
                <div className="glass px-2.5 py-1.5 rounded-xl">
                    <span className="text-yellow-400 font-extrabold text-sm">{totalScore.toLocaleString()} 🏅</span>
                </div>
            </div>

            {/* Question card */}
            <div className="glass p-4 rounded-2xl mb-4">
                {question.imageUrl && <img src={question.imageUrl} alt="" className="w-full max-h-36 object-cover rounded-xl mb-3" />}
                <p className="text-white font-extrabold text-lg leading-snug text-center">{question.text}</p>
            </div>

            {/* ── MATCH / Terminlar jangi ── */}
            {question.type === 'match' ? (
                <div className="flex-1 overflow-y-auto pb-4">
                    {question.pairs && question.pairs.length > 0 ? (
                        <MatchGame
                            pairs={question.pairs}
                            timeLimit={question.timeLimit}
                            onComplete={handleMatchComplete}
                            result={null}
                        />
                    ) : (
                        <p className="text-white/40 text-center font-bold">Juftliklar yuklanmoqda...</p>
                    )}
                    {matchSubmitted && (
                        <p className="text-center text-white/40 font-bold text-xs mt-3 animate-pulse">
                            ✅ Bajarildi! Boshqalar kutilmoqda...
                        </p>
                    )}
                </div>
            ) : question.type === 'order' ? (
                <div className="flex-1 overflow-y-auto pb-4">
                    <SortGame
                        question={question.text}
                        items={sortItems}
                        timeLeft={timeLeft}
                        timeLimit={question.timeLimit}
                        onSubmit={handleSortSubmit}
                        result={result ? {
                            correct: result.correct,
                            points: result.points,
                            streak: result.streak,
                            streakFire: result.streakFire || false,
                            correctOrder: result.correctOptions.map(i => `item-${i}`),
                            submittedOrder: (result.submittedOrder || []).map(i => `item-${i}`),
                            explanation: result.explanation,
                        } : null}
                        disabled={sortSubmitted}
                    />
                </div>
            ) : (
                /* ── MCQ / TrueFalse ── */
                <>
                    <div className={`grid gap-3 flex-1 ${question.options.length === 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {question.options.map((opt, i) => (
                            <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                                className={`btn-answer flex-col h-full min-h-24 rounded-2xl gap-2
                  ${selected === i ? 'ring-4 ring-white scale-95 brightness-125' : ''}
                  ${selected !== null && selected !== i ? 'opacity-50' : ''}`}
                                style={{
                                    background: `linear-gradient(135deg, ${OPTION_BG[i]}, ${OPTION_BG[i]}cc)`,
                                    color: STYLES[i].isLight ? '#0a1a0a' : 'white',
                                }}>
                                <span className="text-3xl">{STYLES[i].icon}</span>
                                <span className="text-sm font-extrabold text-center leading-snug px-1">{opt}</span>
                            </button>
                        ))}
                    </div>
                    {selected !== null && (
                        <p className="text-center text-white/40 font-bold text-xs mt-3 animate-pulse">⏳ Boshqalar javob berishini kutmoqda...</p>
                    )}
                </>
            )}
        </div>
    );

    /* ── Feedback ── */
    if ((phase === 'feedback' || phase === 'review') && result) return (
        <div className="bg-player min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-5">
            {/* Result indicator */}
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                style={{
                    background: result.correct ? 'linear-gradient(135deg, #00E676, #009944)' : 'linear-gradient(135deg, #FF1744, #aa0030)',
                    boxShadow: result.correct ? '0 0 60px rgba(0,230,118,0.5)' : '0 0 60px rgba(255,23,68,0.5)',
                }}>
                {result.correct ? '✅' : '❌'}
            </motion.div>

            <div>
                <h2 className="text-3xl font-black text-white">{result.correct ? "To'g'ri!" : "Noto'g'ri!"}</h2>
                {result.correct && streak >= 3 && (
                    <motion.p animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: 2, duration: 0.5 }}
                        className="text-orange-400 font-extrabold text-lg mt-1">
                        🔥 {streak} ketma-ket! (+1.2x)
                    </motion.p>
                )}
            </div>

            {result.correct && (
                <div className="glass-blue px-8 py-4 rounded-2xl">
                    <p className="text-white/50 font-bold text-xs">QO&apos;SHILDI</p>
                    <p className="text-4xl font-black" style={{ color: '#FFD600' }}>+{result.points}</p>
                    <p className="text-white/40 text-xs mt-1">Jami: {result.totalScore.toLocaleString()}</p>
                </div>
            )}

            {/* Review screen — shows after 2s */}
            {phase === 'review' && (
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-sm space-y-3">
                    <p className="text-white/50 font-bold text-xs tracking-widest">JAVOBLAR KO&apos;RSATMASI</p>

                    {/* Options with highlight */}
                    <div className="space-y-2">
                        {result.options.map((opt, i) => {
                            const isCorrect = result.correctOptions.includes(i);
                            const isSelected = i === result.selectedOption;
                            let bg = 'rgba(255,255,255,0.06)'; let border = 'transparent'; let textColor = 'rgba(255,255,255,0.4)';
                            if (isCorrect) { bg = 'rgba(0,230,118,0.15)'; border = '#00E676'; textColor = '#00E676'; }
                            if (isSelected && !isCorrect) { bg = 'rgba(255,23,68,0.15)'; border = '#FF1744'; textColor = '#FF1744'; }
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: bg, border: `1.5px solid ${border}` }}>
                                    <span className="text-xl">{STYLES[i].icon}</span>
                                    <span className="flex-1 font-bold text-sm text-left" style={{ color: textColor }}>{opt}</span>
                                    {isCorrect && <span className="text-green-400 text-lg">✓</span>}
                                    {isSelected && !isCorrect && <span className="text-red-400 text-lg">✗</span>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {result.explanation && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            className="glass-blue p-4 rounded-2xl text-left">
                            <p className="text-blue-300 font-black text-xs tracking-widest mb-1">💡 BILASIZMI?</p>
                            <p className="text-white/80 text-sm font-semibold leading-relaxed">{result.explanation}</p>
                        </motion.div>
                    )}

                    <p className="text-white/30 text-xs font-bold animate-pulse">Davom etish: {reviewCountdown}s...</p>
                </motion.div>
            )}
        </div>
    );

    /* ── Between questions ── */
    if (phase === 'between') {
        const myEntry = leaderboard.find(e => e.nickname === myNick);
        return (
            <div className="bg-player min-h-screen flex flex-col items-center justify-center p-5">
                <h2 className="text-2xl font-black text-white mb-5">🏆 Natijalar</h2>
                <div className="w-full max-w-sm space-y-2.5 mb-5">
                    {leaderboard.slice(0, 10).map((e, i) => (
                        <motion.div key={i} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                            className="flex items-center gap-3 p-3.5 rounded-2xl"
                            style={{
                                background: e.nickname === myNick ? 'rgba(0,86,179,0.3)' : 'rgba(255,255,255,0.07)',
                                border: e.nickname === myNick ? '2px solid #0056b3' : 'none',
                            }}>
                            <span className="text-xl">{RANK_ICONS[i]}</span>
                            <span className="text-2xl">{e.avatar}</span>
                            <span className="flex-1 font-bold text-white text-sm">{e.nickname}{e.nickname === myNick ? ' 👈' : ''}</span>
                            {e.streak >= 3 && <span className="text-sm">🔥{e.streak}</span>}
                            <span className="font-extrabold text-sm" style={{ color: RANK_COLORS[i] }}>{e.score.toLocaleString()}</span>
                        </motion.div>
                    ))}
                </div>
                {myEntry && (
                    <div className="glass-blue px-6 py-3 rounded-2xl mb-4 text-center">
                        <p className="text-white/50 text-xs font-bold">Sizning ballingiz</p>
                        <p className="text-2xl font-black" style={{ color: '#FFD600' }}>{myNick} · {myEntry.score.toLocaleString()}</p>
                    </div>
                )}
                <div className="flex gap-2">
                    {[0, 1, 2].map(i => <div key={i} className="w-3 h-3 rounded-full animate-bounce"
                        style={{ background: ['#0056b3', '#FFD600', '#00E676'][i], animationDelay: `${i * 0.2}s` }} />)}
                </div>
                <p className="text-white/40 font-bold mt-2 text-sm animate-pulse">Keyingi savol kutilmoqda...</p>
            </div>
        );
    }

    /* ── Game Ended ── */
    if (phase === 'ended') {
        const myEntry = leaderboard.find(e => e.nickname === myNick);
        const myBadge = badges.find(b => b.nickname === myNick);
        return (
            <div className="bg-player min-h-screen flex flex-col items-center justify-center p-5 text-center space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-7xl">🎉</motion.div>
                <h1 className="text-3xl font-black text-white">O&apos;yin Tugadi!</h1>

                {myBadge && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                        className="glass px-6 py-4 rounded-2xl text-center" style={{ border: '1px solid rgba(255,214,0,0.4)' }}>
                        <div className="text-5xl mb-1">{myBadge.icon}</div>
                        <p className="text-yellow-400 font-black text-lg">{myBadge.badge}</p>
                        <p className="text-white/50 text-xs">{myBadge.desc}</p>
                    </motion.div>
                )}

                {myEntry && (
                    <div className="glass-blue px-8 py-4 rounded-2xl">
                        <p className="text-white/50 font-bold text-xs">SIZNING NATIJANGIZ</p>
                        <p className="text-5xl mt-1">{RANK_ICONS[Math.min(myEntry.rank - 1, RANK_ICONS.length - 1)]}</p>
                        <p className="text-2xl font-extrabold mt-1" style={{ color: '#FFD600' }}>{myEntry.score.toLocaleString()} ball</p>
                    </div>
                )}

                <div className="w-full max-w-sm space-y-2">
                    {leaderboard.slice(0, 5).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 glass p-3 rounded-2xl">
                            <span className="text-2xl">{RANK_ICONS[i]}</span>
                            <span className="text-2xl">{e.avatar}</span>
                            <span className="flex-1 font-bold text-white text-sm">{e.nickname}</span>
                            <span className="font-extrabold text-sm" style={{ color: RANK_COLORS[i] }}>{e.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <button onClick={() => router.push('/')} className="btn-primary w-full max-w-sm justify-center">🏠 Bosh sahifa</button>
            </div>
        );
    }

    return null;
}
