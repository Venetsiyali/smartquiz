'use client';

import { useState } from 'react';
import { SUBJECTS } from '@/lib/questionBank/subjects';

interface Summary {
    found: number;
    ready: number;
    withWarnings: number;
    duplicates: { inFile: number; inBank: number };
    errors: { ref: string; reason: string }[];
    errorCount: number;
    warnings: { ref: string; issues: string[] }[];
    sample: { ref: string; subject: string; topic: string; text: string; options: string[]; correctIndex: number }[];
    imported?: number;
}

const TEXT_TEMPLATE = `Fan: Biologiya
Mavzu: Fotosintez
Sinf: 6
Qiyinlik: oson

1. Fotosintez hujayraning qaysi qismida boradi?
A) Yadroda
B) Xloroplastda
C) Mitoxondriyada
D) Ribosomada
Javob: B
Izoh: Fotosintez xloroplastlarda boradi.

2. Barglarga yashil rang beradigan modda qaysi?
*A) Xlorofill
B) Karotin
C) Gemoglobin
D) Melanin
`;

const CSV_TEMPLATE = '﻿Savol;A;B;C;D;Javob;Izoh;Fan;Mavzu;Sinf;Qiyinlik\n'
    + 'Fotosintez hujayraning qaysi qismida boradi?;Yadroda;Xloroplastda;Mitoxondriyada;Ribosomada;B;Fotosintez xloroplastlarda boradi.;Biologiya;Fotosintez;6;oson\n'
    + '2 + 2 × 2 = ?;8;6;4;2;B;Avval ko\'paytiriladi.;Matematika;Amallar tartibi;5;oson\n';

