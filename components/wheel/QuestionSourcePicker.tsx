'use client';

import { useState } from 'react';
import AIGenerateForm from './AIGenerateForm';
import FileUploadForm from './FileUploadForm';
import ManualQuestionForm from './ManualQuestionForm';
import type { DraftQuestion } from './types';

type Tab = 'ai' | 'file' | 'manual';

export default function QuestionSourcePicker({ onAdd }: { onAdd: (qs: DraftQuestion[]) => void }) {
    const [tab, setTab] = useState<Tab>('ai');

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'ai', label: 'AI orqali', icon: '✨' },
        { key: 'file', label: 'Fayldan', icon: '📄' },
        { key: 'manual', label: "Qo'lda", icon: '✍️' },
    ];

    return (
        <div className="glass rounded-3xl p-6">
            <div className="flex gap-2 mb-6">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-colors ${
                            tab === t.key ? 'bg-zukkoo-blueLight text-white' : 'bg-white/10 text-white/60'
                        }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'ai' && <AIGenerateForm onGenerated={onAdd} />}
            {tab === 'file' && <FileUploadForm onGenerated={onAdd} />}
            {tab === 'manual' && <ManualQuestionForm onAdd={q => onAdd([q])} />}
        </div>
    );
}
