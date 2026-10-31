'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import type { Submission } from '@/lib/psixolab/tasks';
import { audUi } from '@/components/psixolab/audI18n';

interface Results {
    task: { id: string; topicId: string; lang: 'uz' | 'ru'; title: string; createdAt: number; max: number; caseMax: number };
    submissions: Submission[];
}

export default function TaskResultsPage() {
    return <Suspense fallback={null}><TaskResults /></Suspense>;
}

function TaskResults() {
    const { id, locale } = useParams<{ id: string; locale: string }>();
    const key = useSearchParams().get('key') ?? '';
    const ui = audUi(locale);
    const [data, setData] = useState<Results | null>(null);
    const [denied, setDenied] = useState(false);
    const [groupFilter, setGroupFilter] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);

    const load = useCallback(async () => {
        const res = await fetch(`/api/task/results?id=${id}&key=${encodeURIComponent(key)}`, { cache: 'no-store' });
        if (res.status === 403 || res.status === 404) { setDenied(true); return; }
        setData(await res.json());
    }, [id, key]);
    useEffect(() => { load(); const i = setInterval(load, 20_000); return () => clearInterval(i); }, [load]);

    const groups = useMemo(() => Array.from(new Set(data?.submissions.map(s => s.group) ?? [])).sort(), [data]);
    const subs = (data?.submissions ?? []).filter(s => !groupFilter || s.group === groupFilter);

    const grade = async (subId: string, value: string) => {
        const res = await fetch('/api/task/grade', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, key, subId, grade: value === '' ? null : Number(value) }),
        });
        if (res.ok) {
            const { submission } = await res.json();
            setData(d => d && { ...d, submissions: d.submissions.map(s => s.id === subId ? submission : s) });
        }
    };

    if (denied) return <div className="min-h-screen bg-[#0b0a1f] text-white flex items-center justify-center p-6 text-center font-bold text-white/70">🔒 {ui.noAccess}</div>;
    if (!data) return <div className="min-h-screen bg-[#0b0a1f]" />;

    return (
        <div className="min-h-screen bg-[#0b0a1f] text-white px-4 py-6">
            <div className="max-w-5xl mx-auto space-y-5">
                <Link href="/teacher/psixolab/auditoriya" className="text-violet-300 text-sm font-black">← {ui.section}</Link>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-violet-300 text-xs font-black uppercase tracking-widest">📊 {ui.resultsTitle} · {data.task.topicId} · {data.task.lang.toUpperCase()}</p>
                        <h1 className="text-2xl font-black">{data.task.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 font-bold" style={{ colorScheme: 'dark' }}>
                            <option value="">{ui.allGroups}</option>
                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <a href={`/api/task/export?id=${id}&key=${encodeURIComponent(key)}`} className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 font-black">{ui.excel}</a>
                    </div>
                </div>

                {subs.length === 0 ? <p className="text-white/50 font-bold py-10 text-center">{ui.noSubs}</p> : (
                    <div className="rounded-2xl border border-white/10 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 text-white/50 text-xs">
                                <tr>
                                    <th className="p-3 text-left">№</th><th className="p-3 text-left">{ui.student}</th><th className="p-3 text-left">{ui.group}</th>
                                    <th className="p-3">{ui.testScore}</th><th className="p-3">{ui.matchScore}</th>
                                    <th className="p-3">{ui.caseCol} (0–{data.task.caseMax})</th><th className="p-3">{ui.total} / {data.task.max}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subs.map((s, i) => (
                                    <Row key={s.id} n={i + 1} s={s} open={openId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                                        onGrade={v => grade(s.id, v)} caseMax={data.task.caseMax} ui={ui} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ n, s, open, onToggle, onGrade, caseMax, ui }: {
    n: number; s: Submission; open: boolean; onToggle: () => void; onGrade: (v: string) => void; caseMax: number; ui: ReturnType<typeof audUi>;
}) {
    const [val, setVal] = useState(s.caseGrade === null ? '' : String(s.caseGrade));
    useEffect(() => setVal(s.caseGrade === null ? '' : String(s.caseGrade)), [s.caseGrade]);
    return (
        <>
            <tr className="border-t border-white/5">
                <td className="p-3 text-white/40">{n}</td>
                <td className="p-3 font-bold"><button onClick={onToggle} className="text-left hover:text-violet-200">{open ? '▾' : '▸'} {s.name}</button></td>
                <td className="p-3 text-white/70">{s.group}</td>
                <td className="p-3 text-center font-black">{s.test.correct}/{s.test.max}</td>
                <td className="p-3 text-center font-black">{s.match.score}/{s.match.max}</td>
                <td className="p-3 text-center">
                    <input type="number" min={0} max={caseMax} value={val} onChange={e => setVal(e.target.value)}
                        onBlur={() => val !== (s.caseGrade === null ? '' : String(s.caseGrade)) && onGrade(val)}
                        className={`w-16 text-center rounded-lg px-2 py-1 font-black bg-white/5 border ${s.caseGrade === null ? 'border-yellow-400/50' : 'border-white/10'}`} />
                </td>
                <td className="p-3 text-center font-black text-violet-200">{s.total ?? '—'}</td>
            </tr>
            {open && (
                <tr className="bg-black/20">
                    <td colSpan={7} className="p-4 space-y-2">
                        <p className="text-white/40 text-xs font-black">{ui.caseAnswer} · {ui.submittedAt}: {new Date(s.submittedAt).toLocaleString()}</p>
                        <p className="whitespace-pre-wrap leading-relaxed text-white/85">{s.caseText || '—'}</p>
                    </td>
                </tr>
            )}
        </>
    );
}
