'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { missionByCode } from '@/lib/masofalab/missions';

interface Row {
    id: string; name: string; grp: string; steps: Record<string, { at: number; link?: string }>;
    help_count: number; test_correct: number | null; test_max: number | null; session_at: string;
}
interface Data { pin: string; code: string; title: string; stepCount: number; rows: Row[] }

export default function MasofaResultsPage() {
    return <Suspense fallback={null}><Results /></Suspense>;
}

function Results() {
    const sp = useSearchParams();
    const pin = sp.get('pin') ?? '';
    const key = sp.get('key') ?? '';
    const [data, setData] = useState<Data | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [grp, setGrp] = useState('');

    useEffect(() => {
        fetch(`/api/masofa/results?pin=${pin}&key=${encodeURIComponent(key)}`, { cache: 'no-store' })
            .then(async r => { const d = await r.json(); if (r.ok) setData(d); else setError(d.error); })
            .catch(() => setError('Tarmoq xatosi'));
    }, [pin, key]);

    const groups = useMemo(() => Array.from(new Set(data?.rows.map(r => r.grp) ?? [])).sort(), [data]);
    if (error) return <div className="min-h-screen bg-[#04151a] text-white flex items-center justify-center p-6 font-bold text-white/70">🔒 {error}</div>;
    if (!data) return <div className="min-h-screen bg-[#04151a]" />;
    const mission = missionByCode(data.code);
    const rows = data.rows.filter(r => !grp || r.grp === grp);

    return (
        <div className="min-h-screen bg-[#04151a] text-white px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-5">
                <Link href="/teacher/masofa" className="text-teal-300 text-sm font-black">← MasofaLab</Link>
                <div className="flex flex-wrap items-end gap-3 justify-between">
                    <div>
                        <p className="text-teal-300 text-xs font-black uppercase tracking-widest">📊 Natijalar · PIN {data.pin}</p>
                        <h1 className="text-2xl font-black">{data.code}. {data.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        <select value={grp} onChange={e => setGrp(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 font-bold" style={{ colorScheme: 'dark' }}>
                            <option value="">Barcha guruhlar</option>
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <a href={`/api/masofa/export?pin=${pin}&key=${encodeURIComponent(key)}`} className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 font-black">📥 Excel</a>
                    </div>
                </div>
                {rows.length === 0 ? <p className="text-center text-white/50 font-bold py-10">Hali natija yoʻq</p> : (
                    <div className="rounded-2xl border border-white/10 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 text-white/50 text-xs">
                                <tr>
                                    <th className="p-2 text-left">№</th><th className="p-2 text-left">Talaba</th><th className="p-2 text-left">Guruh</th>
                                    {Array.from({ length: data.stepCount }, (_, i) => <th key={i} className="p-2">{i + 1}</th>)}
                                    <th className="p-2">Qadamlar</th><th className="p-2">🆘</th><th className="p-2">Test</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, n) => (
                                    <tr key={r.id} className="border-t border-white/5">
                                        <td className="p-2 text-white/40">{n + 1}</td>
                                        <td className="p-2 font-bold">{r.name}</td>
                                        <td className="p-2 text-white/60">{r.grp}</td>
                                        {Array.from({ length: data.stepCount }, (_, i) => {
                                            const s = r.steps?.[i];
                                            return <td key={i} className="p-2 text-center">{s?.link ? <a href={s.link} target="_blank" rel="noopener noreferrer" title={mission?.steps[i]?.text}>🔗</a> : s ? '✅' : <span className="text-white/20">—</span>}</td>;
                                        })}
                                        <td className="p-2 text-center font-black">{Object.keys(r.steps ?? {}).length}/{data.stepCount}</td>
                                        <td className="p-2 text-center text-white/60">{r.help_count || ''}</td>
                                        <td className="p-2 text-center font-black text-teal-200">{r.test_max ? `${r.test_correct}/${r.test_max}` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
