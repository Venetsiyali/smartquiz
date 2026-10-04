'use client';

import { useEffect, useMemo, useState } from 'react';

export interface PickedQuestion {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint: string;
}

interface CatalogSubject {
    subject: string;
    count: number;
    topics: { topic: string; count: number }[];
}

export const BANK_PICKER_UZ = {
    subject: 'Fan',
    topic: 'Mavzu',
    allTopics: 'Barcha mavzular',
    grade: 'Sinf',
    allGrades: 'Barcha sinflar',
    gradeN: '{grade}-sinf',
    higherEd: "Oliy ta'lim",
    difficulty: 'Qiyinlik',
    anyDifficulty: 'Aralash',
    easy: 'Oson',
    medium: "O'rta",
    hard: 'Qiyin',
    count: 'Savollar soni',
    submit: '📚 Savollarni olish',
    loading: 'Yuklanmoqda...',
    empty: "Ombor hali bo'sh",
    notFound: "Bu tanlov bo'yicha omborda savol topilmadi. Mavzu yoki sinfni o'zgartirib ko'ring.",
    got: '{count} ta savol qo\'shildi',
    fewer: "Omborda bu tanlov bo'yicha faqat {count} ta savol bor edi — hammasi qo'shildi.",
    note: "Tekshiruvdan o'tgan tayyor savollar — AI kutishsiz, bir zumda.",
};
export type BankPickerLabels = typeof BANK_PICKER_UZ;

const fmt = (s: string, vars: Record<string, string | number>) =>
    s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

const fieldCls = 'w-full rounded-xl bg-white/10 border border-white/10 text-white p-3 font-semibold focus:outline-none focus:border-zukkoo-blueLight';

/** Tayyor savollar omboridan fan / mavzu / sinf / qiyinlik bo'yicha savol tanlash formasi. */
export default function BankPicker({ onPicked, labels = BANK_PICKER_UZ }: {
    onPicked: (questions: PickedQuestion[]) => void;
    labels?: BankPickerLabels;
}) {
    const L = labels;
    const [catalog, setCatalog] = useState<CatalogSubject[] | null>(null);
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/bank/catalog')
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setCatalog(data.subjects);
                if (data.subjects.length > 0) setSubject(data.subjects[0].subject);
            })
            .catch(err => setError(err.message || 'Xatolik'));
    }, []);

    const topics = useMemo(() => catalog?.find(s => s.subject === subject)?.topics ?? [], [catalog, subject]);

    const submit = async () => {
        setLoading(true);
        setError(null);
        setInfo(null);
        try {
            const params = new URLSearchParams({ subject, topic, grade, difficulty, count: String(count) });
            const res = await fetch(`/api/bank/questions?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Xatolik');
            const qs: PickedQuestion[] = data.questions;
            if (qs.length === 0) {
                setError(L.notFound);
                return;
            }
            setInfo(qs.length < count ? fmt(L.fewer, { count: qs.length }) : fmt(L.got, { count: qs.length }));
            onPicked(qs);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (catalog === null && !error) return <p className="text-white/40 font-semibold text-center py-6">{L.loading}</p>;
    if (catalog !== null && catalog.length === 0) return <p className="text-white/40 font-semibold text-center py-6">{L.empty}</p>;

    return (
        <div className="space-y-4">
            <p className="text-white/40 text-sm font-semibold">{L.note}</p>
            {catalog && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-white/60 font-bold text-sm block mb-1.5">{L.subject}</span>
                            <select value={subject} onChange={e => { setSubject(e.target.value); setTopic(''); }} className={fieldCls} style={{ colorScheme: 'dark' }}>
                                {catalog.map(s => <option key={s.subject} value={s.subject}>{s.subject} ({s.count})</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-white/60 font-bold text-sm block mb-1.5">{L.topic}</span>
                            <select value={topic} onChange={e => setTopic(e.target.value)} className={fieldCls} style={{ colorScheme: 'dark' }}>
                                <option value="">{L.allTopics}</option>
                                {topics.map(t => <option key={t.topic} value={t.topic}>{t.topic} ({t.count})</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-white/60 font-bold text-sm block mb-1.5">{L.grade}</span>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className={fieldCls} style={{ colorScheme: 'dark' }}>
                                <option value="">{L.allGrades}</option>
                                {Array.from({ length: 11 }, (_, i) => i + 1).map(g => <option key={g} value={g}>{fmt(L.gradeN, { grade: g })}</option>)}
                                <option value="12">{L.higherEd}</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-white/60 font-bold text-sm block mb-1.5">{L.difficulty}</span>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={fieldCls} style={{ colorScheme: 'dark' }}>
                                <option value="">{L.anyDifficulty}</option>
                                <option value="1">{L.easy}</option>
                                <option value="2">{L.medium}</option>
                                <option value="3">{L.hard}</option>
                            </select>
                        </label>
                    </div>
                    <label className="block">
                        <span className="text-white/60 font-bold text-sm block mb-1.5">{L.count}</span>
                        <input type="number" min={1} max={30} value={count}
                            onChange={e => setCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                            className={fieldCls} />
                    </label>
                </>
            )}

            {info && <p className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 font-semibold text-sm">✅ {info}</p>}
            {error && <p className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 font-semibold text-sm">{error}</p>}

            {catalog && (
                <button onClick={submit} disabled={loading || !subject} className="btn-primary w-full py-3.5 text-lg disabled:opacity-60">
                    {loading ? `⏳ ${L.loading}` : L.submit}
                </button>
            )}
        </div>
    );
}
