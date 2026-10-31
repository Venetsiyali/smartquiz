'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getPusherClient } from '@/lib/pusherClient';
import { missionByCode } from '@/lib/masofalab/missions';

interface Student {
    id: string; name: string; group: string; steps: Record<string, { at: number; link?: string }>;
    help: number | null; helpCount: number; test: { correct: number; max: number } | null;
}
interface HostState { code: string; step: number; status: 'lobby' | 'running' | 'ended'; playerCount: number; players: Student[] }

/** Yordam signali — qisqa ikki tonli ovoz (fayl kerak emas). */
function beep() {
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        [880, 660].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
            o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.17);
        });
    } catch { /* ovoz ishlamasa — vizual signal yetarli */ }
}

export default function MasofaHostPage() {
    const { pin } = useParams<{ pin: string }>();
    const [key, setKey] = useState<string | null>(null);
    const [st, setSt] = useState<HostState | null>(null);
    const [denied, setDenied] = useState(false);
    const [joinUrl, setJoinUrl] = useState('');
    const [openEv, setOpenEv] = useState<string | null>(null);
    const helpSeen = useRef<Set<string>>(new Set());

    const load = useCallback(async (k: string) => {
        const res = await fetch(`/api/masofa/state?pin=${pin}&hostKey=${encodeURIComponent(k)}`, { cache: 'no-store' });
        if (!res.ok) { setDenied(true); return; }
        const data: HostState = await res.json();
        if (!data.players) { setDenied(true); return; }
        // Yangi yordam soʻrovi — ovozli signal
        const helping = data.players.filter(p => p.help !== null).map(p => `${p.id}:${p.help}`);
        if (helping.some(h => !helpSeen.current.has(h))) beep();
        helpSeen.current = new Set(helping);
        setSt(data);
    }, [pin]);

    useEffect(() => {
        let k: string | null = null;
        try { k = localStorage.getItem(`ms-host-${pin}`); } catch { /* ignore */ }
        if (!k) { setDenied(true); return; }
        setKey(k);
        setJoinUrl(`${window.location.origin}/uz/masofa?pin=${pin}`);
        load(k);
        const pusher = getPusherClient();
        const ch = pusher.subscribe(`host-ms-${pin}`);
        ch.bind('ms-update', () => load(k!));
        const poll = setInterval(() => load(k!), 8_000);
        return () => { clearInterval(poll); pusher.unsubscribe(`host-ms-${pin}`); };
    }, [pin, load]);

    const post = async (action: string, extra: Record<string, unknown> = {}) => {
        await fetch(`/api/masofa/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, hostKey: key, ...extra }) });
        if (key) load(key);
    };

    if (denied) return <div className="min-h-screen bg-[#04151a] text-white flex items-center justify-center p-6 text-center font-bold text-white/70">🔒 Bu mashgʻulotni faqat uni yaratgan oʻqituvchi boshqara oladi</div>;
    if (!st) return <div className="min-h-screen bg-[#04151a]" />;
    const mission = missionByCode(st.code)!;
    const n = mission.steps.length;
    const inTest = st.step >= n;
    const cur = mission.steps[Math.min(st.step, n - 1)];
    const helpers = st.players.filter(p => p.help !== null);
    const doneNow = st.players.filter(p => inTest ? p.test : p.steps[st.step]).length;

    return (
        <div className="min-h-screen bg-[#04151a] text-white px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/teacher/masofa" className="text-teal-300 text-sm font-black">← MasofaLab</Link>
                    <h1 className="text-xl md:text-2xl font-black flex-1 min-w-[200px]"><span className="text-teal-300 mr-2">{mission.code}</span>{mission.title}</h1>
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 font-black">PIN <span className="text-teal-300 tracking-widest">{pin}</span></span>
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 font-black">👥 {st.playerCount}</span>
                </div>

                {helpers.length > 0 && (
                    <div className="rounded-2xl bg-red-500/20 border-2 border-red-400 p-3 animate-pulse">
                        <p className="font-black text-red-100">🆘 Yordam kerak: {helpers.map(h => `${h.name} (${h.group}, ${(h.help ?? 0) + 1}-qadam)`).join(' · ')}</p>
                    </div>
                )}

                {st.status === 'lobby' && (
                    <div className="rounded-3xl bg-white/[0.04] border border-teal-400/30 p-6 flex flex-col md:flex-row gap-6 items-center">
                        <div className="bg-white p-3 rounded-2xl"><QRCodeSVG value={joinUrl || 'https://'} size={180} /></div>
                        <div className="space-y-2 text-center md:text-left">
                            <p className="text-white/60 font-bold">Talabalar QR kodni skanerlaydi yoki saytda PIN kiritadi:</p>
                            <p className="text-6xl font-black tracking-widest text-teal-300">{pin}</p>
                            <p className="font-mono text-sm text-white/50 break-all">{joinUrl}</p>
                            <button onClick={() => post('step', { step: 0 })} className="mt-2 px-6 py-3 rounded-2xl font-black text-lg" style={{ background: 'linear-gradient(135deg,#14b8a6,#0f766e)' }}>▶ 1-qadamni boshlash</button>
                        </div>
                    </div>
                )}

                {st.status !== 'lobby' && (
                    <div className="rounded-3xl bg-white/[0.04] border border-teal-400/30 p-5 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-teal-300 text-xs font-black uppercase tracking-widest flex-1">
                                {st.status === 'ended' ? '🏁 Mashgʻulot tugadi' : inTest ? '✅ Test' : `${st.step + 1}-qadam / ${n}`} · bajardi: {doneNow}/{st.playerCount}
                            </p>
                            {st.status === 'running' && <>
                                <button disabled={st.step === 0} onClick={() => post('step', { step: st.step - 1 })} className="px-4 py-2 rounded-xl bg-white/10 font-black disabled:opacity-30">◀</button>
                                {!inTest
                                    ? <button onClick={() => post('step', { step: st.step + 1 })} className="px-4 py-2 rounded-xl font-black" style={{ background: 'linear-gradient(135deg,#14b8a6,#0f766e)' }}>{st.step + 1 < n ? 'Keyingi qadam ▶' : '✅ Testni boshlash'}</button>
                                    : <button onClick={() => { if (confirm('Mashgʻulotni yakunlab, natijalarni saqlaysizmi?')) post('end'); }} className="px-4 py-2 rounded-xl font-black bg-red-500/80">🏁 Yakunlash</button>}
                            </>}
                            {st.status === 'ended' && <Link href={`/teacher/masofa/results?pin=${pin}&key=${key}`} className="px-4 py-2 rounded-xl font-black bg-emerald-500/20 text-emerald-200">📊 Natijalar va Excel</Link>}
                        </div>
                        <p className="text-lg md:text-2xl font-bold leading-relaxed">{inTest ? `Talabalar ${mission.test.length} ta savolli testni yechmoqda.` : cur.text}</p>
                    </div>
                )}

                {st.players.length > 0 && (
                    <div className="rounded-2xl border border-white/10 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 text-white/50 text-xs">
                                <tr>
                                    <th className="p-2 text-left">Talaba</th><th className="p-2 text-left">Guruh</th>
                                    {mission.steps.map((_, i) => <th key={i} className={`p-2 ${i === st.step && !inTest ? 'text-teal-300' : ''}`}>{i + 1}</th>)}
                                    <th className="p-2">Test</th><th className="p-2">Holat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {st.players.map(p => {
                                    const status = p.help !== null ? 'help' : (inTest ? p.test : p.steps[st.step]) ? 'done' : 'work';
                                    return (
                                        <tr key={p.id} className={`border-t border-white/5 ${status === 'help' ? 'bg-red-500/15' : ''}`}>
                                            <td className="p-2 font-bold">{p.name}</td>
                                            <td className="p-2 text-white/60">{p.group}</td>
                                            {mission.steps.map((_, i) => {
                                                const s = p.steps[i];
                                                return (
                                                    <td key={i} className="p-2 text-center">
                                                        {s?.link
                                                            ? <button onClick={() => setOpenEv(openEv === `${p.id}:${i}` ? null : `${p.id}:${i}`)} title={s.link}>🔗</button>
                                                            : s ? '✅' : p.help === i ? '🆘' : i <= st.step ? <span className="text-white/25">·</span> : ''}
                                                        {openEv === `${p.id}:${i}` && s?.link && (
                                                            <a href={s.link} target="_blank" rel="noopener noreferrer" className="block text-xs text-teal-300 underline break-all max-w-[160px]">{s.link}</a>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 text-center font-black">{p.test ? `${p.test.correct}/${p.test.max}` : '—'}</td>
                                            <td className="p-2 text-center whitespace-nowrap">
                                                {status === 'help'
                                                    ? <button onClick={() => post('resolve', { playerId: p.id })} className="px-2 py-1 rounded-lg bg-red-500/40 text-xs font-black">🆘 Hal qilindi</button>
                                                    : status === 'done' ? <span className="text-emerald-300 font-black text-xs">✅ bajardi</span>
                                                        : <span className="text-white/40 font-black text-xs">⏳ ishlayapti</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
