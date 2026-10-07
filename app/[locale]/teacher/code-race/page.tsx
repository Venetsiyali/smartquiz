'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CodeTask } from '@/lib/codeRace';
import { SAMPLE_TASKS, TASKS_PROMPT } from '@/lib/codeRaceSamples';

interface DraftTask { title: string; prompt: string; functionName: string; starter: string; tests: string }

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-emerald-400/60';
const mono = `${field} font-mono text-[13px]`;

const toDraft = (t: CodeTask): DraftTask => ({
    title: t.title, prompt: t.prompt, functionName: t.functionName, starter: t.starter,
    tests: t.tests.map(x => `${JSON.stringify(x.args)} => ${JSON.stringify(x.expected)}`).join('\n'),
});

const emptyDraft = (): DraftTask => ({ title: '', prompt: '', functionName: 'yechim', starter: 'def yechim(x):\n    pass\n', tests: '' });

/** "[1, 2] => 3" qatorlarini testlarga aylantiradi. */
function parseTests(text: string, n: number): CodeTask['tests'] {
    return text.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => {
        const idx = line.indexOf('=>');
        if (idx < 0) throw new Error(`${n}-masala, ${i + 1}-test: "=>" belgisi yo'q`);
        try {
            const args = JSON.parse(line.slice(0, idx));
            const expected = JSON.parse(line.slice(idx + 2));
            if (!Array.isArray(args)) throw new Error();
            return { args, expected };
        } catch {
            throw new Error(`${n}-masala, ${i + 1}-test noto'g'ri. Namuna: ["Ali", 3] => "natija"`);
        }
    });
}

