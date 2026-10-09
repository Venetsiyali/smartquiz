'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EngQuestion } from '@/lib/engRace';
import { ENG_PROMPT, SAMPLE_ENG } from '@/lib/engRaceSamples';

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-sky-400/60';

export default function EngRaceCreatePage() {
    const router = useRouter();
    const [title, setTitle] = useState('Grammar Race — B1');
    const [duration, setDuration] = useState(10);
    const [goal, setGoal] = useState(15);
    const [questions, setQuestions] = useState<EngQuestion[]>(SAMPLE_ENG);
    const [topicFilter, setTopicFilter] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [showAi, setShowAi] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    const topics = useMemo(() => Array.from(new Set(questions.map(q => q.topic || 'Boshqa'))), [questions]);

    const create = async () => {
        setError(null); setCreating(true);
        try {
            const res = await fetch('/api/code-race/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind: 'english', title, durationSec: duration * 60, goal, questions }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Xatolik');
            try { localStorage.setItem(`cr-host-${data.pin}`, data.hostKey); } catch { /* ignore */ }
            router.push(`/teacher/code-race/${data.pin}`);
        } catch (err: any) {
            setError(err.message); setCreating(false);
        }
    };

    const shown = questions.map((q, i) => ({ q, i })).filter(({ q }) => !topicFilter || (q.topic || 'Boshqa') === topicFilter);

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <p className="text-sky-400 text-xs font-black uppercase tracking-widest">Ingliz tili grammatikasi poygasi</p>
                    <h1 className="text-3xl md:text-4xl font-black mt-1">🏁 Grammar Race</h1>
                    <p className="text-white/50 mt-2 text-sm">Har bir to&apos;g&apos;ri javob talabani finishga bir qadam yaqinlashtiradi. Xato javobda to&apos;g&apos;risi va qisqa izoh ko&apos;rsatiladi. Kim birinchi finishga yetsa — g&apos;olib!</p>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="O'yin nomi" className={`${field} md:col-span-1`} />
                    <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={field} style={{ colorScheme: 'dark' }}>
                        {[3, 5, 7, 10, 15, 20, 30].map(m => <option key={m} value={m}>⏱ {m} daqiqa</option>)}
                    </select>
                    <select value={goal} onChange={e => setGoal(Number(e.target.value))} className={field} style={{ colorScheme: 'dark' }}>
                        {[5, 10, 15, 20, 25, 30].map(g => <option key={g} value={g}>🏁 Finish: {g} ta to&apos;g&apos;ri javob</option>)}
                    </select>
                </div>

                <div className="flex flex-wrap gap-2 text-sm font-black">
                    <button onClick={() => setQuestions(SAMPLE_ENG)} className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">📚 Namuna: B1 grammatika ({SAMPLE_ENG.length})</button>
                    <button onClick={() => setShowAi(true)} className="px-4 py-2 rounded-xl" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>🧩 Boshqa AI&apos;dan savollar</button>
                    <button onClick={() => setShowAdd(s => !s)} className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">➕ Savol qo&apos;shish</button>
                </div>

                {showAdd && <AddQuestion onAdd={q => { setQuestions(x => [...x, q]); setShowAdd(false); }} />}

                <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setTopicFilter(null)} className={`px-3 py-1 rounded-full text-xs font-black ${!topicFilter ? 'bg-sky-500/30 text-sky-200' : 'bg-white/5 text-white/50'}`}>Hammasi ({questions.length})</button>
                    {topics.map(t => (
                        <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 rounded-full text-xs font-black ${topicFilter === t ? 'bg-sky-500/30 text-sky-200' : 'bg-white/5 text-white/50'}`}>
                            {t} ({questions.filter(q => (q.topic || 'Boshqa') === t).length})
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                    {shown.map(({ q, i }) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                            <span className="text-white/30 font-black w-6 shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold">{q.q}</p>
                                <p className="text-xs text-white/40 mt-0.5">
                                    {q.options ? q.options.map(o => <span key={o} className={o === q.answer ? 'text-emerald-300 font-black' : ''}>{o}{'  ·  '}</span>) : <span className="text-emerald-300 font-black">✍️ {q.answer}</span>}
                                </p>
                            </div>
                            <button onClick={() => setQuestions(x => x.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-300" title="O'chirish">✕</button>
                        </div>
                    ))}
                </div>

                {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}

                <button onClick={create} disabled={creating || questions.length < 3}
                    className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', boxShadow: '0 10px 40px rgba(14,165,233,0.35)' }}>
                    {creating ? '⏳ Yaratilmoqda...' : `🚀 Poygani yaratish (${questions.length} ta savol)`}
                </button>
            </div>

            {showAi && <AiModal onClose={() => setShowAi(false)} onImport={qs => { setQuestions(qs); setShowAi(false); setTopicFilter(null); }} />}
        </div>
    );
}

function AddQuestion({ onAdd }: { onAdd: (q: EngQuestion) => void }) {
    const [q, setQ] = useState('');
    const [options, setOptions] = useState('');
    const [answer, setAnswer] = useState('');
    const [explain, setExplain] = useState('');
    const [topic, setTopic] = useState('');
    const opts = options.split(',').map(o => o.trim()).filter(Boolean);
    const valid = q.includes('___') && answer.trim() && (opts.length === 0 || opts.includes(answer.trim()));
    return (
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Gap, bo'sh joy ___ bilan: She ___ a doctor." className={field} />
            <input value={options} onChange={e => setOptions(e.target.value)} placeholder="Variantlar vergul bilan (bo'sh qoldirsangiz — talaba o'zi yozadi): is, are, am, be" className={field} />
            <div className="grid md:grid-cols-3 gap-2">
                <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="To'g'ri javob" className={field} />
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Mavzu (ixtiyoriy)" className={field} />
                <input value={explain} onChange={e => setExplain(e.target.value)} placeholder="Izoh (ixtiyoriy)" className={field} />
            </div>
            <button disabled={!valid} onClick={() => onAdd({ q, answer: answer.trim(), options: opts.length ? opts : undefined, explain: explain || undefined, topic: topic || undefined })}
                className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-40" style={{ background: 'rgba(14,165,233,0.2)', color: '#7dd3fc' }}>
                ✅ Qo&apos;shish
            </button>
        </div>
    );
}

function AiModal({ onClose, onImport }: { onClose: () => void; onImport: (q: EngQuestion[]) => void }) {
    const [topic, setTopic] = useState('Present Perfect vs Past Simple');
    const [count, setCount] = useState(30);
    const [text, setText] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prompt = ENG_PROMPT(topic, count);

    const load = () => {
        setError(null);
        try {
            const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
            if (!Array.isArray(arr) || arr.length < 3) throw new Error('Kamida 3 ta savol kerak');
            onImport(arr.map((x: any) => ({
                q: String(x.q ?? ''), answer: String(x.answer ?? ''), options: Array.isArray(x.options) ? x.options.map(String) : undefined,
                explain: x.explain ? String(x.explain) : undefined, topic: x.topic ? String(x.topic) : undefined,
            })));
        } catch (err: any) {
            setError(err?.message?.includes('JSON') || !err?.message ? "JSON o'qilmadi — AI javobini to'liq nusxalang" : err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur">
            <div className="w-full max-w-xl rounded-3xl p-6 space-y-3 max-h-[90vh] overflow-y-auto bg-[#111830] border border-white/10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">🧩 Boshqa AI&apos;dan savollar</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-3xl">×</button>
                </div>
                <p className="text-white/60 text-sm font-bold">1. Promptni nusxalab ChatGPT, Claude yoki Gemini&apos;ga yuboring</p>
                <div className="flex gap-2">
                    <input value={topic} onChange={e => setTopic(e.target.value)} className={field} placeholder="Mavzu" />
                    <select value={count} onChange={e => setCount(Number(e.target.value))} className={`${field} !w-24`} style={{ colorScheme: 'dark' }}>
                        {[15, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <pre className="text-white/50 text-xs whitespace-pre-wrap bg-black/30 rounded-xl p-3 max-h-36 overflow-y-auto">{prompt}</pre>
                <button onClick={() => navigator.clipboard.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {})}
                    className="px-4 py-2 rounded-xl text-sm font-black" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>
                    {copied ? '✅ Nusxalandi' : '📋 Promptni nusxalash'}
                </button>
                <p className="text-white/60 text-sm font-bold pt-2">2. AI javobini (JSON) shu yerga joylang</p>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={7} className={`${field} font-mono text-xs`} placeholder='[ { "q": "...", "options": [...], "answer": "..." } ]' />
                {error && <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>}
                <button onClick={load} disabled={!text.trim()} className="w-full py-3 rounded-xl font-black disabled:opacity-40" style={{ background: 'rgba(14,165,233,0.2)', color: '#7dd3fc' }}>
                    ✅ Savollarni yuklash
                </button>
            </div>
        </div>
    );
}
