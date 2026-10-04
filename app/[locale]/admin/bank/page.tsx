'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { SUBJECTS } from '@/lib/questionBank/subjects';
import BankImportPanel from '@/components/bank/BankImportPanel';

type View = 'queue' | 'unverified' | 'approved' | 'rejected';
type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface BankItem {
    id: string;
    subject: string;
    topic: string;
    grade: number | null;
    difficulty: number;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint: string;
    status: Status;
    source: string;
    generatedBy: string;
    reviewNote: string;
    timesShown: number;
    reportCount: number;
    reports: { reason: string; createdAt: string }[];
}

interface Stats {
    approved: number; pending: number; rejected: number;
    queue: number; unverified: number; reported: number; served: number;
    bySubject: { subject: string; count: number }[];
}

interface Draft {
    text: string; options: string[]; correctIndex: number; explanation: string; hint: string;
    subject: string; topic: string; grade: number | null; difficulty: number;
}

const VIEWS: { id: View; label: string; statKey: keyof Stats }[] = [
    { id: 'queue', label: "🔎 Ko'rib chiqish navbati", statKey: 'queue' },
    { id: 'unverified', label: '⏳ Tekshirilmagan', statKey: 'unverified' },
    { id: 'approved', label: '✅ Tasdiqlangan', statKey: 'approved' },
    { id: 'rejected', label: '🚫 Rad etilgan', statKey: 'rejected' },
];

