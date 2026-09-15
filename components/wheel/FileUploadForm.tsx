'use client';

import { useRef, useState } from 'react';
import type { DraftQuestion } from './types';

export default function FileUploadForm({ onGenerated }: { onGenerated: (qs: DraftQuestion[]) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const submit = async () => {
        if (!file) {
            setError('Fayl tanlang (PDF yoki DOCX)');
            return;
        }
        setLoading(true);
        setError(null);
        setInfo(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('count', String(count));
            const res = await fetch('/api/wheel/parse', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fayl o\'qishda xatolik');
            const drafts: DraftQuestion[] = data.questions.map((q: any) => ({ ...q, source: 'FILE' as const }));
            setInfo(data.method === 'regex' ? `${drafts.length} ta savol test formatidan aniqlandi` : `${drafts.length} ta savol AI yordamida matndan yaratildi`);
            onGenerated(drafts);
        } catch (err: any) {
            setError(err.message || 'Fayl o\'qishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-zukkoo-blueLight transition-colors"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <div className="text-4xl mb-2">📄</div>
                <p className="text-white font-bold">{file ? file.name : 'PDF yoki DOCX faylni tanlang'}</p>
                <p className="text-white/40 text-sm mt-1">Maksimal 5MB</p>
            </div>

            <div>
                <label className="text-white/60 font-bold text-sm block mb-1.5">
                    Format aniqlanmasa AI yaratadigan savollar soni
                </label>
                <input
                    type="number"
                    min={1}
                    max={30}
                    value={count}
                    onChange={e => setCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full rounded-xl bg-white/10 border border-white/10 text-white p-3 font-semibold focus:outline-none focus:border-zukkoo-blueLight"
                />
            </div>

            {info && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 font-semibold text-sm">
                    ✅ {info}
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 font-semibold text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={submit} className="underline font-bold shrink-0 ml-3">Qayta urinish</button>
                </div>
            )}

            <button onClick={submit} disabled={loading || !file} className="btn-primary w-full py-3.5 text-lg disabled:opacity-60">
                {loading ? '⏳ Fayl tahlil qilinmoqda...' : '📤 Faylni yuklash va tahlil qilish'}
            </button>
        </div>
    );
}
