'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AssignmentShare from '@/components/assignments/AssignmentShare';

interface Assignment {
    id: string; code: string; title: string; description: string; status: string; url: string;
    opensAt: string | null; closesAt: string | null; maxAttempts: number; timePerQuestion: number;
    shuffle: boolean; showAnswers: string; questionCount: number; createdAt: string;
}
interface Attempt {
    id: string; studentName: string; groupName: string; startedAt: string; submittedAt: string | null;
    correctCount: number; total: number; score: number; answeredCount: number;
}
interface Stat {
    index: number; text: string; options: string[]; correctIndex: number;
    answered: number; correct: number; choices: number[]; timeouts: number;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('uz-Latn-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const duration = (a: string, b: string | null) => {
    if (!b) return '';
    const s = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
    return s < 60 ? `${s} s` : s < 3600 ? `${Math.floor(s / 60)} daq ${s % 60} s` : `${Math.floor(s / 3600)} soat ${Math.floor((s % 3600) / 60)} daq`;
};
const scoreColor = (s: number) => (s >= 80 ? '#00E676' : s >= 55 ? '#FFD600' : '#f87171');

export default function AssignmentResultsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [a, setA] = useState<Assignment | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [stats, setStats] = useState<Stat[]>([]);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'students' | 'questions' | 'share'>('students');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/assignments/${id}`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Xatolik'); return; }
            setA(data.assignment);
            setAttempts(data.attempts);
            setStats(data.stats);
        } catch {
            setError('Server bilan aloqa uzildi');
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const patch = async (body: Record<string, unknown>) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/assignments/${id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (!res.ok) alert((await res.json().catch(() => ({}))).error || 'Saqlab boʻlmadi');
            await load();
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!confirm(`«${a?.title}» topshirigʻi va ${attempts.length} ta natija butunlay oʻchiriladi. QR kod ham ishlamay qoladi. Davom etamizmi?`)) return;
        setBusy(true);
        const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
        if (res.ok) router.push('/teacher/assignments');
        else { setBusy(false); alert('Oʻchirib boʻlmadi'); }
    };

    const exportCsv = () => {
        if (!a) return;
        const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
        const lines = [
            ['Ism', 'Guruh', 'Boshlagan', 'Yakunlagan', 'Toʻgʻri', 'Jami', 'Ball (%)'].map(esc).join(';'),
            ...attempts.map(t => [
                t.studentName, t.groupName, fmt(t.startedAt), t.submittedAt ? fmt(t.submittedAt) : 'yakunlanmagan',
                t.correctCount, t.total, t.submittedAt ? t.score : '',
            ].map(esc).join(';')),
        ];
        // BOM — Excel o'zbekcha harflarni to'g'ri ochishi uchun
        const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `natijalar_${a.code}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (error) return (
        <div className="bg-host min-h-screen flex items-center justify-center p-5">
            <div className="glass p-8 rounded-3xl text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-400 font-bold mb-4">{error}</p>
                <button onClick={() => router.push('/teacher/assignments')} className="btn-primary px-5 py-2.5">Topshiriqlar</button>
            </div>
        </div>
    );
    if (!a) return <div className="bg-host min-h-screen flex items-center justify-center text-white/40 font-bold">Yuklanmoqda...</div>;

    const done = attempts.filter(t => t.submittedAt);
    const avg = done.length ? Math.round(done.reduce((s, t) => s + t.score, 0) / done.length) : 0;
    const active = a.status === 'ACTIVE';