const DIFFICULTY = ['', 'Oson', "O'rta", 'Qiyin'];
const STATUS_STYLE: Record<Status, { label: string; bg: string; color: string }> = {
    APPROVED: { label: 'Tasdiqlangan', bg: 'rgba(0,230,118,0.1)', color: '#00E676' },
    PENDING: { label: 'Kutilmoqda', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    REJECTED: { label: 'Rad etilgan', bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
};

const gradeLabel = (g: number | null) => (g == null ? 'Barcha' : g === 12 ? 'Oliy' : `${g}-sinf`);

function StatCard({ label, value, color = '#fff' }: { label: string; value: number | string; color?: string }) {
    return (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white/40 text-xs font-black tracking-widest uppercase mb-1">{label}</p>
            <p className="text-3xl font-black" style={{ color }}>{value}</p>
        </div>
    );
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-yellow-500/50';

function EditForm({ item, onCancel, onSave, saving }: {
    item: BankItem;
    onCancel: () => void;
    onSave: (draft: Draft, approve: boolean) => void;
    saving: boolean;
}) {
    const [d, setD] = useState<Draft>({
        text: item.text, options: [...item.options], correctIndex: item.correctIndex,
        explanation: item.explanation, hint: item.hint, subject: item.subject, topic: item.topic,
        grade: item.grade, difficulty: item.difficulty,
    });
    const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(prev => ({ ...prev, [k]: v }));

    return (
        <div className="space-y-3">
            <textarea value={d.text} onChange={e => set('text', e.target.value)} rows={3} className={inputCls} />
            <div className="space-y-2">
                {d.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <button type="button" onClick={() => set('correctIndex', i)} title="To'g'ri javob"
                            className="w-8 h-8 shrink-0 rounded-lg font-black text-sm"
                            style={d.correctIndex === i ? { background: '#00E676', color: '#000' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                            {String.fromCharCode(65 + i)}
                        </button>
                        <input value={opt} onChange={e => set('options', d.options.map((o, j) => (j === i ? e.target.value : o)))} className={inputCls} />
                    </div>
                ))}
            </div>
            <textarea value={d.explanation} onChange={e => set('explanation', e.target.value)} rows={2} placeholder="Izoh — nega bu javob to'g'ri" className={inputCls} />
            <input value={d.hint} onChange={e => set('hint', e.target.value)} placeholder="Ishora (ixtiyoriy)" className={inputCls} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select value={d.subject} onChange={e => set('subject', e.target.value)} className={inputCls} style={{ colorScheme: 'dark' }}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={d.topic} onChange={e => set('topic', e.target.value)} placeholder="Mavzu" className={inputCls} />
                <select value={d.grade ?? ''} onChange={e => set('grade', e.target.value === '' ? null : Number(e.target.value))} className={inputCls} style={{ colorScheme: 'dark' }}>
                    <option value="">Barcha sinflar</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
                </select>
                <select value={d.difficulty} onChange={e => set('difficulty', Number(e.target.value))} className={inputCls} style={{ colorScheme: 'dark' }}>
                    {[1, 2, 3].map(x => <option key={x} value={x}>{DIFFICULTY[x]}</option>)}
                </select>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => onSave(d, true)} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-50" style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676' }}>
                    💾 Saqlash va tasdiqlash
                </button>
                <button onClick={() => onSave(d, false)} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-50" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                    Faqat saqlash
                </button>
                <button onClick={onCancel} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-black text-white/40 hover:text-white">
                    Bekor qilish
                </button>
            </div>
        </div>
    );
}

export default function AdminBankPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { locale } = useParams<{ locale: string }>();

    const [view, setView] = useState<View>('queue');
    const [subject, setSubject] = useState('');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<BankItem[]>([]);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showImport, setShowImport] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        const role = (session?.user as any)?.role;
        if (role !== 'MODERATOR' && role !== 'ADMIN') router.replace(`/${locale}`);
    }, [status, session, router, locale]);

    // Qidiruv maydoni har harfda so'rov yubormasin
    useEffect(() => {
        const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ view, page: String(page), stats: '1' });
            if (subject) params.set('subject', subject);
            if (query) params.set('q', query);
            const res = await fetch(`/api/admin/bank?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Yuklashda xato');
            setItems(data.items);
            setTotal(data.total);
            setPageSize(data.pageSize);
            setStats(data.stats);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [view, page, subject, query]);

    useEffect(() => { if (status === 'authenticated') load(); }, [status, load]);

    const act = async (id: string, body: object) => {
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`/api/admin/bank/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Amal bajarilmadi');
            setEditingId(null);
            await load();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-64 text-white/30 font-bold text-lg">Yuklanmoqda...</div>;
    }

    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-1">Admin · Savollar ombori</p>
                    <h1 className="text-3xl font-black text-white">🗃️ Savollar ombori</h1>
                    <p className="text-white/40 text-sm font-semibold mt-1">O&apos;yinlarga faqat tasdiqlangan savollar beriladi.</p>
                </div>
                <button onClick={() => setShowImport(s => !s)} className="px-4 py-2.5 rounded-xl text-sm font-black"
                    style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' }}>
                    {showImport ? '✕ Importni yopish' : '📥 Fayldan import'}
                </button>
            </div>

            {showImport && <BankImportPanel onImported={load} />}

            {stats && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        <StatCard label="Tasdiqlangan" value={stats.approved} color="#00E676" />
                        <StatCard label="Ko'rib chiqish" value={stats.queue} color="#fbbf24" />
                        <StatCard label="Tekshirilmagan" value={stats.unverified} color="#60a5fa" />
                        <StatCard label="Shikoyatlar" value={stats.reported} color="#f87171" />
                        <StatCard label="Rad etilgan" value={stats.rejected} color="rgba(255,255,255,0.5)" />
                        <StatCard label="Ombordan berilgan" value={stats.served} color="#c084fc" />
                    </div>
                    {stats.bySubject.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {stats.bySubject.map(s => (
                                <button key={s.subject} onClick={() => { setSubject(subject === s.subject ? '' : s.subject); setPage(1); }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-black transition-colors"
                                    style={subject === s.subject
                                        ? { background: 'rgba(234,179,8,0.2)', color: '#facc15', border: '1px solid rgba(234,179,8,0.4)' }
                                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {s.subject} · {s.count}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            <div className="flex flex-wrap gap-2">
                {VIEWS.map(v => (
                    <button key={v.id} onClick={() => { setView(v.id); setPage(1); setEditingId(null); }}
                        className="px-4 py-2 rounded-xl text-sm font-black transition-colors"
                        style={view === v.id
                            ? { background: 'rgba(234,179,8,0.18)', color: '#facc15', border: '1px solid rgba(234,179,8,0.35)' }
                            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {v.label}{stats ? ` (${stats[v.statKey] as number})` : ''}
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Savol matni bo'yicha qidirish..." className={`${inputCls} flex-1`} />
                <select value={subject} onChange={e => { setSubject(e.target.value); setPage(1); }} className={`${inputCls} sm:w-64`} style={{ colorScheme: 'dark' }}>
                    <option value="">Barcha fanlar</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10 border border-red-500/20">⚠️ {error}</p>}

            {loading && items.length === 0 ? (
                <p className="text-white/30 font-bold text-center py-16">Yuklanmoqda...</p>
            ) : items.length === 0 ? (
                <p className="text-white/30 font-bold text-center py-16">
                    {view === 'queue' ? "🎉 Ko'rib chiqish navbati bo'sh" : 'Savol topilmadi'}
                </p>
            ) : (
                <div className="space-y-3" style={{ opacity: loading ? 0.6 : 1 }}>
                    {items.map(item => {
                        const st = STATUS_STYLE[item.status];
                        const busy = busyId === item.id;
                        return (
                            <div key={item.id} className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                                    <span className="px-2 py-0.5 rounded-lg" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                                    <span className="text-white/60">{item.subject}</span>
                                    {item.topic && <span className="text-white/35">· {item.topic}</span>}
                                    <span className="text-white/35">· {gradeLabel(item.grade)} · {DIFFICULTY[item.difficulty]}</span>
                                    <span className="ml-auto text-white/25 font-semibold">
                                        {item.generatedBy || item.source} · {item.timesShown} marta berilgan
                                    </span>
                                </div>

                                {editingId === item.id ? (
                                    <EditForm item={item} saving={busy} onCancel={() => setEditingId(null)}
                                        onSave={(draft, approve) => act(item.id, { action: 'save', data: draft, approve })} />
                                ) : (
                                    <>
                                        <p className="text-white font-bold text-base leading-relaxed">{item.text}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                            {item.options.map((o, i) => (
                                                <div key={i} className="px-3 py-2 rounded-xl text-sm font-semibold"
                                                    style={i === item.correctIndex
                                                        ? { background: 'rgba(0,230,118,0.1)', color: '#6ee7b7', border: '1px solid rgba(0,230,118,0.25)' }
                                                        : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {i === item.correctIndex ? '✓ ' : ''}{o}
                                                </div>
                                            ))}
                                        </div>
                                        {item.explanation && <p className="text-white/50 text-sm">💡 {item.explanation}</p>}
                                    </>
                                )}

                                {item.reviewNote && (
                                    <p className="text-sm font-semibold rounded-xl px-3 py-2" style={{ background: 'rgba(251,191,36,0.08)', color: '#fcd34d' }}>
                                        📝 {item.reviewNote}
                                    </p>
                                )}
                                {item.reports.length > 0 && (
                                    <div className="text-sm font-semibold rounded-xl px-3 py-2 space-y-1" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}>
                                        <p className="font-black">⚠️ O&apos;qituvchilar shikoyati ({item.reports.length})</p>
                                        {item.reports.map((r, i) => <p key={i}>• {r.reason || "Sabab ko'rsatilmagan"}</p>)}
                                    </div>
                                )}

                                {editingId !== item.id && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {(item.status !== 'APPROVED' || item.reports.length > 0) && (
                                            <button onClick={() => act(item.id, { action: 'approve' })} disabled={busy}
                                                className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-50" style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676' }}>
                                                ✓ {item.status === 'APPROVED' ? "To'g'ri, shikoyatni yopish" : 'Tasdiqlash'}
                                            </button>
                                        )}
                                        <button onClick={() => setEditingId(item.id)} disabled={busy}
                                            className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-50" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                                            ✏️ Tahrirlash
                                        </button>
                                        {item.status !== 'REJECTED' && (
                                            <button onClick={() => act(item.id, { action: 'reject' })} disabled={busy}
                                                className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                                ✕ Rad etish
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {total > pageSize && (
                <div className="flex items-center justify-between text-sm font-bold text-white/50">
                    <span>{from}–{to} / {total}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || loading} className="px-4 py-2 rounded-xl bg-white/5 disabled:opacity-30">← Oldingi</button>
                        <button onClick={() => setPage(p => p + 1)} disabled={to >= total || loading} className="px-4 py-2 rounded-xl bg-white/5 disabled:opacity-30">Keyingi →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
