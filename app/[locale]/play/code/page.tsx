'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { v4 as uuidv4 } from 'uuid';
import { getPusherClient } from '@/lib/pusherClient';
import { serverNow, syncServerClock } from '@/lib/serverClock';
import { PyRunner, type RunResult } from '@/lib/pyRunner';
import type { CodeTask } from '@/lib/codeRace';
import CodeEditor from '@/components/code-race/CodeEditor';
import { AVATARS, callRepr, formatClock, pyRepr } from '@/components/code-race/utils';

interface Me { solved: number; rank: number }
interface RaceState {
    title: string; status: 'lobby' | 'running' | 'ended';
    startedAt: number | null; durationSec: number; taskCount: number;
    tasks: CodeTask[]; playerCount: number; me: Me | null;
    top: { id: string; nickname: string; avatar: string; solved: number }[];
}
type ConsoleLine = { kind: 'out' | 'err' | 'ok' | 'fail' | 'info'; text: string };

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 font-bold outline-none focus:border-emerald-400/60';

const store = {
    get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

export default function CodeRacePlayPage() {
    return <Suspense fallback={null}><CodeRacePlay /></Suspense>;
}

function CodeRacePlay() {
    const pin = useSearchParams().get('pin') ?? '';
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [joined, setJoined] = useState(false);
    const [state, setState] = useState<RaceState | null>(null);
    const [pyStatus, setPyStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const runnerRef = useRef<PyRunner | null>(null);

    // Python lobbida kutib turgan paytda yuklanadi — o'yin boshlanganda tayyor bo'ladi
    useEffect(() => {
        const runner = new PyRunner(setPyStatus);
        runnerRef.current = runner;
        runner.ready.catch(() => {});
        return () => runner.dispose();
    }, []);

    useEffect(() => {
        let id = store.get('cr-player-id');
        if (!id) { id = uuidv4(); store.set('cr-player-id', id); }
        setPlayerId(id);
        if (store.get(`cr-joined-${pin}`)) setJoined(true);
        syncServerClock();
    }, [pin]);

    const load = useCallback(async () => {
        if (!playerId || !pin) return;
        const res = await fetch(`/api/code-race/state?pin=${pin}&playerId=${playerId}`, { cache: 'no-store' });
        if (res.ok) setState(await res.json());
    }, [pin, playerId]);

    useEffect(() => {
        if (!joined || !playerId) return;
        load();
        const pusher = getPusherClient();
        const ch = pusher.subscribe(`cr-${pin}`);
        ch.bind('cr-start', load);
        ch.bind('cr-end', load);
        const onConnected = () => load();
        pusher.connection.bind('connected', onConnected);
        const onVisible = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVisible);
        // Lobbida tez-tez, o'yin davomida kamroq (o'rin va reyting uchun)
        const poll = setInterval(load, 8_000);
        return () => {
            clearInterval(poll);
            pusher.unsubscribe(`cr-${pin}`);
            pusher.connection.unbind('connected', onConnected);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [joined, playerId, pin, load]);

    if (!pin) return <Centered>PIN ko&apos;rsatilmagan. <a className="text-emerald-300 underline" href="/play">PIN kiritish</a></Centered>;
    if (!joined || !playerId) return <JoinForm pin={pin} playerId={playerId} onJoined={() => { store.set(`cr-joined-${pin}`, '1'); setJoined(true); }} />;
    if (!state) return <Centered>⏳ Yuklanmoqda...</Centered>;

    if (state.status === 'lobby') {
        return (
            <Centered>
                <div className="space-y-5">
                    <p className="text-6xl">🏔️</p>
                    <h1 className="text-3xl font-black">{state.title}</h1>
                    <p className="text-white/60 font-bold">O&apos;qituvchi boshlashini kuting · 👥 {state.playerCount}</p>
                    <PyBadge status={pyStatus} />
                    <p className="text-white/40 text-sm max-w-sm">{state.taskCount} ta masala. Har bir yechim sizni bir pog&apos;ona yuqoriga ko&apos;taradi — cho&apos;qqiga birinchi chiqing!</p>
                </div>
            </Centered>
        );
    }

    if (state.status === 'ended' || (state.me && state.me.solved >= state.taskCount)) {
        return <Finished state={state} />;
    }

    return <Arena key={state.me?.solved ?? 0} state={state} pin={pin} playerId={playerId} runner={runnerRef.current} pyStatus={pyStatus} onSolved={load} />;
}

function Arena({ state, pin, playerId, runner, pyStatus, onSolved }: {
    state: RaceState; pin: string; playerId: string; runner: PyRunner | null; pyStatus: string; onSolved: () => void;
}) {
    const index = state.me?.solved ?? 0;
    const task = state.tasks[index];
    const codeKey = `cr-code-${pin}-${index}`;
    const [code, setCode] = useState(() => store.get(codeKey) ?? task?.starter ?? '');
    const [lines, setLines] = useState<ConsoleLine[]>([{ kind: 'info', text: "▶ Ishga tushirish — kodni sinash, ✅ Topshirish — testlardan o'tkazish (Ctrl+Enter)" }]);
    const [busy, setBusy] = useState<'run' | 'test' | null>(null);
    const [celebrate, setCelebrate] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => { const t = setInterval(() => setNow(serverNow()), 500); return () => clearInterval(t); }, []);
    useEffect(() => { store.set(codeKey, code); }, [codeKey, code]);

    const remaining = (state.startedAt ?? 0) + state.durationSec * 1000 - now;

    const show = (r: RunResult, extra: ConsoleLine[] = []) => {
        const out: ConsoleLine[] = [];
        if (r.output) out.push({ kind: 'out', text: r.output.trimEnd() });
        if (r.error) out.push({ kind: 'err', text: r.error });
        setLines([...out, ...extra]);
    };

    const run = async () => {
        if (!runner || busy) return;
        setBusy('run');
        setLines([{ kind: 'info', text: '⏳ Ishlamoqda...' }]);
        const r = await runner.run(code);
        show(r, !r.output && !r.error ? [{ kind: 'info', text: "(chiqish yo'q — natijani ko'rish uchun print() dan foydalaning)" }] : []);
        setBusy(null);
    };

    const submit = async () => {
        if (!runner || busy || !task) return;
        setBusy('test');
        setLines([{ kind: 'info', text: '⏳ Testlar tekshirilmoqda...' }]);
        const r = await runner.test(code, task.functionName, task.tests);
        if (r.error || !r.results) { show(r); setBusy(null); return; }

        const results: ConsoleLine[] = r.results.map((t, i) => {
            const call = callRepr(task.functionName, task.tests[i].args);
            if (t.ok) return { kind: 'ok', text: `✅ ${i + 1}-test: ${call}` };
            // Yashirin testlarda ham nimani kutganimizni ko'rsatamiz — talaba xatosini tushunib olsin
            return { kind: 'fail', text: `❌ ${i + 1}-test: ${call}\n   kutilgan: ${pyRepr(task.tests[i].expected)}\n   sizniki:  ${t.error ?? t.got}` };
        });
        const passed = r.results.filter(t => t.ok).length;
        if (passed < r.results.length) {
            show(r, [...results, { kind: 'info', text: `${passed}/${r.results.length} test o'tdi — yana urinib ko'ring!` }]);
            setBusy(null);
            return;
        }
        show(r, [...results, { kind: 'info', text: '🎉 Barcha testlar o\'tdi!' }]);
        await fetch('/api/code-race/solve', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, playerId, task: index, code }),
        }).catch(() => {});
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1600);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        setTimeout(onSolved, 1400);
    };

    if (!task) return <Centered>⏳ Yuklanmoqda...</Centered>;

    return (
        <div className="min-h-screen bg-[#070b18] text-white p-3 md:p-5">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(320px,2fr)_3fr] gap-4">
                {/* Masala */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <Steps solved={index} total={state.taskCount} />
                        <div className={`px-3 py-1.5 rounded-xl font-black tabular-nums ${remaining < 60_000 ? 'bg-red-500/20 text-red-300' : 'bg-white/5'}`}>⏱ {formatClock(remaining)}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-3">
                        <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">{index + 1}-masala / {state.taskCount}</p>
                        <h2 className="text-2xl font-black">{task.title}</h2>
                        <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{task.prompt}</p>
                        <div className="space-y-1.5 pt-1">
                            <p className="text-white/40 text-xs font-black uppercase">Misollar</p>
                            {task.tests.slice(0, 2).map((t, i) => (
                                <pre key={i} className="text-sm bg-black/40 rounded-lg px-3 py-2 font-mono text-emerald-200 whitespace-pre-wrap">
                                    {callRepr(task.functionName, t.args)} <span className="text-white/40">→</span> {pyRepr(t.expected)}
                                </pre>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm">
                        <div className="flex justify-between font-black mb-2">
                            <span className="text-white/50">Sizning o&apos;rningiz</span>
                            <span className="text-yellow-300">#{state.me?.rank ?? '–'} / {state.playerCount}</span>
                        </div>
                        {state.top.slice(0, 3).map((p, i) => (
                            <div key={p.id} className="flex justify-between text-white/70 font-bold">
                                <span>{['🥇', '🥈', '🥉'][i]} {p.avatar} {p.nickname}</span><span>{p.solved}/{state.taskCount}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Muharrir va konsol */}
                <div className="flex flex-col gap-3 min-h-[70vh]">
                    <div className="flex-1 min-h-[300px]"><CodeEditor value={code} onChange={setCode} onRun={submit} /></div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={run} disabled={!!busy || pyStatus !== 'ready'}
                            className="px-5 py-3 rounded-xl font-black bg-white/10 hover:bg-white/15 disabled:opacity-40">
                            {busy === 'run' ? '⏳' : '▶'} Ishga tushirish
                        </button>
                        <button onClick={submit} disabled={!!busy || pyStatus !== 'ready'}
                            className="flex-1 px-5 py-3 rounded-xl font-black disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                            {busy === 'test' ? '⏳ Tekshirilmoqda...' : '✅ Topshirish'}
                        </button>
                        <button onClick={() => { if (confirm("Kodni boshlang'ich holatga qaytarasizmi?")) setCode(task.starter); }}
                            className="px-4 py-3 rounded-xl font-black bg-white/5 text-white/50" title="Qayta boshlash">↺</button>
                    </div>
                    {pyStatus !== 'ready' && <PyBadge status={pyStatus} />}
                    <div className="rounded-xl bg-black/60 border border-white/10 p-3 font-mono text-[13px] h-48 overflow-y-auto space-y-1">
                        {lines.map((l, i) => (
                            <pre key={i} className={`whitespace-pre-wrap ${{ out: 'text-white/90', err: 'text-red-300', ok: 'text-emerald-300', fail: 'text-orange-300', info: 'text-white/40' }[l.kind]}`}>{l.text}</pre>
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {celebrate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                        <motion.div initial={{ scale: 0.5, y: 40 }} animate={{ scale: 1, y: 0 }} className="text-center">
                            <p className="text-7xl">⛰️</p>
                            <p className="text-4xl font-black mt-2">+1 pog&apos;ona!</p>
                            <p className="text-white/60 font-bold mt-1">{index + 1}/{state.taskCount} yechildi</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Steps({ solved, total }: { solved: number; total: number }) {
    return (
        <div className="flex items-end gap-1" title={`${solved}/${total}`}>
            {Array.from({ length: total }, (_, i) => (
                <div key={i} className="w-4 rounded-sm transition-all"
                    style={{ height: 8 + i * 3, background: i < solved ? 'linear-gradient(#facc15,#10b981)' : i === solved ? '#ffffff55' : '#ffffff18' }} />
            ))}
            <span className="ml-1 text-lg">🏁</span>
        </div>
    );
}

function Finished({ state }: { state: RaceState }) {
    const done = state.me && state.me.solved >= state.taskCount;
    useEffect(() => { if (done) confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } }); }, [done]);
    return (
        <Centered>
            <div className="space-y-4">
                <p className="text-7xl">{done ? '🏁' : '⛺'}</p>
                <h1 className="text-3xl font-black">{done ? "Cho'qqiga chiqdingiz!" : 'Musobaqa yakunlandi'}</h1>
                <p className="text-white/70 font-bold">{state.me?.solved ?? 0}/{state.taskCount} masala · o&apos;rningiz <span className="text-yellow-300">#{state.me?.rank ?? '–'}</span> / {state.playerCount}</p>
                {state.status !== 'ended' && <p className="text-white/40 text-sm">Boshqalar hali chiqyapti — proyektorni kuzating 👀</p>}
                <div className="rounded-2xl bg-white/5 p-4 text-left space-y-1 min-w-[260px]">
                    {state.top.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex justify-between font-bold text-white/80">
                            <span>{['🥇', '🥈', '🥉', '4.', '5.'][i]} {p.avatar} {p.nickname}</span><span>{p.solved}/{state.taskCount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Centered>
    );
}

function JoinForm({ pin, playerId, onJoined }: { pin: string; playerId: string | null; onJoined: () => void }) {
    const [nickname, setNickname] = useState(() => store.get('cr-nickname') ?? '');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const join = async () => {
        if (!playerId) return;
        setLoading(true); setError(null);
        const res = await fetch('/api/code-race/join', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, playerId, nickname: nickname.trim(), avatar }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data.error || 'Xatolik'); setLoading(false); return; }
        store.set('cr-nickname', nickname.trim());
        onJoined();
    };

    return (
        <Centered>
            <div className="w-full max-w-sm space-y-4">
                <p className="text-6xl">🏔️</p>
                <h1 className="text-3xl font-black">Kod Cho&apos;qqisi</h1>
                <p className="text-white/50 font-bold">PIN: {pin}</p>
                <input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={24} placeholder="Ismingiz" className={field}
                    onKeyDown={e => e.key === 'Enter' && join()} />
                <div className="grid grid-cols-8 gap-1.5">
                    {AVATARS.map(a => (
                        <button key={a} onClick={() => setAvatar(a)} className={`text-2xl rounded-lg py-1 ${avatar === a ? 'bg-emerald-500/30 ring-2 ring-emerald-400' : 'bg-white/5'}`}>{a}</button>
                    ))}
                </div>
                {error && <p className="text-red-300 font-bold text-sm">⚠️ {error}</p>}
                <button onClick={join} disabled={loading || nickname.trim().length < 2}
                    className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    {loading ? '⏳' : "🚀 Qo'shilish"}
                </button>
            </div>
        </Centered>
    );
}

function PyBadge({ status }: { status: string }) {
    if (status === 'ready') return <p className="text-emerald-300 font-bold text-sm">🐍 Python tayyor</p>;
    if (status === 'error') return <p className="text-red-300 font-bold text-sm">⚠️ Python yuklanmadi — internetni tekshirib, sahifani yangilang</p>;
    return <p className="text-white/50 font-bold text-sm animate-pulse">🐍 Python yuklanmoqda (birinchi marta ~10 MB)...</p>;
}

function Centered({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-[#070b18] text-white flex items-center justify-center p-6 text-center">{children}</div>;
}