    return (
        <div className="bg-host min-h-screen">
            <header className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-wrap">
                <button onClick={() => router.push('/teacher/assignments')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
                <div className="min-w-0">
                    <p className="text-xl font-black text-white truncate">{a.title}</p>
                    <p className="text-white/40 text-xs font-bold">kod {a.code} · {a.questionCount} ta savol · {fmt(a.createdAt)}</p>
                </div>
                <div className="ml-auto flex gap-2 flex-wrap">
                    <button onClick={load} className="px-3 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white/70">🔄 Yangilash</button>
                    <button onClick={() => patch({ status: active ? 'CLOSED' : 'ACTIVE' })} disabled={busy}
                        className="px-3 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
                        style={active ? { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' } : { background: 'rgba(0,230,118,0.15)', color: '#6ee7b7' }}>
                        {active ? '🔒 Yopish' : '🔓 Qayta ochish'}
                    </button>
                    <button onClick={remove} disabled={busy} className="px-3 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-300 disabled:opacity-50">🗑</button>
                </div>
            </header>

            <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Topshirgan', value: done.length, color: '#00E676' },
                        { label: 'Jarayonda', value: attempts.length - done.length, color: '#FFD600' },
                        { label: 'Oʻrtacha ball', value: `${avg}%`, color: scoreColor(avg) },
                        { label: 'Holat', value: active ? 'Ochiq' : 'Yopilgan', color: active ? '#00E676' : '#f87171' },
                    ].map(c => (
                        <div key={c.label} className="glass rounded-2xl p-4">
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest">{c.label}</p>
                            <p className="text-2xl font-black mt-1" style={{ color: c.color }}>{c.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                    {([['students', '👥 Oʻquvchilar'], ['questions', '📊 Savollar'], ['share', '🔗 QR va havola']] as const).map(([k, l]) => (
                        <button key={k} onClick={() => setTab(k)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${tab === k ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                            {l}
                        </button>
                    ))}
                    {tab === 'students' && attempts.length > 0 && (
                        <button onClick={exportCsv} className="ml-auto px-4 py-2 rounded-xl font-bold text-sm bg-white/5 text-white/70 hover:text-white">⬇️ Excel (CSV)</button>
                    )}
                </div>

                {tab === 'share' && (
                    <div className="glass rounded-3xl p-6 space-y-5">
                        <AssignmentShare url={a.url} code={a.code} title={a.title} />
                        <div className="text-white/50 text-sm font-semibold space-y-1 pt-2 border-t border-white/10">
                            <p>🔁 {a.maxAttempts === 0 ? 'Urinishlar cheklanmagan' : `${a.maxAttempts} marta yechish mumkin`}
                                {' · '}⏱ {a.timePerQuestion ? `${a.timePerQuestion} s / savol` : 'vaqt cheklanmagan'}
                                {' · '}{a.shuffle ? 'aralashtiriladi' : 'tartib oʻzgarmaydi'}</p>
                            <p>📆 {a.opensAt ? `${fmt(a.opensAt)} dan` : 'Darhol ochiq'} · {a.closesAt ? `${fmt(a.closesAt)} gacha` : 'muddatsiz'}</p>
                        </div>
                    </div>
                )}

                {tab === 'students' && (
                    attempts.length === 0 ? (
                        <div className="glass rounded-3xl p-10 text-center">
                            <div className="text-5xl mb-3">⏳</div>
                            <p className="text-white font-black text-lg">Hali hech kim yechmagan</p>
                            <p className="text-white/40 mt-1">QR kod yoki havolani oʻquvchilarga yuboring.</p>
                        </div>
                    ) : (
                        <div className="glass rounded-3xl overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-white/40 text-xs font-black uppercase tracking-wider text-left">
                                        <th className="p-4">#</th><th className="p-4">Oʻquvchi</th><th className="p-4">Guruh</th>
                                        <th className="p-4">Yakunlagan</th><th className="p-4">Sarflangan vaqt</th><th className="p-4 text-right">Natija</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((t, i) => (
                                        <tr key={t.id} className="border-t border-white/5 text-white">
                                            <td className="p-4 text-white/40 font-bold">{i + 1}</td>
                                            <td className="p-4 font-bold">{t.studentName}</td>
                                            <td className="p-4 text-white/60">{t.groupName || '—'}</td>
                                            <td className="p-4 text-white/60">{t.submittedAt ? fmt(t.submittedAt) : <span className="text-amber-300">yechmoqda · {t.answeredCount}/{t.total}</span>}</td>
                                            <td className="p-4 text-white/60">{duration(t.startedAt, t.submittedAt)}</td>
                                            <td className="p-4 text-right font-black whitespace-nowrap">
                                                {t.submittedAt ? <><span style={{ color: scoreColor(t.score) }}>{t.score}%</span> <span className="text-white/40 font-bold">({t.correctCount}/{t.total})</span></> : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {tab === 'questions' && (
                    <div className="space-y-3">
                        <p className="text-white/40 text-sm font-semibold">Eng qiyin savollar yuqorida. Hisobga faqat yakunlangan urinishlar olinadi.</p>
                        {[...stats].sort((x, y) => (x.answered ? x.correct / x.answered : 1) - (y.answered ? y.correct / y.answered : 1)).map(s => {
                            const pct = s.answered ? Math.round((s.correct / s.answered) * 100) : null;
                            return (
                                <div key={s.index} className="glass rounded-2xl p-4">
                                    <div className="flex gap-3 items-start">
                                        <p className="flex-1 text-white font-bold">{s.index + 1}. {s.text}</p>
                                        <span className="font-black shrink-0" style={{ color: pct === null ? 'rgba(255,255,255,0.3)' : scoreColor(pct) }}>
                                            {pct === null ? '—' : `${pct}%`}
                                        </span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {s.options.map((o, k) => {
                                            const n = s.choices[k], w = s.answered ? (n / s.answered) * 100 : 0;
                                            const right = k === s.correctIndex;
                                            return (
                                                <div key={k} className="relative rounded-lg overflow-hidden text-xs">
                                                    <div className="absolute inset-y-0 left-0" style={{ width: `${w}%`, background: right ? 'rgba(0,230,118,0.18)' : 'rgba(255,255,255,0.06)' }} />
                                                    <p className={`relative px-3 py-1.5 flex justify-between gap-3 ${right ? 'text-[#6ee7b7] font-bold' : 'text-white/55'}`}>
                                                        <span>{LETTERS[k]}) {o}{right ? ' ✓' : ''}</span><span>{n}</span>
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        {s.timeouts > 0 && <p className="text-amber-300/80 text-xs font-semibold px-3">⏱ Vaqt tugagan: {s.timeouts}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
