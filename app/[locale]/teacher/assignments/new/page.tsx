'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AssignmentShare from '@/components/assignments/AssignmentShare';

interface Q { text: string; options: string[]; correctIndex: number; explanation: string }
interface ParseResult {
    questions: Q[]; errors: { ref: string; reason: string }[];
    errorCount: number; warnings: { ref: string; issues: string[] }[];
}
interface Created { id: string; code: string; url: string }

const LETTERS = ['A', 'B', 'C', 'D'];
const SAMPLE = `1. Pedagogika fani nimani oʻrganadi?
A) Tarbiya qonuniyatlarini
B) Oʻsimliklar tuzilishini
C) Iqlim oʻzgarishini
D) Sonlar nazariyasini
Javob: A
Izoh: Pedagogika — tarbiya haqidagi fan.`;

const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

export default function NewAssignmentPage() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [questions, setQuestions] = useState<Q[]>([]);
    const [source, setSource] = useState<'file' | 'text'>('file');
    const [text, setText] = useState('');
    const [parsing, setParsing] = useState(false);
    const [parseInfo, setParseInfo] = useState<{ errors: string[]; errorCount: number; warnings: ParseResult['warnings'] } | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [timePerQuestion, setTimePerQuestion] = useState(0);
    const [opensAt, setOpensAt] = useState('');
    const [closesAt, setClosesAt] = useState('');
    const [shuffle, setShuffle] = useState(true);
    const [showAnswers, setShowAnswers] = useState<'AFTER_SUBMIT' | 'AFTER_CLOSE' | 'NEVER'>('AFTER_SUBMIT');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState<Created | null>(null);

    // Muharrirdan ("Topshiriq qilish") kelgan savollar
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('assignmentPreload');
            if (!raw) return;
            sessionStorage.removeItem('assignmentPreload');
            const data = JSON.parse(raw);
            if (Array.isArray(data.questions)) setQuestions(data.questions);
            if (data.title) setTitle(data.title);
        } catch {}
    }, []);

    const parse = async (file: File) => {
        setParsing(true);
        setError('');
        setParseInfo(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/assignments/parse', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Faylni oʻqib boʻlmadi'); return; }
            const errs = (data.errors as { ref: string; reason: string }[]).map(e => `${e.ref}: ${e.reason}`);
            setParseInfo({ errors: errs, errorCount: data.errorCount, warnings: data.warnings });
            if (data.questions.length === 0) { setError('Birorta ham savol topilmadi — formatni tekshiring'); return; }
            setQuestions(data.questions);
            if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 200));
        } catch {
            setError('Server bilan aloqa uzildi');
        } finally {
            setParsing(false);
        }
    };

    const parseText = () => {
        if (!text.trim()) return;
        parse(new File([text], 'matn.txt', { type: 'text/plain' }));
    };

    const create = async () => {
        setError('');
        if (title.trim().length < 2) { setError('Topshiriq nomini kiriting'); return; }
        if (questions.length === 0) { setError('Savollar yoʻq'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(), description: description.trim(), questions,
                    maxAttempts, timePerQuestion, shuffle, showAnswers,
                    opensAt: toIso(opensAt), closesAt: toIso(closesAt),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Saqlab boʻlmadi'); return; }
            setCreated(data);
        } catch {
            setError('Server bilan aloqa uzildi');
        } finally {
            setSaving(false);
        }
    };

    const header = (
        <header className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <button onClick={() => router.push('/teacher/assignments')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
            <span className="text-xl font-black text-white">📅 Yangi topshiriq</span>
        </header>
    );

    if (created) return (
        <div className="bg-host min-h-screen">
            {header}
            <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-5">
                <div className="glass rounded-3xl p-6 md:p-8">
                    <p className="text-[#00E676] font-black text-lg mb-1">✅ Topshiriq tayyor</p>
                    <h1 className="text-white font-black text-2xl mb-6">{title}</h1>
                    <AssignmentShare url={created.url} code={created.code} title={title} />
                </div>
                <p className="text-white/50 text-sm font-semibold">
                    QR kodni doskaga chiqaring, chop eting yoki havolani guruhga yuboring. Oʻquvchilar istalgan vaqtda ochib yechadi,
                    natijalar «Natijalar» sahifasida koʻrinadi.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => router.push(`/teacher/assignments/${created.id}`)} className="btn-primary px-6 py-3">📊 Natijalar</button>
                    <button onClick={() => router.push('/teacher/assignments')} className="px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/15 text-white">Barcha topshiriqlar</button>
                </div>
            </div>
        </div>
    );

    const input = 'w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white font-semibold placeholder:text-white/30 outline-none focus:border-blue-400';
    const label = 'block text-white/50 text-xs font-black uppercase tracking-widest mb-1.5';

    return (
        <div className="bg-host min-h-screen">
            {header}
            <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
                {/* 1. Savollar */}
                <section className="glass rounded-3xl p-6">
                    <h2 className="text-white font-black text-lg mb-4">1. Savollar {questions.length > 0 && <span className="text-[#00E676]">· {questions.length} ta</span>}</h2>
                    <div className="flex gap-2 mb-4">
                        {(['file', 'text'] as const).map(s => (
                            <button key={s} onClick={() => setSource(s)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${source === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                                {s === 'file' ? '📄 Fayldan' : '✍️ Matndan'}
                            </button>
                        ))}
                        <button onClick={() => router.push('/teacher/create')} className="px-4 py-2 rounded-xl font-bold text-sm bg-white/5 text-white/50 hover:text-white">
                            🛠 Muharrirda tuzish
                        </button>
                    </div>
                    {source === 'file' ? (
                        <div>
                            <input ref={fileRef} type="file" accept=".txt,.docx,.pdf,.csv,.xlsx" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) parse(f); e.target.value = ''; }} />
                            <button onClick={() => fileRef.current?.click()} disabled={parsing}
                                className="w-full rounded-2xl border-2 border-dashed border-white/15 hover:border-blue-400 py-8 text-white/60 font-bold transition-colors disabled:opacity-50">
                                {parsing ? '⏳ Oʻqilmoqda...' : '📂 Fayl tanlang (TXT, DOCX, PDF, CSV, XLSX · 5MB gacha)'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea value={text} onChange={e => setText(e.target.value)} rows={10} placeholder={SAMPLE}
                                className={`${input} font-mono text-sm`} />
                            <button onClick={parseText} disabled={parsing || !text.trim()} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
                                {parsing ? '⏳ Oʻqilmoqda...' : 'Savollarni ajratish'}
                            </button>
                        </div>
                    )}
                    <p className="text-white/35 text-xs font-semibold mt-3">
                        Format: savol, soʻng A)–D) variantlar, <b>Javob: X</b> va ixtiyoriy <b>Izoh:</b>. Savollar orasida boʻsh qator.
                    </p>

                    {parseInfo && (parseInfo.errorCount > 0 || parseInfo.warnings.length > 0) && (
                        <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm space-y-1 max-h-48 overflow-auto">
                            {parseInfo.errorCount > 0 && <p className="text-amber-300 font-black">⚠️ {parseInfo.errorCount} ta savol oʻtkazib yuborildi:</p>}
                            {parseInfo.errors.map((e, i) => <p key={i} className="text-amber-200/80">{e}</p>)}
                            {parseInfo.warnings.length > 0 && <p className="text-amber-300 font-black pt-1">Sifat boʻyicha eslatmalar:</p>}
                            {parseInfo.warnings.map((w, i) => <p key={`w${i}`} className="text-amber-200/70">{w.ref}: {w.issues.join('; ')}</p>)}
                        </div>
                    )}

                    {questions.length > 0 && (
                        <div className="mt-5 space-y-2 max-h-[28rem] overflow-auto pr-1">
                            {questions.map((q, i) => (
                                <div key={i} className="rounded-xl bg-white/5 p-3.5 flex gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm">{i + 1}. {q.text}</p>
                                        <div className="grid sm:grid-cols-2 gap-x-4 mt-1">
                                            {q.options.map((o, k) => (
                                                <p key={k} className={`text-xs ${k === q.correctIndex ? 'text-[#00E676] font-bold' : 'text-white/45'}`}>
                                                    {LETTERS[k]}) {o}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => setQuestions(qs => qs.filter((_, j) => j !== i))} title="Olib tashlash"
                                        className="text-white/30 hover:text-red-400 text-lg shrink-0">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 2. Sozlamalar */}
                <section className="glass rounded-3xl p-6 space-y-4">
                    <h2 className="text-white font-black text-lg">2. Sozlamalar</h2>
                    <div>
                        <label className={label}>Nomi</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="Masalan: 1.1-§ Pedagogika tarixi" className={input} />
                    </div>
                    <div>
                        <label className={label}>Izoh (ixtiyoriy)</label>
                        <input value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} placeholder="Oʻquvchilar uchun qisqa koʻrsatma" className={input} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className={label}>Necha marta yechish mumkin</label>
                            <select value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} className={input}>
                                <option value={1}>1 marta</option>
                                <option value={2}>2 marta</option>
                                <option value={3}>3 marta</option>
                                <option value={0}>Cheklanmagan (mustaqil tayyorlanish)</option>
                            </select>
                        </div>
                        <div>
                            <label className={label}>Har bir savolga vaqt</label>
                            <select value={timePerQuestion} onChange={e => setTimePerQuestion(Number(e.target.value))} className={input}>
                                <option value={0}>Cheklanmagan</option>
                                <option value={20}>20 soniya</option>
                                <option value={30}>30 soniya</option>
                                <option value={45}>45 soniya</option>
                                <option value={60}>1 daqiqa</option>
                                <option value={120}>2 daqiqa</option>
                            </select>
                        </div>
                        <div>
                            <label className={label}>Ochiladi (ixtiyoriy)</label>
                            <input type="datetime-local" value={opensAt} onChange={e => setOpensAt(e.target.value)} className={input} />
                        </div>
                        <div>
                            <label className={label}>Yopiladi (ixtiyoriy)</label>
                            <input type="datetime-local" value={closesAt} onChange={e => setClosesAt(e.target.value)} className={input} />
                        </div>
                        <div>
                            <label className={label}>Toʻgʻri javoblarni koʻrsatish</label>
                            <select value={showAnswers} onChange={e => setShowAnswers(e.target.value as any)} className={input}>
                                <option value="AFTER_SUBMIT">Yakunlagandan soʻng darhol</option>
                                <option value="AFTER_CLOSE">Topshiriq yopilgandan soʻng</option>
                                <option value="NEVER">Koʻrsatilmasin (faqat ball)</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-3 text-white font-bold cursor-pointer sm:pt-6">
                            <input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                            Savol va variantlarni har oʻquvchiga aralashtirish
                        </label>
                    </div>
                    <p className="text-white/35 text-xs font-semibold">
                        Muddat qoʻyilmasa, havola doimiy ishlaydi (masalan, kitobdagi QR kodlar uchun). Topshiriqni istalgan vaqtda qoʻlda yopish mumkin.
                    </p>
                </section>

                {error && <p className="text-red-400 font-bold">{error}</p>}
                <button onClick={create} disabled={saving || questions.length === 0} className="btn-primary w-full py-4 text-lg disabled:opacity-50">
                    {saving ? '⏳ Saqlanmoqda...' : `📅 Topshiriq yaratish${questions.length ? ` (${questions.length} ta savol)` : ''}`}
                </button>
            </div>
        </div>
    );
}
