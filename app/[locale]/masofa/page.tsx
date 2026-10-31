'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';
import { playerOrder } from '@/lib/engRace';
import { missionByCode, MISSION_NOTES, type Mission } from '@/lib/masofalab/missions';

interface Me { steps: Record<string, { at: number; link?: string }>; help: number | null; test: { correct: number; max: number } | null }
interface PlayState { code: string; step: number; status: 'lobby' | 'running' | 'ended'; playerCount: number; me: Me | null }

const store = {
    get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};
const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 font-bold outline-none focus:border-teal-400/60';
const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#04151a] text-white px-4 py-6"><div className="max-w-xl mx-auto space-y-4">{children}</div></div>
);

export default function MasofaPlayPage() {
    return <Suspense fallback={null}><Play /></Suspense>;
}

function Play() {
    const [pin, setPin] = useState(useSearchParams().get('pin') ?? '');
    const [pinInput, setPinInput] = useState('');
    const [playerId, setPlayerId] = useState('');
    const [joined, setJoined] = useState(false);
    const [st, setSt] = useState<PlayState | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let id = store.get('ms-player-id');
        if (!id) { id = crypto.randomUUID(); store.set('ms-player-id', id); }
        setPlayerId(id);
    }, []);
    useEffect(() => { if (pin && store.get(`ms-joined-${pin}`)) setJoined(true); }, [pin]);

    const load = useCallback(async () => {
        if (!pin || !playerId) return;
        const res = await fetch(`/api/masofa/state?pin=${pin}&playerId=${playerId}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setSt(data);
        if (joined && !data.me) setJoined(false);   // oʻyin qayta yaratilgan boʻlsa
    }, [pin, playerId, joined]);

    useEffect(() => {
        if (!pin || !playerId) return;
        load();
        const pusher = getPusherClient();
        const ch = pusher.subscribe(`ms-${pin}`);
        ch.bind('ms-step', load);
        const poll = setInterval(load, 10_000);
        return () => { clearInterval(poll); pusher.unsubscribe(`ms-${pin}`); };
    }, [pin, playerId, load]);

    if (!pin) return (
        <Shell>
            <h1 className="text-3xl font-black pt-10">🌐 MasofaLab</h1>
            <input value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="PIN" className={`${field} text-center text-3xl tracking-widest`} />
            <button onClick={() => pinInput.length === 6 && setPin(pinInput)} className="w-full py-4 rounded-2xl font-black text-lg" style={{ background: 'linear-gradient(135deg,#14b8a6,#0f766e)' }}>Kirish</button>
        </Shell>
    );
    if (error && !st) return <Shell><p className="pt-10 text-center font-bold text-red-300">⚠️ {error}</p></Shell>;
    if (!st || !playerId) return <Shell><p className="pt-10 text-center text-white/50">⏳</p></Shell>;
    const mission = missionByCode(st.code)!;
    if (!joined || !st.me) return <JoinForm pin={pin} playerId={playerId} mission={mission} onJoined={() => { store.set(`ms-joined-${pin}`, '1'); setJoined(true); load(); }} />;
    if (st.status === 'lobby') return (
        <Shell>
            <div className="pt-16 text-center space-y-3">
                <p className="text-6xl">🌐</p>
                <h1 className="text-2xl font-black">{mission.code}. {mission.title}</h1>
                <p className="text-white/60 font-bold">Oʻqituvchi boshlashini kuting · 👥 {st.playerCount}</p>
                {mission.info && <p className="text-left text-sm text-white/75 leading-relaxed rounded-2xl bg-white/5 p-4"><b>Qisqa maʼlumot:</b> {mission.info}</p>}
            </div>
        </Shell>
    );
    return <Mission_ st={st} mission={mission} pin={pin} playerId={playerId} onChange={load} />;
}

function JoinForm({ pin, playerId, mission, onJoined }: { pin: string; playerId: string; mission: Mission; onJoined: () => void }) {
    const [name, setName] = useState(store.get('ms-name') ?? '');
    const [group, setGroup] = useState(store.get('ms-group') ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const join = async () => {
        if (name.trim().length < 3 || !group.trim()) { setError('Ism-familiya va guruhni kiriting'); return; }
        setBusy(true); setError(null);
        const res = await fetch('/api/masofa/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, playerId, name, group }) });
        const data = await res.json();
        setBusy(false);
        if (!res.ok) { setError(data.error); return; }
        store.set('ms-name', name.trim()); store.set('ms-group', group.trim());
        onJoined();
    };
    return (
        <Shell>
            <div className="pt-8 space-y-1">
                <p className="text-teal-300 text-xs font-black uppercase tracking-widest">🌐 MasofaLab · PIN {pin}</p>
                <h1 className="text-2xl font-black">{mission.code}. {mission.title}</h1>
                {MISSION_NOTES[mission.code] && <p className="text-amber-200 text-sm font-bold">⚠️ {MISSION_NOTES[mission.code]}</p>}
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ism-familiya" className={field} />
            <input value={group} onChange={e => setGroup(e.target.value)} placeholder="Guruh" className={field} />
            {error && <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>}
            <button onClick={join} disabled={busy} className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#14b8a6,#0f766e)' }}>{busy ? '⏳' : '▶ Qoʻshilish'}</button>
        </Shell>
    );
}

function Mission_({ st, mission, pin, playerId, onChange }: { st: PlayState; mission: Mission; pin: string; playerId: string; onChange: () => void }) {
    const n = mission.steps.length;
    const me = st.me!;
    const post = async (action: string, extra: Record<string, unknown>) => {
        const res = await fetch(`/api/masofa/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, playerId, ...extra }) });
        const data = await res.json();
        onChange();
        return { ok: res.ok, data };
    };

    if (st.status === 'ended' && !(st.step >= n && !me.test)) {
        const done = Object.keys(me.steps).length;
        return (
            <Shell>
                <div className="pt-12 text-center space-y-3">
                    <p className="text-6xl">🏁</p>
                    <h1 className="text-2xl font-black">Mashgʻulot yakunlandi</h1>
                    <p className="text-white/70 font-bold">👣 Qadamlar: {done}/{n}{me.test ? ` · ✅ Test: ${me.test.correct}/${me.test.max}` : ''}</p>
                </div>
            </Shell>
        );
    }
    if (st.step >= n) return <TestStep mission={mission} pin={pin} playerId={playerId} me={me} ended={st.status === 'ended'} post={post} />;

    return (
        <Shell>
            <div className="flex items-center gap-2">
                <p className="text-teal-300 text-xs font-black uppercase tracking-widest flex-1">{mission.code} · {st.step + 1}-qadam / {n}</p>
                <span className="text-xs text-white/40 font-bold">✅ {Object.keys(me.steps).length}</span>
            </div>
            <div className="flex gap-1">{mission.steps.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${me.steps[i] ? 'bg-emerald-400' : i === st.step ? 'bg-teal-300' : i < st.step ? 'bg-amber-400/60' : 'bg-white/10'}`} />
            ))}</div>
            {/* Oldingi bajarilmagan qadamlar ham ochiq — orqada qolgan talaba yetib olishi mumkin */}
            {mission.steps.map((s, i) => i <= st.step && (i === st.step || !me.steps[i]) && (
                <StepCard key={`${i}-${!!me.steps[i]}`} index={i} text={s.text} evidence={s.evidence} current={i === st.step}
                    done={me.steps[i]} help={me.help === i} post={post} />
            ))}
        </Shell>
    );
}

function StepCard({ index, text, evidence, current, done, help, post }: {
    index: number; text: string; evidence: 'none' | 'link' | 'screenshot'; current: boolean;
    done?: { link?: string }; help: boolean; post: (a: string, e: Record<string, unknown>) => Promise<{ ok: boolean; data: any }>;
}) {
    const [link, setLink] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submit = async () => {
        setBusy(true); setError(null);
        const { ok, data } = await post('done', { step: index, link: link.trim() });
        if (!ok) setError(data.error);
        setBusy(false);
    };
    return (
        <div className={`rounded-3xl p-5 space-y-4 border-2 ${done ? 'border-emerald-400/50 bg-emerald-500/10' : help ? 'border-red-400 bg-red-500/10' : current ? 'border-teal-400/50 bg-white/[0.05]' : 'border-amber-400/30 bg-white/[0.03]'}`}>
            <p className="text-xs font-black text-white/50">{index + 1}-qadam{!current && !done ? ' · ⏮ orqada qoldi' : ''}</p>
            <p className="text-lg font-bold leading-relaxed">{text}</p>
            {done ? (
                <p className="text-emerald-300 font-black">✅ Bajarildi{done.link ? ' · 🔗 dalil yuborildi' : ''}</p>
            ) : <>
                {evidence !== 'none' && (
                    <div className="space-y-1">
                        <p className="text-xs font-black text-white/50">{evidence === 'link' ? '🔗 Dalil: havola' : '🖼️ Dalil: skrinshot havolasi (Google Drive va h.k.)'} · ixtiyoriy</p>
                        <input value={link} onChange={e => setLink(e.target.value)} inputMode="url" placeholder="https://..." className={field} />
                    </div>
                )}
                {error && <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>}
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={submit} disabled={busy} className="py-3.5 rounded-2xl font-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#22c55e,#15803d)' }}>✅ Bajardim</button>
                    <button onClick={() => post('help', { step: index, on: !help })} className={`py-3.5 rounded-2xl font-black ${help ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`}>{help ? '🆘 Kutilmoqda… (bekor)' : '🆘 Yordam'}</button>
                </div>
            </>}
        </div>
    );
}

function TestStep({ mission, pin, playerId, me, ended, post }: {
    mission: Mission; pin: string; playerId: string; me: Me; ended: boolean;
    post: (a: string, e: Record<string, unknown>) => Promise<{ ok: boolean; data: any }>;
}) {
    // Variantlar har talabada boshqa tartibda; serverga asl indekslar yuboriladi
    const orders = useMemo(() => mission.test.map((t, i) => playerOrder(`${pin}:${playerId}:${i}`, t.options.length)), [mission, pin, playerId]);
    const [answers, setAnswers] = useState<number[]>(() => mission.test.map(() => -1));
    const [correct, setCorrect] = useState<number[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        if (answers.some(a => a < 0)) { setError('Barcha savollarga javob bering'); return; }
        setBusy(true); setError(null);
        const { ok, data } = await post('test', { answers });
        if (ok) setCorrect(data.answers); else setError(data.error);
        setBusy(false);
    };
    const result = me.test;

    return (
        <Shell>
            <p className="text-teal-300 text-xs font-black uppercase tracking-widest">{mission.code} · ✅ Test</p>
            {result && <p className="rounded-2xl bg-emerald-500/15 p-4 text-center text-2xl font-black text-emerald-200">Natija: {result.correct}/{result.max}</p>}
            {mission.test.map((t, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2">
                    <p className="font-bold">{i + 1}. {t.q}</p>
                    <div className="grid gap-2">
                        {orders[i].map(oi => {
                            const chosen = answers[i] === oi;
                            const showOk = correct && correct[i] === oi;
                            const showBad = correct && chosen && correct[i] !== oi;
                            return (
                                <button key={oi} disabled={!!result || ended} onClick={() => setAnswers(a => a.map((x, j) => j === i ? oi : x))}
                                    className={`text-left px-3 py-2.5 rounded-xl text-sm font-semibold border-2 ${showOk ? 'border-emerald-400 bg-emerald-500/20' : showBad ? 'border-red-400 bg-red-500/20' : chosen ? 'border-teal-400 bg-teal-500/20' : 'border-white/10 bg-white/[0.03]'}`}>
                                    {t.options[oi]}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            {error && <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>}
            {!result && !ended && (
                <button onClick={submit} disabled={busy} className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#14b8a6,#0f766e)' }}>{busy ? '⏳' : '✅ Testni topshirish'}</button>
            )}
        </Shell>
    );
}
