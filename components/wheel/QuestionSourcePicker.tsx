'use client';

import { useState } from 'react';
import AIGenerateForm from './AIGenerateForm';
import FileUploadForm from './FileUploadForm';
import ManualQuestionForm from './ManualQuestionForm';
import BankPicker from '@/components/bank/BankPicker';
import type { DraftQuestion } from './types';

type Tab = 'bank' | 'ai' | 'file' | 'manual';

export default function QuestionSourcePicker({ onAdd }: { onAdd: (qs: DraftQuestion[]) => void }) {
    const [tab, setTab] = useState<Tab>('bank');

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'bank', label: 'Ombordan', icon: '📚' },
        { key: 'ai', label: 'AI orqali', icon: '✨' },
        { key: 'file', label: 'Fayldan', icon: '📄' },
        { key: 'manual', label: "Qo'lda", icon: '✍️' },
    ];

    return (
        <div className="glass rounded-3xl p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`py-2.5 rounded-xl font-bold transition-colors ${
                            tab === t.key ? 'bg-zukkoo-blueLight text-white' : 'bg-white/10 text-white/60'
                        }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'bank' && (
                <BankPicker onPicked={qs => onAdd(qs.map(q => ({
                    question: q.text,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation,
                    source: 'BANK' as const,
                })))} />
            )}
            {tab === 'ai' && <AIGenerateForm onGenerated={onAdd} />}
            {tab === 'file' && <FileUploadForm onGenerated={onAdd} />}
            {tab === 'manual' && <ManualQuestionForm onAdd={q => onAdd([q])} />}
        </div>
    );
}
