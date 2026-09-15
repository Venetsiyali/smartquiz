'use client';

import { useState } from 'react';
import type { DraftQuestion } from './types';

export default function AIGenerateForm({ onGenerated }: { onGenerated: (qs: DraftQuestion[]) => void }) {
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState('');
    const [count, setCount] = useState(10);
    const [difficulty, setDifficulty] = useState<'oson' | "o'rta" | 'qiyin'>("o'rta");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async () => {
        if (topic.trim().length < 2) {
            setError('Mavzuni kiriting (kamida 2 ta belgi)');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/wheel/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, grade, count, difficulty, provider: 'groq' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'AI xatoligi');
            const drafts: DraftQuestion[] = data.questions.map((q: any) => ({ ...q, source: 'AI' as const }));
            onGenerated(drafts);
        } catch (err: any) {
            setError(err.message || 'AI hozircha javob bermayapti');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-white/60 font-bold text-sm block mb-1.5">Mavzu</label>
                <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Masalan: O'zbekiston tarixi"
                    className="w-full rounded-xl bg-white/10 border border-white/10 text-white p-3 font-semibold placeholder:text-white/30 focus:outline-none focus:border-zukkoo-blueLight"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-white/60 font-bold text-sm block mb-1.5">Sinf (ixtiyoriy)</label>
                    <input
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        placeholder="7-sinf"
                        className="w-full rounded-xl bg-white/10 border border-white/10 text-white p-3 font-semibold placeholder:text-white/30 focus:outline-none focus:border-zukkoo-blueLight"
                    />
                </div>
                <div>
                    <label className="text-white/60 font-bold text-sm block mb-1.5">Savollar soni</label>
                    <input
                        type="number"
                        min={1}
                        max={30}
                        value={count}
                        onChange={e => setCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full rounded-xl bg-white/10 border border-white/10 text-white p-3 font-semibold focus:outline-none focus:border-zukkoo-blueLight"
                    />
                </div>
            </div>
            <div>
                <label className="text-white/60 font-bold text-sm block mb-1.5">Qiyinlik darajasi</label>
                <div className="flex gap-2">
                    {(['oson', "o'rta", 'qiyin'] as const).map(d => (
                        <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`flex-1 py-2.5 rounded-xl font-bold capitalize transition-colors ${
                                difficulty === d ? 'bg-zukkoo-blueLight text-white' : 'bg-white/10 text-white/60'
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 font-semibold text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={generate} className="underline font-bold shrink-0 ml-3">Qayta urinish</button>
                </div>
            )}

            <button onClick={generate} disabled={loading} className="btn-primary w-full py-3.5 text-lg disabled:opacity-60">
                {loading ? '⏳ AI savol yaratmoqda...' : '✨ Savollarni yaratish'}
            </button>
        </div>
    );
}
