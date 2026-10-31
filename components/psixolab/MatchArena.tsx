'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { serverNow } from '@/lib/serverClock';
import { formatClock } from '@/components/code-race/utils';

export interface MatchRoundView {
    index: number; count: number; title: string;
    lefts: string[]; rights: string[]; matched: boolean[]; matchedRights: string[];
}
interface MatchState {
    startedAt: number | null; durationSec: number; taskCount: number; playerCount: number;
    me: { solved: number; rank: number } | null;
    uiLang?: 'uz' | 'ru';
    match?: { penaltySec: number; rounds: number };
    matchRound?: MatchRoundView | null;
    mistakes?: number;
}

const TXT = {
    uz: { round: 'Raund', hint: 'Chapdagi elementni, soʻng unga mos javobni bosing', mistakes: 'Xatolar', penalty: 'jarima', rank: 'Oʻrin', next: 'Keyingi raund!' },
    ru: { round: 'Раунд', hint: 'Нажмите элемент слева, затем подходящий ответ справа', mistakes: 'Ошибки', penalty: 'штраф', rank: 'Место', next: 'Следующий раунд!' },
};

export default function MatchArena({ state, pin, playerId, onChange }: {
    state: MatchState; pin: string; playerId: string; onChange: () => void;
}) {
    const tx = TXT[state.uiLang === 'ru' ? 'ru' : 'uz'];
    const penaltySec = state.match?.penaltySec ?? 5;
    const [round, setRound] = useState<MatchRoundView | null>(state.matchRound ?? null);
    const [solved, setSolved] = useState(state.me?.solved ?? 0);
    const [mistakes, setMistakes] = useState(state.mistakes ?? 0);
    const [sel, setSel] = useState<number | null>(null);
    const [wrong, setWrong] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const [banner, setBanner] = useState(false);

    useEffect(() => { const t = setInterval(() => setNow(serverNow()), 500); return () => clearInterval(t); }, []);
    // Sahifa qayta ochilganda server holatiga moslashamiz
    useEffect(() => {
        if (busy) return;
        if ((state.me?.solved ?? 0) > solved || (!round && state.matchRound)) {
            setRound(state.matchRound ?? null); setSolved(state.me?.solved ?? 0); setMistakes(state.mistakes ?? 0);
        }
    }, [state.matchRound, state.me?.solved, state.mistakes, solved, round, busy]);

    const pick = useCallback(async (right: string) => {
        if (busy || sel === null || !round) return;
        setBusy(true);
        try {
            const res = await fetch('/api/code-race/match', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, playerId, round: round.index, left: sel, right }),
            });
            const data = await res.json();
            if (data.ended || (data.finished && !('correct' in data))) { onChange(); return; }
            setSolved(data.solved); setMistakes(data.mistakes);
            if (data.stale) { setRound(data.round); setSel(null); return; }
            if (data.correct) {
                if (navigator.vibrate) navigator.vibrate(40);
                setSel(null);
                if (data.finished) {
                    confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
                    setTimeout(onChange, 1200);
                } else if (data.round && data.round.index !== round.index) {
                    setRound({ ...round, matched: round.lefts.map(() => true), matchedRights: round.rights });
                    setBanner(true);
                    setTimeout(() => { setBanner(false); setRound(data.round); }, 900);
                } else {
                    setRound(data.round);
                }
            } else {
                if (navigator.vibrate) navigator.vibrate(250);
                setWrong(right);
                setTimeout(() => setWrong(null), 700);
            }
        } catch { /* tarmoq — qayta bosish mumkin */ } finally { setBusy(false); }
    }, [busy, sel, round, pin, playerId, onChange]);

    const remaining = (state.startedAt ?? 0) + state.durationSec * 1000 - now;
    const progress = Math.min(solved / Math.max(state.taskCount, 1), 1);
    if (!round) return null;
    const usedRights = new Set(round.matchedRights);

    return (
        <div className="min-h-screen bg-[#0b0a1f] text-white p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: 'linear-gradient(90deg,#8b5cf6,#22c55e)' }}
                            animate={{ width: `${progress * 100}%` }} />
                    </div>
                    <div className={`px-3 py-2 rounded-xl font-black tabular-nums ${remaining < 60_000 ? 'bg-red-500/20 text-red-300' : 'bg-white/5'}`}>⏱ {formatClock(remaining)}</div>
                </div>
                <div className="flex justify-between text-sm font-black text-white/60">
                    <span>🧩 {solved}/{state.taskCount}</span>
                    <span className={mistakes ? 'text-red-300' : ''}>❌ {tx.mistakes}: {mistakes}{penaltySec ? ` (+${mistakes * penaltySec} s ${tx.penalty})` : ''}</span>
                    <span>{tx.rank} <span className="text-yellow-300">#{state.me?.rank ?? '–'}</span>/{state.playerCount}</span>
                </div>

                <div>
                    <p className="text-violet-300 text-xs font-black uppercase tracking-widest">{tx.round} {round.index + 1}/{round.count}</p>
                    <h2 className="text-xl font-black">{round.title}</h2>
                    <p className="text-white/40 text-xs font-semibold mt-1">{tx.hint}{penaltySec ? ` · ❌ = +${penaltySec} s` : ''}</p>
                </div>

                <AnimatePresence>
                    {banner && (
                        <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="text-center text-2xl font-black text-emerald-300">✅ {tx.next}</motion.p>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-2">
                        {round.lefts.map((l, i) => (
                            <button key={l} disabled={round.matched[i]} onClick={() => setSel(sel === i ? null : i)}
                                className={`w-full min-h-[64px] text-left rounded-xl px-3 py-2 text-sm font-bold border-2 transition-colors ${round.matched[i] ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200/70' : sel === i ? 'border-violet-400 bg-violet-500/25' : 'border-white/10 bg-white/[0.05]'}`}>
                                {round.matched[i] ? '✅ ' : ''}{l}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {round.rights.map(r => {
                            const used = usedRights.has(r);
                            return (
                                <motion.button key={r} disabled={used || sel === null} onClick={() => pick(r)}
                                    animate={wrong === r ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
                                    className={`w-full min-h-[64px] text-left rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-colors ${used ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200/70' : wrong === r ? 'border-red-400 bg-red-500/20' : sel !== null ? 'border-white/20 bg-white/[0.07] hover:border-violet-300' : 'border-white/10 bg-white/[0.03] text-white/70'}`}>
                                    {r}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