function download(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-yellow-500/50';

export default function BankImportPanel({ onImported }: { onImported: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState('');
    const [difficulty, setDifficulty] = useState('2');
    const [status, setStatus] = useState<'APPROVED' | 'PENDING'>('APPROVED');
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState<'preview' | 'import' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    const send = async (mode: 'preview' | 'import') => {
        if (!file) return;
        setLoading(mode);
        setError(null);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('mode', mode);
            form.append('status', status);
            form.append('subject', subject);
            form.append('topic', topic);
            form.append('grade', grade);
            form.append('difficulty', difficulty);
            const res = await fetch('/api/admin/bank/import', { method: 'POST', body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Xatolik');
            setSummary(data);
            if (mode === 'import') onImported();
        } catch (err: any) {
            setError(err.message);
            setSummary(null);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(234,179,8,0.25)' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black text-white">📥 Fayldan import</h2>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                    <button onClick={() => setShowGuide(g => !g)} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 hover:text-white">
                        {showGuide ? 'Qoidalarni yashirish' : '📖 Fayl qoidalari'}
                    </button>
                    <button onClick={() => download('zukkoo-namuna.txt', TEXT_TEMPLATE, 'text/plain;charset=utf-8')} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 hover:text-white">
                        ⬇ Namuna (TXT/Word)
                    </button>
                    <button onClick={() => download('zukkoo-namuna.csv', CSV_TEMPLATE, 'text/csv;charset=utf-8')} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 hover:text-white">
                        ⬇ Namuna (Excel/CSV)
                    </button>
                </div>
            </div>

            {showGuide && (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl p-4 bg-black/30 space-y-2">
                        <p className="font-black text-yellow-400">Word / PDF / TXT</p>
                        <pre className="text-white/70 text-xs whitespace-pre-wrap leading-relaxed">{TEXT_TEMPLATE}</pre>
                        <ul className="text-white/50 text-xs space-y-1 list-disc pl-4">
                            <li>Aynan 4 ta variant: <b>A) B) C) D)</b> (yoki А) Б) В) Г)). Word&apos;ning avtomatik ro&apos;yxati o&apos;qilmaydi — harflarni qo&apos;lda yozing.</li>
                            <li>To&apos;g&apos;ri javob: <b>Javob: B</b> qatori yoki variant oldida <b>*</b> / <b>+</b>.</li>
                            <li><b>Fan / Mavzu / Sinf / Qiyinlik</b> sarlavhalari keyingi savollarga qo&apos;llanadi. Fan o&apos;zgarsa, mavzuni qayta yozing.</li>
                            <li><b>Izoh:</b> va <b>Ishora:</b> — ixtiyoriy.</li>
                        </ul>
                    </div>
                    <div className="rounded-xl p-4 bg-black/30 space-y-2">
                        <p className="font-black text-yellow-400">Excel (.xlsx) / CSV</p>
                        <p className="text-white/70 text-xs">1-qator — sarlavha. Majburiy ustunlar: <b>Savol, A, B, C, D, Javob</b>.</p>
                        <p className="text-white/70 text-xs">Ixtiyoriy: <b>Izoh, Ishora, Fan, Mavzu, Sinf, Qiyinlik</b>. Ustunlar tartibi muhim emas.</p>
                        <p className="text-white/50 text-xs">Javob: A/B/C/D yoki 1–4. Qiyinlik: oson / o&apos;rta / qiyin. Sinf: 1–11 yoki &quot;kurs&quot; (oliy ta&apos;lim).</p>
                        <p className="text-white/50 text-xs">Faylda ko&apos;rsatilmagan fan, mavzu, sinf va qiyinlik pastdagi formadan olinadi.</p>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
                <label className="block md:col-span-2">
                    <span className="text-white/50 text-xs font-black uppercase tracking-wider">Fayl (DOCX, PDF, TXT, XLSX, CSV — 5MB gacha)</span>
                    <input type="file" accept=".docx,.pdf,.txt,.xlsx,.csv"
                        onChange={e => { setFile(e.target.files?.[0] ?? null); setSummary(null); setError(null); }}
                        className={`${field} mt-1 file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-500/20 file:text-yellow-300 file:font-black file:px-3 file:py-1`} />
                </label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className={field} style={{ colorScheme: 'dark' }}>
                    <option value="">Fan — fayldan olinsin</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Mavzu (ixtiyoriy)" className={field} />
                <select value={grade} onChange={e => setGrade(e.target.value)} className={field} style={{ colorScheme: 'dark' }}>
                    <option value="">Sinf — barcha</option>
                    {Array.from({ length: 11 }, (_, i) => i + 1).map(g => <option key={g} value={g}>{g}-sinf</option>)}
                    <option value="12">Oliy ta&apos;lim</option>
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={field} style={{ colorScheme: 'dark' }}>
                    <option value="1">Oson</option>
                    <option value="2">O&apos;rta</option>
                    <option value="3">Qiyin</option>
                </select>
                <div className="md:col-span-2 flex flex-wrap gap-4 text-sm font-semibold text-white/70">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={status === 'APPROVED'} onChange={() => setStatus('APPROVED')} />
                        Darhol tasdiqlash (o&apos;yinlarga chiqadi)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={status === 'PENDING'} onChange={() => setStatus('PENDING')} />
                        Avval AI tekshiruvidan o&apos;tkazish (npm run bank:verify)
                    </label>
                </div>
            </div>

            <button onClick={() => send('preview')} disabled={!file || !!loading}
                className="px-5 py-2.5 rounded-xl text-sm font-black disabled:opacity-40" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                {loading === 'preview' ? '⏳ Tekshirilmoqda...' : '🔍 Faylni tekshirish'}
            </button>

            {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}

            {summary && (
                <div className="space-y-3">
                    {summary.imported !== undefined ? (
                        <p className="rounded-xl px-4 py-3 text-sm font-black text-emerald-300 bg-emerald-500/10">
                            ✅ {summary.imported} ta savol omborga qo&apos;shildi{summary.withWarnings > 0 ? ` (${summary.withWarnings} tasi ko'rib chiqish navbatida)` : ''}.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                            {[
                                ['Topildi', summary.found, '#fff'],
                                ['Import uchun tayyor', summary.ready, '#00E676'],
                                ['Ogohlantirish bilan', summary.withWarnings, '#fbbf24'],
                                ['Dublikat', summary.duplicates.inFile + summary.duplicates.inBank, '#60a5fa'],
                                ['Xato', summary.errorCount, '#f87171'],
                            ].map(([label, value, color]) => (
                                <div key={label as string} className="rounded-xl p-3 bg-white/5">
                                    <p className="text-2xl font-black" style={{ color: color as string }}>{value as number}</p>
                                    <p className="text-white/40 text-xs font-bold">{label as string}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {summary.errors.length > 0 && (
                        <div className="rounded-xl p-3 bg-red-500/5 border border-red-500/20 max-h-56 overflow-y-auto text-xs space-y-1">
                            <p className="font-black text-red-300 text-sm">Import qilinmaydigan savollar ({summary.errorCount}):</p>
                            {summary.errors.map((e, i) => <p key={i} className="text-red-200/80"><b>{e.ref}:</b> {e.reason}</p>)}
                        </div>
                    )}
                    {summary.warnings.length > 0 && summary.imported === undefined && (
                        <div className="rounded-xl p-3 bg-yellow-500/5 border border-yellow-500/20 max-h-40 overflow-y-auto text-xs space-y-1">
                            <p className="font-black text-yellow-300 text-sm">Qabul qilinadi, lekin ko&apos;rib chiqish navbatiga tushadi:</p>
                            {summary.warnings.map((w, i) => <p key={i} className="text-yellow-100/70"><b>{w.ref}:</b> {w.issues.join(', ')}</p>)}
                        </div>
                    )}
                    {summary.sample.length > 0 && summary.imported === undefined && (
                        <div className="space-y-2">
                            <p className="text-white/40 text-xs font-black uppercase tracking-wider">Namuna (birinchi {summary.sample.length} ta)</p>
                            {summary.sample.map((q, i) => (
                                <div key={i} className="rounded-xl p-3 bg-white/5 text-sm">
                                    <p className="text-white/40 text-xs font-bold">{q.ref} · {q.subject}{q.topic ? ` · ${q.topic}` : ''}</p>
                                    <p className="text-white font-bold">{q.text}</p>
                                    <p className="text-white/50 text-xs mt-1">
                                        {q.options.map((o, j) => <span key={j} className={j === q.correctIndex ? 'text-emerald-300 font-black' : ''}>{String.fromCharCode(65 + j)}) {o}{'  '}</span>)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {summary.imported === undefined && summary.ready > 0 && (
                        <button onClick={() => send('import')} disabled={!!loading}
                            className="px-5 py-2.5 rounded-xl text-sm font-black disabled:opacity-40" style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676' }}>
                            {loading === 'import' ? '⏳ Import qilinmoqda...' : `✅ ${summary.ready} ta savolni omborga qo'shish`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
