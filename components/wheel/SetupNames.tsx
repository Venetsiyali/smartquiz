'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'wheel_names_draft';

function splitNames(raw: string): string[] {
    return raw
        .split(/[\n,]/)
        .map(n => n.trim())
        .filter(Boolean);
}

export default function SetupNames({ onContinue }: { onContinue: (names: string[]) => void }) {
    const [raw, setRaw] = useState('');
    const [names, setNames] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setNames(JSON.parse(saved));
        } catch {}
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
        } catch {}
    }, [names]);

    const addFromTextarea = () => {
        const parsed = splitNames(raw);
        if (parsed.length === 0) return;
        setNames(prev => Array.from(new Set([...prev, ...parsed])));
        setRaw('');
    };

    const removeName = (idx: number) => {
        setNames(prev => prev.filter((_, i) => i !== idx));
    };

    const startEdit = (idx: number) => {
        setEditingIndex(idx);
        setEditingValue(names[idx]);
    };

    const saveEdit = () => {
        if (editingIndex === null) return;
        const val = editingValue.trim();
        setNames(prev => prev.map((n, i) => (i === editingIndex ? (val || n) : n)));
        setEditingIndex(null);
        setEditingValue('');
    };

    const handleContinue = () => {
        if (names.length < 2) return;
        onContinue(names);
    };

    return (
        <div className="min-h-screen bg-zukkoo-dark flex items-center justify-center p-6">
            <div className="glass w-full max-w-2xl rounded-3xl p-8">
                <h1 className="text-3xl font-black text-white mb-1">🎡 Bilimlar g&apos;ildiragi</h1>
                <p className="text-white/50 font-bold mb-6">O&apos;quvchilar ro&apos;yxatini kiriting</p>

                <textarea
                    value={raw}
                    onChange={e => setRaw(e.target.value)}
                    placeholder={"Har qatorga bitta ism yozing yoki vergul bilan ajratib kiriting:\nAzizbek\nMalika\nJasur"}
                    className="w-full h-32 rounded-2xl bg-white/10 border border-white/10 text-white p-4 font-semibold placeholder:text-white/30 focus:outline-none focus:border-zukkoo-blueLight resize-none"
                />
                <button
                    onClick={addFromTextarea}
                    disabled={splitNames(raw).length === 0}
                    className="btn-primary mt-3 px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ➕ Ro&apos;yxatga qo&apos;shish
                </button>

                {names.length > 0 && (
                    <div className="mt-6">
                        <p className="text-white/60 font-bold text-sm mb-2">{names.length} ta o&apos;quvchi</p>
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                            {names.map((name, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
                                    {editingIndex === idx ? (
                                        <input
                                            autoFocus
                                            value={editingValue}
                                            onChange={e => setEditingValue(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                            onBlur={saveEdit}
                                            className="bg-transparent text-white font-semibold outline-none w-28"
                                        />
                                    ) : (
                                        <button onClick={() => startEdit(idx)} className="text-white font-semibold">
                                            {name}
                                        </button>
                                    )}
                                    <button onClick={() => removeName(idx)} className="text-white/40 hover:text-red-400 font-bold">
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleContinue}
                    disabled={names.length < 2}
                    className="btn-primary w-full mt-8 py-3.5 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Davom etish ({names.length}/2+ ta kerak) →
                </button>
            </div>
        </div>
    );
}