export default function CodeRaceCreatePage() {
    const router = useRouter();
    const [title, setTitle] = useState("Python asoslari");
    const [duration, setDuration] = useState(20);
    const [drafts, setDrafts] = useState<DraftTask[]>(() => SAMPLE_TASKS.map(toDraft));
    const [open, setOpen] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [showAi, setShowAi] = useState(false);

    const update = (i: number, patch: Partial<DraftTask>) => setDrafts(d => d.map((x, j) => j === i ? { ...x, ...patch } : x));

    const create = async () => {
        setError(null);
        let tasks: CodeTask[];
        try {
            tasks = drafts.map((d, i) => ({ ...d, tests: parseTests(d.tests, i + 1) }));
        } catch (err: any) { setError(err.message); return; }
        setCreating(true);
        try {
            const res = await fetch('/api/code-race/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, durationSec: duration * 60, tasks }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Xatolik');
            try { localStorage.setItem(`cr-host-${data.pin}`, data.hostKey); } catch { /* ignore */ }
            router.push(`/teacher/code-race/${data.pin}`);
        } catch (err: any) {
            setError(err.message);
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Jonli dasturlash musobaqasi</p>
                    <h1 className="text-3xl md:text-4xl font-black mt-1">🏔️ Kod Cho&apos;qqisi</h1>
                    <p className="text-white/50 mt-2 text-sm">Talabalar Python kod yozadi, har bir yechilgan masala ularni bir pog&apos;ona yuqoriga ko&apos;taradi. Kim birinchi cho&apos;qqiga chiqsa — g&apos;olib!</p>
                </div>

                <div className="grid md:grid-cols-[1fr_180px] gap-3">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="O'yin nomi" className={field} />
                    <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={field} style={{ colorScheme: 'dark' }}>
                        {[5, 10, 15, 20, 30, 45, 60, 90].map(m => <option key={m} value={m}>⏱ {m} daqiqa</option>)}
                    </select>
                </div>

                <div className="flex flex-wrap gap-2 text-sm font-black">
                    <button onClick={() => { setDrafts(SAMPLE_TASKS.map(toDraft)); setTitle('Python asoslari'); }}
                        className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">📚 Namuna: Python asoslari</button>
                    <button onClick={() => setShowAi(true)}
                        className="px-4 py-2 rounded-xl" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>🧩 Boshqa AI&apos;dan masalalar</button>
                    <button onClick={() => { setDrafts(d => [...d, emptyDraft()]); setOpen(drafts.length); }}
                        className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">➕ Masala qo&apos;shish</button>
                </div>

                <div className="space-y-2">
                    {drafts.map((d, i) => (
                        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10">
                            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                                <span className="font-black"><span className="text-emerald-400 mr-2">{i + 1}.</span>{d.title || 'Nomsiz masala'}</span>
                                <span className="text-white/30 text-xs font-mono">{d.functionName}() · {d.tests.split('\n').filter(Boolean).length} test</span>
                            </button>
                            {open === i && (
                                <div className="px-4 pb-4 space-y-2">
                                    <div className="grid md:grid-cols-2 gap-2">
                                        <input value={d.title} onChange={e => update(i, { title: e.target.value })} placeholder="Masala nomi" className={field} />
                                        <input value={d.functionName} onChange={e => update(i, { functionName: e.target.value })} placeholder="Funksiya nomi" className={mono} />
                                    </div>
                                    <textarea value={d.prompt} onChange={e => update(i, { prompt: e.target.value })} rows={3} placeholder="Masala sharti" className={field} />
                                    <label className="block text-white/40 text-xs font-bold">Boshlang&apos;ich kod
                                        <textarea value={d.starter} onChange={e => update(i, { starter: e.target.value })} rows={3} className={`${mono} mt-1`} />
                                    </label>
                                    <label className="block text-white/40 text-xs font-bold">Testlar — har qatorda: <code className="text-emerald-300">[argumentlar] =&gt; natija</code> (birinchi 2 tasi talabaga misol bo&apos;lib ko&apos;rinadi)
                                        <textarea value={d.tests} onChange={e => update(i, { tests: e.target.value })} rows={4} placeholder={'["Ali"] => "Salom, Ali!"'} className={`${mono} mt-1`} />
                                    </label>
                                    <div className="flex gap-2 text-xs font-black">
                                        <button disabled={i === 0} onClick={() => setDrafts(x => { const y = [...x]; [y[i - 1], y[i]] = [y[i], y[i - 1]]; return y; })} className="px-3 py-1.5 rounded-lg bg-white/5 disabled:opacity-30">↑</button>
                                        <button disabled={i === drafts.length - 1} onClick={() => setDrafts(x => { const y = [...x]; [y[i + 1], y[i]] = [y[i], y[i + 1]]; return y; })} className="px-3 py-1.5 rounded-lg bg-white/5 disabled:opacity-30">↓</button>
                                        <button onClick={() => setDrafts(x => x.filter((_, j) => j !== i))} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300">🗑 O&apos;chirish</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}

                <button onClick={create} disabled={creating || drafts.length === 0}
                    className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 10px 40px rgba(16,185,129,0.35)' }}>
                    {creating ? '⏳ Yaratilmoqda...' : `🚀 O'yinni yaratish (${drafts.length} ta masala)`}
                </button>
            </div>

            {showAi && <AiImportModal onClose={() => setShowAi(false)} onImport={tasks => { setDrafts(tasks.map(toDraft)); setOpen(0); setShowAi(false); }} />}
        </div>
    );
}

function AiImportModal({ onClose, onImport }: { onClose: () => void; onImport: (t: CodeTask[]) => void }) {
    const [topic, setTopic] = useState("Shart operatorlari va tsikllar");
    const [count, setCount] = useState(6);
    const [text, setText] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prompt = TASKS_PROMPT(topic, count);

    const load = () => {
        setError(null);
        try {
            const start = text.indexOf('['), end = text.lastIndexOf(']');
            const arr = JSON.parse(text.slice(start, end + 1));
            if (!Array.isArray(arr) || arr.length === 0) throw new Error();
            const tasks: CodeTask[] = arr.map((t: any, i: number) => {
                if (!t?.functionName || !Array.isArray(t?.tests)) throw new Error(`${i + 1}-masalada functionName yoki tests yo'q`);
                return { title: String(t.title ?? ''), prompt: String(t.prompt ?? ''), functionName: String(t.functionName), starter: String(t.starter ?? ''), tests: t.tests };
            });
            onImport(tasks);
        } catch (err: any) {
            setError(err?.message || "JSON o'qilmadi — AI javobini to'liq nusxalang");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur">
            <div className="w-full max-w-xl rounded-3xl p-6 space-y-3 max-h-[90vh] overflow-y-auto bg-[#111830] border border-white/10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">🧩 Boshqa AI&apos;dan masalalar</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-3xl">×</button>
                </div>
                <p className="text-white/60 text-sm font-bold">1. Promptni nusxalab ChatGPT, Claude yoki Gemini&apos;ga yuboring</p>
                <div className="flex gap-2">
                    <input value={topic} onChange={e => setTopic(e.target.value)} className={field} placeholder="Mavzu" />
                    <select value={count} onChange={e => setCount(Number(e.target.value))} className={`${field} !w-24`} style={{ colorScheme: 'dark' }}>
                        {[3, 5, 6, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <pre className="text-white/50 text-xs whitespace-pre-wrap bg-black/30 rounded-xl p-3 max-h-36 overflow-y-auto">{prompt}</pre>
                <button onClick={() => navigator.clipboard.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {})}
                    className="px-4 py-2 rounded-xl text-sm font-black" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>
                    {copied ? '✅ Nusxalandi' : '📋 Promptni nusxalash'}
                </button>
                <p className="text-white/60 text-sm font-bold pt-2">2. AI javobini (JSON) shu yerga joylang</p>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={7} className={mono} placeholder='[ { "title": ..., "tests": [...] } ]' />
                {error && <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>}
                <button onClick={load} disabled={!text.trim()} className="w-full py-3 rounded-xl font-black disabled:opacity-40" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
                    ✅ Masalalarni yuklash
                </button>
            </div>
        </div>
    );
}
