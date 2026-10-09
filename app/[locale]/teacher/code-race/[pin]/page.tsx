'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { getPusherClient } from '@/lib/pusherClient';
import { serverNow, syncServerClock } from '@/lib/serverClock';
import Mountain from '@/components/code-race/Mountain';
import RaceTrack from '@/components/code-race/RaceTrack';
import { formatClock, type RacerView } from '@/components/code-race/utils';

interface FeedItem { key: number; text: string }

const rank = (list: RacerView[]) => [...list].sort((a, b) =>
    b.solved - a.solved || (a.lastSolvedAt ?? Infinity) - (b.lastSolvedAt ?? Infinity));

export default function CodeRaceHostPage() {
    const { pin, locale } = useParams<{ pin: string; locale: string }>();
    const [hostKey, setHostKey] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<'lobby' | 'running' | 'ended'>('lobby');
    const [taskCount, setTaskCount] = useState(0);
    const [kind, setKind] = useState<'code' | 'english'>('code');
    const kindRef = useRef<'code' | 'english'>('code');
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [durationSec, setDurationSec] = useState(0);
    const [racers, setRacers] = useState<RacerView[]>([]);
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [now, setNow] = useState(() => Date.now());
    const [error, setError] = useState<string | null>(null);
    const endingRef = useRef(false);
    const feedSeq = useRef(0);

    // Manzil va vaqt faqat brauzerda ma'lum — server bilan nomuvofiqlik (hydration xatosi) bo'lmasligi uchun
    const [origin, setOrigin] = useState('');
    useEffect(() => setOrigin(window.location.origin), []);
    const joinUrl = origin ? `${origin}/${locale}/play/code?pin=${pin}` : '';

    const load = useCallback(async (key: string) => {
        const res = await fetch(`/api/code-race/state?pin=${pin}&hostKey=${key}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setTitle(data.title); setStatus(data.status); setTaskCount(data.taskCount);
        setKind(data.kind); kindRef.current = data.kind;
        setStartedAt(data.startedAt); setDurationSec(data.durationSec);
        if (data.players) setRacers(data.players);
    }, [pin]);

    useEffect(() => {
        let key: string | null = null;
        try { key = localStorage.getItem(`cr-host-${pin}`); } catch { /* ignore */ }
        if (!key) { setError("Bu o'yinni faqat uni yaratgan o'qituvchi boshqara oladi"); return; }
        setHostKey(key);
        syncServerClock();
        load(key);

        const pusher = getPusherClient();
        const ch = pusher.subscribe(`host-cr-${pin}`);
        ch.bind('cr-joined', ({ player }: { player: RacerView }) =>
            setRacers(prev => prev.some(p => p.id === player.id) ? prev : [...prev, player]));
        ch.bind('cr-progress', ({ player, finished }: { player: RacerView; finished: boolean }) => {
            setRacers(prev => prev.map(p => p.id === player.id ? player : p));
            const text = finished
                ? (kindRef.current === 'english' ? `🏁 ${player.nickname} finishga yetdi!` : `🏁 ${player.nickname} cho'qqiga chiqdi!`)
                : kindRef.current === 'english'
                    ? `⚡ ${player.nickname} — ${player.solved} ta to'g'ri javob`
                    : `⚡ ${player.nickname} ${player.solved}-masalani yechdi (${formatClock(player.lastSolvedAt ?? 0)})`;
            setFeed(f => [{ key: ++feedSeq.current, text }, ...f].slice(0, 6));
            if (finished) confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 } });
        });
        // Pusher xabari yo'qolsa ham holat to'g'ri bo'lsin
        const poll = setInterval(() => load(key!), 10_000);
        const onConnected = () => load(key!);
        pusher.connection.bind('connected', onConnected);
        return () => { clearInterval(poll); pusher.connection.unbind('connected', onConnected); pusher.unsubscribe(`host-cr-${pin}`); };
    }, [pin, load]);

    useEffect(() => {
        const t = setInterval(() => setNow(serverNow()), 500);
        return () => clearInterval(t);
    }, []);

    const action = useCallback(async (name: 'start' | 'end') => {
        await fetch(`/api/code-race/${name}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, hostKey }),
        });
        if (hostKey) await load(hostKey);
    }, [pin, hostKey, load]);

    const remaining = startedAt ? startedAt + durationSec * 1000 - now : durationSec * 1000;
    const ranked = useMemo(() => rank(racers), [racers]);
    const leaders = useMemo(() => new Set(ranked.slice(0, 5).filter(r => r.solved > 0).map(r => r.id)), [ranked]);
    const allFinished = racers.length > 0 && racers.every(r => r.solved >= taskCount);

    // Vaqt tugasa yoki hamma cho'qqiga chiqsa — o'yin yakunlanadi
    useEffect(() => {
        if (status === 'running' && (remaining <= 0 || allFinished) && !endingRef.current) {
            endingRef.current = true;
            action('end');
        }
    }, [status, remaining, allFinished, action]);

    useEffect(() => {
        if (status !== 'ended') return;
        const end = Date.now() + 2500;
        const frame = () => {
            confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 } });
            confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    }, [status]);

    if (!origin) return null;
    if (error) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white/70 font-bold p-6 text-center">⚠️ {error}</div>;

    return (
        <div className="min-h-screen bg-[#070b18] text-white p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">{kind === 'english' ? '🏁 Grammar Race' : <>🏔️ Kod Cho&apos;qqisi</>}</p>
                    <h1 className="text-2xl md:text-3xl font-black">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-white/5 font-black">👥 {racers.length}</div>
                    {status !== 'lobby' && (
                        <div className={`px-5 py-2 rounded-2xl font-black text-2xl tabular-nums ${remaining < 60_000 && status === 'running' ? 'bg-red-500/20 text-red-300 animate-pulse' : 'bg-white/5'}`}>
                            ⏱ {status === 'ended' ? '0:00' : formatClock(remaining)}
                        </div>
                    )}
                    {status === 'running' && (
                        <button onClick={() => { endingRef.current = true; action('end'); }} className="px-4 py-2 rounded-2xl bg-red-500/15 text-red-300 font-black">⏹ Yakunlash</button>
                    )}
                </div>
            </header>

            {status === 'lobby' && (
                <div className="grid lg:grid-cols-[360px_1fr] gap-6">
                    <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-6 text-center space-y-4">
                        <p className="text-white/50 font-bold">Telefoningiz yoki noutbukingizda oching:</p>
                        <p className="text-white font-black">{origin.replace(/^https?:\/\//, '')}/play</p>
                        <p className="text-6xl font-black tracking-[0.15em] text-emerald-300">{pin}</p>
                        <div className="inline-block bg-white p-3 rounded-2xl">
                            {joinUrl && <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#0a0f1e" level="M" />}
                        </div>
                        <p className="text-white/40 text-sm">{kind === 'english' ? `Finish — ${taskCount} ta to'g'ri javob` : `${taskCount} ta masala`} · {Math.round(durationSec / 60)} daqiqa</p>
                        <button onClick={() => action('start')} disabled={racers.length === 0}
                            className="w-full py-4 rounded-2xl text-xl font-black disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 10px 40px rgba(16,185,129,0.35)' }}>
                            🚀 Boshlash
                        </button>
                    </div>
                    <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6">
                        <p className="text-white/50 font-black mb-4">Qo&apos;shilganlar ({racers.length})</p>
                        <div className="flex flex-wrap gap-2">
                            <AnimatePresence>
                                {racers.map(r => (
                                    <motion.div key={r.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 font-bold">
                                        <span className="text-xl">{r.avatar}</span>{r.nickname}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {racers.length === 0 && <p className="text-white/30">Talabalar kutilmoqda...</p>}
                        </div>
                    </div>
                </div>
            )}

            {status === 'running' && (
                <div className="grid lg:grid-cols-[1fr_320px] gap-4" style={{ height: 'calc(100vh - 120px)' }}>
                    <div className="relative min-h-[420px]">
                        {kind === 'english'
                            ? <RaceTrack racers={ranked} goal={taskCount} leaders={leaders} />
                            : <Mountain racers={racers} steps={taskCount} leaders={leaders} />}
                        <div className="absolute left-4 top-4 space-y-2 max-w-[60%]">
                            <AnimatePresence initial={false}>
                                {feed.map(f => (
                                    <motion.div key={f.key} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur text-sm font-bold">{f.text}</motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                    <Ranking ranked={ranked} taskCount={taskCount} />
                </div>
            )}

            {status === 'ended' && <Podium ranked={ranked} taskCount={taskCount} />}
        </div>
    );
}

function Ranking({ ranked, taskCount }: { ranked: RacerView[]; taskCount: number }) {
    return (
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 overflow-y-auto">
            <p className="text-white/50 font-black mb-3">🏆 Reyting</p>
            <div className="space-y-2">
                {ranked.slice(0, 15).map((r, i) => (
                    <motion.div layout key={r.id} className="flex items-center gap-3">
                        <span className="w-6 text-right font-black text-white/40">{i + 1}</span>
                        <span className="text-xl">{r.avatar}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-sm">{r.nickname}</p>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#10b981,#facc15)' }}
                                    animate={{ width: `${(r.solved / Math.max(taskCount, 1)) * 100}%` }} />
                            </div>
                        </div>
                        <span className="font-black text-emerald-300 tabular-nums">{r.solved}/{taskCount}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function Podium({ ranked, taskCount }: { ranked: RacerView[]; taskCount: number }) {
    const places = [ranked[1], ranked[0], ranked[2]];
    const heights = ['h-40', 'h-56', 'h-28'];
    const medals = ['🥈', '🥇', '🥉'];
    return (
        <div className="max-w-4xl mx-auto text-center space-y-8 pt-4">
            <h2 className="text-4xl font-black">🏁 Musobaqa yakunlandi!</h2>
            <div className="flex items-end justify-center gap-4">
                {places.map((r, i) => r && (
                    <motion.div key={r.id} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: [0.4, 0.8, 0][i] }}
                        className="flex flex-col items-center w-36">
                        <span className="text-5xl mb-1">{r.avatar}</span>
                        <p className="font-black truncate max-w-full">{r.nickname}</p>
                        <p className="text-emerald-300 font-black text-sm mb-2">{r.solved}/{taskCount}</p>
                        <div className={`${heights[i]} w-full rounded-t-2xl flex items-start justify-center pt-3 text-4xl`}
                            style={{ background: ['linear-gradient(#cbd5e1,#64748b)', 'linear-gradient(#fde047,#d97706)', 'linear-gradient(#fdba74,#9a3412)'][i] }}>
                            {medals[i]}
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="text-left"><Ranking ranked={ranked} taskCount={taskCount} /></div>
        </div>
    );
}
