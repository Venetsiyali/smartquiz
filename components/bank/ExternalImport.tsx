'use client';

import { useState } from 'react';

export interface ExternalImportLabels {
    step1: string; step2: string;
    topicPlaceholder: string; count: string;
    prompt: string; copy: string; copied: string;
    pastePlaceholder: string; orFile: string;
    check: string; checking: string;
    found: string; failed: string; warning: string;
    add: string; empty: string;
}

export interface ExternalQuestion { text: string; options: string[]; correctIndex: number; explanation: string; warnings: string[] }

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-yellow-500/50';

const fill = (s: string, vars: Record<string, string | number>) =>
    s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

/** Tashqi AI'da (ChatGPT, Gemini...) tayyorlangan savollarni matn yoki fayldan o'qib oluvchi panel. */
export default function ExternalImport({ labels, onPicked }: { labels: ExternalImportLabels; onPicked: (qs: ExternalQuestion[]) => void }) {
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(10);
    const [copied, setCopied] = useState(false);
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ questions: ExternalQuestion[]; total: number; errors: { ref: string; reason: string }[]; errorCount: number } | null>(null);

    const prompt = fill(labels.prompt, { topic: topic.trim() || '...', count });

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard ruxsati yo'q — foydalanuvchi qo'lda nusxalaydi */ }
    };

    const check = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const form = new FormData();
            if (file) form.append('file', file);
            else form.append('text', text);
            const res = await fetch('/api/quiz/import', { method: 'POST', body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Xatolik');
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-white/5 space-y-3">
                <p className="text-white font-black text-sm">{labels.step1}</p>
                <div className="flex gap-2">
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={labels.topicPlaceholder} className={field} />
                    <select value={count} onChange={e => setCount(Number(e.target.value))} className={`${field} !w-28`} style={{ colorScheme: 'dark' }} aria-label={labels.count}>
                        {[5, 10, 15, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <pre className="text-white/60 text-xs whitespace-pre-wrap bg-black/30 rounded-xl p-3 max-h-40 overflow-y-auto">{prompt}</pre>
                <button onClick={copyPrompt} className="px-4 py-2 rounded-xl text-sm font-black" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>
                    {copied ? labels.copied : labels.copy}
                </button>
            </div>

            <div className="rounded-2xl p-4 bg-white/5 space-y-3">
                <p className="text-white font-black text-sm">{labels.step2}</p>
                <textarea value={text} onChange={e => { setText(e.target.value); setResult(null); }} disabled={!!file}
                    placeholder={labels.pastePlaceholder} rows={7} className={`${field} resize-y disabled:opacity-40`} />
                <label className="block">
                    <span className="text-white/40 text-xs font-bold">{labels.orFile}</span>
                    <input type="file" accept=".docx,.pdf,.txt,.xlsx,.csv"
                        onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null); }}
                        className={`${field} mt-1 file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-500/20 file:text-yellow-300 file:font-black file:px-3 file:py-1`} />
                </label>
                <button onClick={check} disabled={loading || (!file && !text.trim())}
                    className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-40" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                    {loading ? labels.checking : labels.check}
                </button>
            </div>

            {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}

            {result && (
                <div className="space-y-3">
                    <p className="text-sm font-black text-emerald-300">{fill(labels.found, { n: result.total })}</p>
                    {result.errorCount > 0 && (
                        <div className="rounded-xl p-3 bg-red-500/5 border border-red-500/20 max-h-40 overflow-y-auto text-xs space-y-1">
                            <p className="font-black text-red-300 text-sm">{fill(labels.failed, { n: result.errorCount })}</p>
                            {result.errors.map((e, i) => <p key={i} className="text-red-200/80"><b>{e.ref}:</b> {e.reason}</p>)}
                        </div>
                    )}
                    {result.questions.length === 0 ? (
                        <p className="text-white/50 text-sm">{labels.empty}</p>
                    ) : (
                        <>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {result.questions.map((q, i) => (
                                    <div key={i} className="rounded-xl p-3 bg-white/5 text-sm">
                                        <p className="text-white font-bold">{i + 1}. {q.text}</p>
                                        <p className="text-white/50 text-xs mt-1">
                                            {q.options.map((o, j) => <span key={j} className={j === q.correctIndex ? 'text-emerald-300 font-black' : ''}>{String.fromCharCode(65 + j)}) {o}{'  '}</span>)}
                                        </p>
                                        {q.warnings.length > 0 && <p className="text-yellow-300/70 text-xs mt-1">{labels.warning}: {q.warnings.join(', ')}</p>}
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => onPicked(result.questions)}
                                className="w-full px-4 py-3 rounded-xl text-sm font-black" style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676' }}>
                                {fill(labels.add, { n: result.questions.length })}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
