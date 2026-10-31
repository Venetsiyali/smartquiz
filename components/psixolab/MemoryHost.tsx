'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { serverNow } from '@/lib/serverClock';
import { memoryPhase, type MemoryConfig } from '@/lib/psixolab/memory';
import type { raceT } from '@/components/code-race/raceI18n';

export interface MemoryRacer { id: string; nickname: string; avatar: string; solved: number; attempts: number; recalled?: number[] }
type T = ReturnType<typeof raceT>;

/** Proyektor: sanoq → soʻzlar 2 soniyadan → yozish vaqti. Tugagach — natijalar (MemoryResults). */
export default function MemoryHost({ memory, startedAt, racers, t }: {
    memory: MemoryConfig; startedAt: number; racers: MemoryRacer[]; t: T;
}) {
    const [now, setNow] = useState(() => serverNow());
    useEffect(() => { const i = setInterval(() => setNow(serverNow()), 100); return () => clearInterval(i); }, []);
    const p = memoryPhase(memory, startedAt, now);
    const submitted = racers.filter(r => r.attempts > 0).length;

    if (p.phase === 'ready') return (
        <Stage>
            <p className="text-3xl font-black text-white/60">{t('memReady')}</p>
            <motion.p key={Math.ceil(p.msLeft / 1000)} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-[10rem] leading-none font-black text-violet-300">{Math.ceil(p.msLeft / 1000)}</motion.p>
        </Stage>
    );

    if (p.phase === 'show') return (
        <Stage>
            <p className="text-white/40 font-black text-xl tabular-nums">{p.index + 1} / {memory.items.length}</p>
            <AnimatePresence mode="wait">
                <motion.p key={p.index} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-7xl md:text-9xl font-black text-white text-center break-words max-w-full px-6">
                    {memory.items[p.index]}
                </motion.p>
            </AnimatePresence>
            <div className="w-full max-w-xl h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-violet-400 transition-all" style={{ width: `${((p.index + 1) / memory.items.length) * 100}%` }} />
            </div>
        </Stage>
    );

    return (
        <Stage>
            <p className="text-4xl font-black text-white">✍️ {t('memWrite')}</p>
            <p className={`text-[9rem] leading-none font-black tabular-nums ${p.msLeft < 10_000 ? 'text-red-400' : 'text-violet-300'}`}>
                {Math.ceil(p.msLeft / 1000)}
            </p>
            <p className="text-2xl font-black text-white/70">{t('memSubmitted', { n: submitted, m: racers.length })}</p>
        </Stage>
    );
}

function Stage({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full min-h-[70vh] rounded-3xl flex flex-col items-center justify-center gap-6 p-6"
            style={{ background: 'radial-gradient(circle at 50% 40%, #2e1065 0%, #0b0a1f 70%)' }}>
            {children}
        </div>
    );
}

/** Natijalar: oʻrtacha, Miller (7±2) bilan solishtirish, pozitsiya grafigi va natijalar taqsimoti. */
export function MemoryResults({ memory, racers, t }: { memory: MemoryConfig; racers: MemoryRacer[]; t: T }) {
    const done = racers.filter(r => r.attempts > 0);
    const n = memory.items.length;
    if (done.length === 0) return <p className="text-center text-white/50 font-bold py-10">{t('memNoAnswers')}</p>;

    const scores = done.map(r => r.recalled?.length ?? 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const best = Math.max(...scores);
    const inMiller = scores.filter(s => s >= 5 && s <= 9).length;
    const posPct = memory.items.map((_, i) => Math.round(done.filter(r => r.recalled?.includes(i)).length / done.length * 100));
    const dist = Array.from({ length: n + 1 }, (_, k) => scores.filter(s => s === k).length);
    const maxDist = Math.max(...dist, 1);
    const edge = Math.min(3, Math.floor(n / 3)); // birinchi va oxirgi 3 ta pozitsiya

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label={t('memAvg')} value={avg.toFixed(1)} sub={`/ ${n}`} color="#c4b5fd" />
                <Stat label={t('memBest')} value={String(best)} sub={`/ ${n}`} color="#fde047" />
                <Stat label={t('memInMiller')} value={`${inMiller}`} sub={`/ ${done.length}`} color="#86efac" />
                <Stat label="Miller" value="7 ± 2" sub="" color="#93c5fd" />
            </div>

            {/* Pozitsiya boʻyicha eslanish — birinchi va oxirgi oʻrin effekti */}
            <Card title={t('memPosChart')}>
                <div className="flex items-end gap-1.5 h-56">
                    {posPct.map((pct, i) => {
                        const isEdge = i < edge ? 'first' : i >= n - edge ? 'last' : null;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 min-w-0">
                                <span className="text-xs font-black text-white/70 tabular-nums">{pct}%</span>
                                <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 2)}%` }} transition={{ delay: i * 0.05 }}
                                    className="w-full rounded-t-lg"
                                    style={{ background: isEdge === 'first' ? '#a78bfa' : isEdge === 'last' ? '#f472b6' : 'rgba(255,255,255,0.25)' }} />
                                <span className="text-[11px] font-bold text-white/50 truncate max-w-full" title={memory.items[i]}>{i + 1}. {memory.items[i]}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs font-bold">
                    <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded bg-violet-400 inline-block" /> {t('memPrimacy')}</span>
                    <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded bg-pink-400 inline-block" /> {t('memRecency')}</span>
                </div>
            </Card>

            {/* Natijalar taqsimoti, Miller oraligʻi (5–9) ajratilgan */}
            <Card title={t('memScoreDist')}>
                <div className="relative flex items-end gap-1.5 h-40">
                    {dist.map((c, k) => (
                        <div key={k} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                            {c > 0 && <span className="text-xs font-black text-white/70">{c}</span>}
                            <div className="w-full rounded-t-md" style={{
                                height: `${(c / maxDist) * 85}%`, minHeight: c ? 4 : 0,
                                background: k >= 5 && k <= 9 ? '#86efac' : 'rgba(255,255,255,0.3)',
                            }} />
                            <span className={`text-xs font-black ${k >= 5 && k <= 9 ? 'text-green-300' : 'text-white/40'}`}>{k}</span>
                        </div>
                    ))}
                </div>
                <p className="text-white/50 text-xs font-semibold mt-3">🧠 {t('memMiller')}</p>
            </Card>

            <Card title={t('memStudents')}>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {[...done].sort((a, b) => (b.recalled?.length ?? 0) - (a.recalled?.length ?? 0)).map((r, i) => (
                        <div key={r.id} className="flex items-center gap-2 text-sm">
                            <span className="w-6 text-right font-black text-white/40">{i + 1}</span>
                            <span>{r.avatar}</span>
                            <span className="flex-1 truncate font-bold">{r.nickname}</span>
                            <span className="flex gap-0.5">
                                {memory.items.map((_, k) => (
                                    <i key={k} className="w-2 h-3 rounded-sm inline-block" style={{ background: r.recalled?.includes(k) ? '#a78bfa' : 'rgba(255,255,255,0.12)' }} />
                                ))}
                            </span>
                            <span className="w-10 text-right font-black text-violet-200 tabular-nums">{r.recalled?.length ?? 0}/{n}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 text-center">
            <p className="text-white/50 text-xs font-black">{label}</p>
            <p className="text-4xl font-black mt-1" style={{ color }}>{value}<span className="text-lg text-white/30"> {sub}</span></p>
        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5">
            <p className="text-white/60 font-black mb-4">{title}</p>
            {children}
        </div>
    );
}
