'use client';

import type { DraftQuestion } from './types';

const SOURCE_LABEL: Record<DraftQuestion['source'], string> = {
    AI: '✨ AI',
    FILE: '📄 Fayl',
    MANUAL: "✍️ Qo'lda",
};

export default function QuestionPreviewList({
    questions,
    onRemove,
    onStart,
    starting,
}: {
    questions: DraftQuestion[];
    onRemove: (idx: number) => void;
    onStart: () => void;
    starting: boolean;
}) {
    return (
        <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">📋 Savollar banki</h2>
                <span className="text-white/50 font-bold text-sm">{questions.length} ta savol</span>
            </div>

            {questions.length === 0 ? (
                <p className="text-white/40 font-semibold text-center py-8">
                    Hali savol qo&apos;shilmagan. Yuqoridagi bo&apos;limlardan savol qo&apos;shing.
                </p>
            ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 mb-6">
                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-white/10 rounded-xl p-3.5">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-white font-bold flex-1">{idx + 1}. {q.question}</p>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-white/40 text-xs font-bold">{SOURCE_LABEL[q.source]}</span>
                                    <button onClick={() => onRemove(idx)} className="text-white/40 hover:text-red-400 font-bold">✕</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                                {q.options.map((opt, i) => (
                                    <span
                                        key={i}
                                        className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                                            i === q.correctIndex ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/50'
                                        }`}
                                    >
                                        {i === q.correctIndex ? '✓ ' : ''}{opt}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={onStart}
                disabled={questions.length === 0 || starting}
                className="btn-primary w-full py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {starting ? '⏳ Boshlanmoqda...' : `🎡 O'yinni boshlash (${questions.length} savol)`}
            </button>
        </div>
    );
}
