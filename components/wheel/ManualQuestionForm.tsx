'use client';

import { useState } from 'react';
import type { DraftQuestion } from './types';

const EMPTY_OPTIONS = ['', '', '', ''];

export default function ManualQuestionForm({ onAdd }: { onAdd: (q: DraftQuestion) => void }) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(EMPTY_OPTIONS);
    const [correctIndex, setCorrectIndex] = useState(0);
    const [explanation, setExplanation] = useState('');
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setQuestion('');
        setOptions(EMPTY_OPTIONS);
        setCorrectIndex(0);
        setExplanation('');
    };

    const submit = () => {
        if (question.trim().length < 3) {
            setError('Savol matnini kiriting');
            return;
        }
        if (options.some(o => !o.trim())) {
            setError("Barcha 4 ta variantni to'ldiring");
            return;
        }
        setError(null);
        onAdd({
            question: question.trim(),
            options: options.map(o => o.trim()),
            correctIndex,
            explanation: explanation.trim(),
            source: 'MANUAL',
        });
        reset();
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-white/60 font-bold text-sm block mb-1.5">Savol matni</label>
                <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    className="w-full h-20 rounded-xl bg-white/10 border border-white/10 text-white p-3 font-semibold placeholder:text-white/30 focus:outline-none focus:border-zukkoo-blueLight resize-none"
                    placeholder="Savolni shu yerga yozing..."
                />
            </div>

            <div className="grid grid-cols-1 gap-2.5">
                {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                        <button
                            onClick={() => setCorrectIndex(idx)}
                            title="To'g'ri javob sifatida belgilash"
                            className={`w-9 h-9 shrink-0 rounded-lg font-black flex items-center justify-center transition-colors ${
                                correctIndex === idx ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'
                            }`}
                        >
                            {String.fromCharCode(65 + idx)}
                        </button>
                        <input
                            value={opt}
                            onChange={e => setOptions(prev => prev.map((o, i) => (i === idx ? e.target.value : o)))}
                            placeholder={`Variant ${String.fromCharCode(65 + idx)}`}
                            className="flex-1 rounded-xl bg-white/10 border border-white/10 text-white p-2.5 font-semibold placeholder:text-white/30 focus:outline-none focus:border-zukkoo-blueLight"
                        />
                    </div>
                ))}
            </div>
            <p className="text-white/40 text-xs -mt-1">Harfga bosib to&apos;g&apos;ri javobni belgilang (hozir: {String.fromCharCode(65 + correctIndex)})</p>

            <div>
                <label className="text-white/60 font-bold text-sm block mb-1.5">Izoh — nega bu javob to&apos;g&apos;ri (ixtiyoriy)</label>
                <textarea
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                    className="w-full h-16 rounded-xl bg-white/10 border border-white/10 text-white p-3 font-semibold placeholder:text-white/30 focus:outline-none focus:border-zukkoo-blueLight resize-none"
                    placeholder="Qisqa tushuntirish..."
                />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 font-semibold text-sm">
                    {error}
                </div>
            )}

            <button onClick={submit} className="btn-primary w-full py-3.5 text-lg">
                ➕ Savolni ro&apos;yxatga qo&apos;shish
            </button>
        </div>
    );
}
