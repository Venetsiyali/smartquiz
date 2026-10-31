'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { serverNow } from '@/lib/serverClock';
import { memoryPhase, type MemoryConfig } from '@/lib/psixolab/memory';
import type { raceT } from '@/components/code-race/raceI18n';

interface MemoryState {
    status: 'lobby' | 'running' | 'ended';
    startedAt: number | null;
    playerCount: number;
    memory?: { kind: MemoryConfig['kind']; count: number; intervalMs: number; recallSec: number; items?: string[] };
    me: { solved: number; rank: number; attempts?: number; recalled?: number[] } | null;
}

/** Talaba telefoni: soʻzlar koʻrsatilayotganda — "proyektorga qarang", soʻng 60 soniya yozish, oxirida natija. */
export default function MemoryPlayer({ state, pin, playerId, onChange, t }: {
    state: MemoryState; pin: string; playerId: string; onChange: () => void; t: ReturnType<typeof raceT>;
}) {
    const [now, setNow] = useState(() => serverNow());
    const [text, setText] = useState('');
    const [sent, setSent] = useState<{ recalled: number[]; total: number } | null>(null);
    const [busy, setBusy] = useState(false);
    const autoSent = useRef(false);
    const textRef = useRef('');
    textRef.current = text;

    useEffect(() => { const i = setInterval(() => setNow(serverNow()), 200); return () => clearInterval(i); }, []);

    const m = state.memory;
    const cfg: MemoryConfig | null = m ? { items: Array(m.count).fill(''), kind: m.kind, intervalMs: m.intervalMs, recallSec: m.recallSec } : null;
    const p = cfg && state.startedAt ? memoryPhase(cfg, state.startedAt, now) : null;
    const alreadySent = sent || (state.me?.attempts ?? 0) > 0;

    const submit = useCallback(async () => {
        if (busy || autoSent.current) return;
        autoSent.current = true;
        setBusy(true);
        try {
            const res = await fetch('/api/code-race/recall', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, playerId, answer: textRef.current }),
            });
            const data = await res.json();
            if (res.ok) setSent({ recalled: data.recalled ?? [], total: data.total ?? m?.count ?? 0 });
            else autoSent.current = false;
        } catch { autoSent.current = false; } finally { setBusy(false); onChange(); }
    }, [busy, pin, playerId, m?.count, onChange]);

    // Vaqt tugay deganda yozilgan matn avtomatik yuboriladi
    useEffect(() => {
        if (!p || alreadySent) return;
        if ((p.phase === 'recall' && p.msLeft < 700) || p.phase === 'done') submit();
    }, [p?.phase, p?.msLeft, alreadySent, submit]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!m) return null;
    const recalled = sent?.recalled ?? state.me?.recalled ?? [];

    // ── Oʻyin tugadi: natija va koʻrsatilgan soʻzlar ──
    if (state.status === 'ended') return (
        <Screen>
            <p className="text-6xl">🧠</p>
            <h1 className="text-3xl font-black">{t('memYou', { n: recalled.length, m: m.count })}</h1>
            <p className="text-white/60 font-bold">{t('rank')}: <span className="text-yellow-300">#{state.me?.rank ?? '–'}</span> / {state.playerCount}</p>
            {m.items && (
                <div className="w-full max-w-sm rounded-2xl bg-white/5 p-4 text-left">
                    <p className="text-white/40 text-xs font-black mb-2">{t('memWords')}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {m.items.map((w, i) => (
                            <span key={i} className={`px-2.5 py-1 rounded-lg text-sm font-bold ${recalled.includes(i) ? 'bg-violet-500/40 text-white' : 'bg-white/5 text-white/40 line-through'}`}>{w}</span>
                        ))}
                    </div>
                </div>
            )}
            <p className="text-white/50 text-sm max-w-sm">{t('memMiller')}</p>
        </Screen>
    );

    // ── Javob yuborildi ──
    if (alreadySent) return (
        <Screen>
            <p className="text-6xl">✅</p>
            <h1 className="text-2xl font-black">{t('memSent')}</h1>
            <p className="text-4xl font-black text-violet-300">{recalled.length} / {m.count}</p>
            <p className="text-white/50 font-bold">{t('memWaitResults')}</p>
        </Screen>
    );

    if (!p || p.phase === 'ready' || p.phase === 'show') return (
        <Screen>
            <motion.p animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-7xl">👀</motion.p>
            <h1 className="text-3xl font-black">{t('memLook')}</h1>
            {p?.phase === 'show' && <p className="text-white/50 font-black text-xl tabular-nums">{p.index + 1} / {m.count}</p>}
            {p?.phase === 'ready' && <p className="text-white/50 font-bold">{t('memReady')}</p>}
        </Screen>
    );

    // ── Yozish vaqti ──
    return (
        <div className="min-h-screen bg-[#0b0a1f] text-white p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black">✍️ {t('memWrite')}</h1>
                <span className={`px-3 py-1.5 rounded-xl font-black text-2xl tabular-nums ${p.msLeft < 10_000 ? 'bg-red-500/20 text-red-300' : 'bg-white/10'}`}>
                    {Math.ceil(p.msLeft / 1000)}
                </span>
            </div>
            <textarea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={t('memWritePh')}
                autoCapitalize="off" autoCorrect="off" spellCheck={false}
                className="flex-1 min-h-[45vh] w-full rounded-2xl bg-white/5 border-2 border-violet-400/40 p-4 text-xl font-bold outline-none focus:border-violet-300 resize-none" />
            <button onClick={submit} disabled={busy || !text.trim()}
                className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                {busy ? '⏳' : t('memSubmit')}
            </button>
        </div>
    );
}

function Screen({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-[#0b0a1f] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">{children}</div>;
}
