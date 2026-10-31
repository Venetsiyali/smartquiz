'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MISSIONS, MISSION_NOTES, MISSION_REQUIREMENT, type Mission } from '@/lib/masofalab/missions';

interface MyMission { pin: string; key: string; code: string; at: number }
const MY_STORE = 'masofa-sessions';

const EV_ICON = { none: '', link: '🔗', screenshot: '🖼️' } as const;

export default function MasofaLabPage() {
    const router = useRouter();
    const [mine, setMine] = useState<MyMission[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { try { setMine(JSON.parse(localStorage.getItem(MY_STORE) || '[]')); } catch { /* ignore */ } }, []);

    const start = async (m: Mission) => {
        setBusy(m.code); setError(null);
        try {
            const res = await fetch('/api/masofa/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: m.code }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            try {
                localStorage.setItem(`ms-host-${data.pin}`, data.hostKey);
                localStorage.setItem(MY_STORE, JSON.stringify([{ pin: data.pin, key: data.hostKey, code: m.code, at: Date.now() }, ...mine].slice(0, 100)));
            } catch { /* ignore */ }
            router.push(`/teacher/masofa/${data.pin}`);
        } catch (err: any) { setError(err.message || 'Xato'); setBusy(null); }
    };

    return (
        <div className="min-h-screen bg-[#04151a] text-white px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <p className="text-teal-300 text-xs font-black uppercase tracking-widest">“Masofaviy taʼlim texnologiyalari” fani</p>
                    <h1 className="text-3xl md:text-4xl font-black mt-1">🌐 MasofaLab</h1>
                    <p className="text-white/50 mt-2 text-sm">Qadam-baqadam missiya: siz qadamlarni boshqarasiz, talabalar telefondan bajaradi va dalil yuboradi, oxirida test.</p>
                </div>
                <p className="rounded-2xl px-4 py-3 bg-amber-500/10 border border-amber-400/30 text-amber-100 text-sm font-semibold">⚠️ Umumiy talab: {MISSION_REQUIREMENT}</p>
                {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}

                <div className="space-y-3">
                    {MISSIONS.map(m => <MissionCard key={m.code} m={m} busy={busy === m.code} onStart={() => start(m)} mine={mine.filter(x => x.code === m.code)} />)}
                </div>
            </div>
        </div>
    );
}

function MissionCard({ m, busy, onStart, mine }: { m: Mission; busy: boolean; onStart: () => void; mine: MyMission[] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-3xl bg-white/[0.04] border border-teal-400/25 p-5 space-y-3">
            <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[220px]">
                    <h2 className="text-lg font-black"><span className="text-teal-300 mr-2">{m.code}</span>{m.title}</h2>
                    <p className="text-white/60 text-sm mt-1"><b className="text-white/80">Maqsad:</b> {m.goal}</p>
                    <p className="text-white/40 text-xs font-bold mt-1">👣 {m.steps.length} qadam · ✅ {m.test.length} ta test savoli</p>
                    {MISSION_NOTES[m.code] && <p className="text-amber-200 text-xs font-bold mt-1">⚠️ {MISSION_NOTES[m.code]}</p>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setOpen(!open)} className="px-4 py-2.5 rounded-xl bg-white/5 font-black text-sm">{open ? '▾' : '▸'} Qadamlar</button>
                    <button onClick={onStart} disabled={busy} className="px-5 py-2.5 rounded-xl font-black text-sm disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg,#14b8a6,#0f766e)' }}>{busy ? '⏳...' : '▶ Boshlash'}</button>
                </div>
            </div>
            {open && (
                <div className="space-y-2">
                    {m.info && <p className="text-sm text-white/75 leading-relaxed rounded-xl bg-black/20 p-3"><b>Qisqa maʼlumot:</b> {m.info}</p>}
                    <ol className="space-y-1.5">
                        {m.steps.map((s, i) => (
                            <li key={i} className="text-sm text-white/80 flex gap-2"><span className="text-teal-300 font-black">{i + 1}.</span><span>{s.text} {EV_ICON[s.evidence]}</span></li>
                        ))}
                    </ol>
                </div>
            )}
            {mine.length > 0 && (
                <div className="space-y-1 pt-1">
                    {mine.slice(0, 5).map(x => (
                        <div key={x.pin} className="flex items-center gap-3 text-xs">
                            <span className="text-white/40">PIN {x.pin} · {new Date(x.at).toLocaleString()}</span>
                            <Link href={`/teacher/masofa/${x.pin}`} className="ml-auto px-2.5 py-1 rounded-lg bg-white/10 font-black">Boshqarish</Link>
                            <Link href={`/teacher/masofa/results?pin=${x.pin}&key=${x.key}`} className="px-2.5 py-1 rounded-lg bg-white/10 font-black">📊 Natijalar</Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
