'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

type QuestionType = 'multiple' | 'truefalse';
interface AnswerOption { text: string; isCorrect: boolean; }
interface QuizQuestion { id: string; type: QuestionType; text: string; options: AnswerOption[]; timeLimit: number; imageUrl?: string; }

const MULTI_DEFAULTS = (): AnswerOption[] => [
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
];
const TF_DEFAULTS = (): AnswerOption[] => [
    { text: "To'g'ri ✅", isCorrect: false },
    { text: "Noto'g'ri ❌", isCorrect: false },
];
const TIME_OPTIONS = [10, 20, 30, 60, 90, 120];
const OPTION_COLORS = [
    { cls: 'btn-red', icon: '🔴' }, { cls: 'btn-blue', icon: '🔵' },
    { cls: 'btn-yellow', icon: '🟡' }, { cls: 'btn-green', icon: '🟢' },
];

/* ── AI Modal ── */
function AIModal({ onClose, onImport }: { onClose: () => void; onImport: (q: QuizQuestion[]) => void }) {
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(5);
    const [lang, setLang] = useState('uz');
    const [timeLimit, setTimeLimit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<QuizQuestion[] | null>(null);

    const generate = async () => {
        if (!topic.trim()) { setError('Mavzu kiriting'); return; }
        setError(''); setLoading(true); setPreview(null);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, count, language: lang }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Xatolik'); return; }
            const mapped: QuizQuestion[] = data.questions.map((q: any) => ({
                id: uuidv4(), type: 'multiple' as QuestionType,
                text: q.text,
                options: q.options.map((o: string, i: number) => ({ text: o, isCorrect: q.correctOptions.includes(i) })),
                timeLimit,
            }));
            setPreview(mapped);
        } catch { setError('Server xatoligi'); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
            <div className="glass w-full max-w-2xl rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black"
                            style={{ background: 'linear-gradient(135deg, #0056b3, #FFD600)' }}>🤖</div>
                        <div>
                            <h2 className="text-xl font-black text-white">AI Savol Yaratuvchi</h2>
                            <p className="text-white/40 text-xs font-bold">Groq · LLaMA 3.3-70B</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-3xl leading-none transition-colors">×</button>
                </div>

                <div>
                    <label className="text-white/50 font-bold text-xs block mb-2">MAVZU</label>
                    <input value={topic} onChange={(e) => setTopic(e.target.value)}
                        placeholder="Masalan: O'zbekiston tarixi, Python, Matematik analiz..."
                        className="input-game text-base" onKeyDown={(e) => e.key === 'Enter' && generate()} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-white/50 font-bold text-xs block mb-2">SONI</label>
                        <div className="flex flex-wrap gap-2">
                            {[3, 5, 8, 10].map(n => (
                                <button key={n} onClick={() => setCount(n)}
                                    className="px-3 py-2 rounded-xl text-sm font-bold transition-all"
                                    style={count === n ? { background: '#0056b3', color: 'white', boxShadow: '0 4px 16px rgba(0,86,179,0.5)' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-white/50 font-bold text-xs block mb-2">TIL</label>
                        <div className="flex gap-2">
                            {[{ c: 'uz', l: '🇺🇿 UZ' }, { c: 'ru', l: '🇷🇺 RU' }, { c: 'en', l: '🇬🇧 EN' }].map(x => (
                                <button key={x.c} onClick={() => setLang(x.c)}
                                    className="px-2 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={lang === x.c ? { background: '#0056b3', color: 'white' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                    {x.l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-white/50 font-bold text-xs block mb-2">TAYMER</label>
                        <div className="flex flex-wrap gap-2">
                            {[10, 20, 30].map(t => (
                                <button key={t} onClick={() => setTimeLimit(t)}
                                    className="px-3 py-2 rounded-xl text-sm font-bold transition-all"
                                    style={timeLimit === t ? { background: '#FF1744', color: 'white' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                    {t}s
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-400 font-bold text-sm text-center bg-red-500/10 rounded-xl py-2">⚠️ {error}</p>}

                <button onClick={generate} disabled={loading} className="w-full btn-primary justify-center disabled:opacity-50 disabled:transform-none">
                    {loading ? <><span className="animate-spin">🤖</span> Tayyorlanmoqda...</> : '✨ AI bilan Yaratish'}
                </button>

                {preview && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-green-400 font-bold text-sm">✅ {preview.length} ta savol tayyor</p>
                            <button onClick={generate} className="text-xs text-white/40 hover:text-white/60 font-bold transition-colors">🔄 Qayta</button>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-hide">
                            {preview.map((q, i) => (
                                <div key={q.id} className="glass-blue p-3 rounded-xl">
                                    <p className="text-white font-bold text-sm mb-2">{i + 1}. {q.text}</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {q.options.map((o, oi) => (
                                            <div key={oi} className={`text-xs px-2 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${o.isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/50'}`}>
                                                {['🔴', '🔵', '🟡', '🟢'][oi]} <span className="truncate">{o.text}</span>
                                                {o.isCorrect && <span className="ml-auto">✅</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => { onImport(preview); onClose(); }}
                            className="w-full py-4 rounded-2xl font-extrabold text-white text-lg transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #00E676, #009944)', boxShadow: '0 8px 28px rgba(0,230,118,0.35)' }}>
                            ✅ Quizga qo&apos;shish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main Quiz Builder ── */
export default function TeacherCreatePage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([{ id: uuidv4(), type: 'multiple', text: '', options: MULTI_DEFAULTS(), timeLimit: 20 }]);
    const [active, setActive] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [showAI, setShowAI] = useState(false);

    const q = questions[active];

    const upQ = useCallback((patch: Partial<QuizQuestion>) => {
        setQuestions(prev => prev.map((x, i) => i === active ? { ...x, ...patch } : x));
    }, [active]);

    const setType = (type: QuestionType) => {
        upQ({ type, options: type === 'truefalse' ? TF_DEFAULTS() : MULTI_DEFAULTS() });
    };

    const setOptText = useCallback((oi: number, val: string) => {
        setQuestions(prev => prev.map((x, i) => {
            if (i !== active) return x;
            return { ...x, options: x.options.map((o, j) => j === oi ? { ...o, text: val } : o) };
        }));
    }, [active]);

    const toggleCorrect = useCallback((oi: number) => {
        setQuestions(prev => prev.map((x, i) => {
            if (i !== active) return x;
            return { ...x, options: x.options.map((o, j) => j === oi ? { ...o, isCorrect: !o.isCorrect } : o) };
        }));
    }, [active]);

    const addQ = () => {
        const nq: QuizQuestion = { id: uuidv4(), type: 'multiple', text: '', options: MULTI_DEFAULTS(), timeLimit: 20 };
        setQuestions(p => [...p, nq]);
        setActive(questions.length);
    };

    const delQ = (idx: number) => {
        if (questions.length === 1) return;
        setQuestions(p => p.filter((_, i) => i !== idx));
        setActive(Math.max(0, idx - 1));
    };

    const aiImport = (qs: QuizQuestion[]) => {
        const empty = questions.length === 1 && !questions[0].text.trim();
        setQuestions(empty ? qs : prev => [...prev, ...qs]);
        setActive(0);
    };

    const validate = () => {
        const errs: string[] = [];
        if (!title.trim()) errs.push('Quiz nomi kerak');
        questions.forEach((q, i) => {
            if (!q.text.trim()) errs.push(`${i + 1}-savol bo'sh`);
            if (!q.options.some(o => o.isCorrect)) errs.push(`${i + 1}-savolda to'g'ri javob yo'q`);
            if (q.type === 'multiple' && q.options.filter(o => o.text.trim()).length < 2) errs.push(`${i + 1}-savolda kamida 2 variant kerak`);
        });
        setErrors(errs);
        return errs.length === 0;
    };

    const startLobby = () => {
        if (!validate()) return;
        const quiz = {
            title,
            questions: questions.map(q => ({
                id: q.id, type: q.type, text: q.text,
                options: q.options.map(o => o.text),
                correctOptions: q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1),
                timeLimit: q.timeLimit, imageUrl: q.imageUrl,
            })),
        };
        sessionStorage.setItem('quiz', JSON.stringify(quiz));
        router.push('/teacher/lobby');
    };

    return (
        <div className="bg-host min-h-screen">
            {showAI && <AIModal onClose={() => setShowAI(false)} onImport={aiImport} />}

            {/* Header */}
            <header className="flex items-center gap-3 p-4 md:p-5 border-b border-white/10">
                <button onClick={() => router.push('/')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
                <div className="flex items-center gap-2 mr-2">
                    <span className="text-xl font-black text-white">Zukk<span className="logo-z">oo</span></span>
                    <span className="text-white/30 font-bold">·</span>
                    <span className="text-white/50 font-bold text-sm">Quiz Yaratish</span>
                </div>
                <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Quiz nomini kiriting..."
                    className="input-game flex-1 max-w-xs text-base" style={{ borderRadius: '12px', padding: '10px 18px', textAlign: 'left' }} />
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowAI(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #0056b3, #003d82)', boxShadow: '0 4px 18px rgba(0,86,179,0.45)' }}>
                        🤖 AI Savol
                    </button>
                    <button onClick={startLobby} className="btn-primary text-sm px-5 py-2.5">🚀 Lobbyga o&apos;tish</button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row">
                {/* Sidebar */}
                <aside className="lg:w-64 p-4 border-b lg:border-b-0 lg:border-r border-white/10 space-y-2">
                    <p className="text-white/40 font-bold text-xs mb-3">SAVOLLAR ({questions.length})</p>
                    <div className="space-y-1.5 max-h-56 lg:max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-hide">
                        {questions.map((q, i) => (
                            <div key={q.id} onClick={() => setActive(i)}
                                className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all group"
                                style={{ background: active === i ? 'rgba(0,86,179,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active === i ? 'rgba(0,86,179,0.5)' : 'transparent'}` }}>
                                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{ background: active === i ? '#0056b3' : 'rgba(255,255,255,0.1)' }}>{i + 1}</span>
                                <span className="flex-1 text-xs font-bold text-white/70 truncate">{q.text || 'Savol...'}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                    style={{ background: q.type === 'truefalse' ? 'rgba(0,230,118,0.15)' : 'rgba(0,86,179,0.15)', color: q.type === 'truefalse' ? '#00E676' : '#60a5fa' }}>
                                    {q.type === 'truefalse' ? 'T/F' : 'MC'}
                                </span>
                                {questions.length > 1 && (
                                    <button onClick={e => { e.stopPropagation(); delQ(i); }}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 text-lg leading-none transition-opacity">×</button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button onClick={addQ} className="w-full p-2.5 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 text-xs font-bold transition-all">
                        + Savol qo&apos;shish
                    </button>
                    <button onClick={() => setShowAI(true)}
                        className="w-full p-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center justify-center gap-1.5"
                        style={{ background: 'rgba(0,86,179,0.15)', border: '1px solid rgba(0,86,179,0.3)', color: '#93c5fd' }}>
                        🤖 AI bilan qo&apos;shish
                    </button>
                </aside>

                {/* Editor */}
                <main className="flex-1 p-4 md:p-8 space-y-5">
                    {/* Type toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-white/50 font-bold text-sm">Savol turi:</span>
                        {([['multiple', '📋 Ko\'p tanlov'], ['truefalse', '✅ To\'g\'ri/Noto\'g\'ri']] as [QuestionType, string][]).map(([t, l]) => (
                            <button key={t} onClick={() => setType(t)}
                                className="px-4 py-2 rounded-xl font-bold text-sm transition-all"
                                style={q.type === t ? { background: '#0056b3', color: 'white', boxShadow: '0 4px 16px rgba(0,86,179,0.4)' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* Question text */}
                    <div className="glass p-5 space-y-3">
                        <label className="text-white/50 font-bold text-xs">SAVOL #{active + 1}</label>
                        <textarea value={q.text} onChange={e => upQ({ text: e.target.value })}
                            placeholder="Savolingizni shu yerga kiriting..."
                            className="w-full bg-transparent text-white text-xl font-bold outline-none resize-none placeholder-white/25" rows={3} />
                        <div className="flex items-center gap-4 flex-wrap">
                            <div>
                                <label className="text-white/40 text-xs font-bold block mb-1">RASM URL (ixtiyoriy)</label>
                                <input value={q.imageUrl || ''} onChange={e => upQ({ imageUrl: e.target.value })}
                                    placeholder="https://..." className="bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-white/70 text-sm outline-none w-64"
                                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-bold block mb-1">VAQT LIMITI</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {TIME_OPTIONS.map(t => (
                                        <button key={t} onClick={() => upQ({ timeLimit: t })}
                                            className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all"
                                            style={q.timeLimit === t ? { background: '#FF1744', color: 'white', boxShadow: '0 3px 12px rgba(255,23,68,0.4)' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                            {t}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {q.imageUrl && <img src={q.imageUrl} alt="preview" className="h-28 rounded-xl object-cover" />}
                    </div>

                    {/* Options */}
                    <div className={`grid gap-4 ${q.type === 'truefalse' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {q.options.map((opt, i) => (
                            <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl ${OPTION_COLORS[i % 4].cls}`}
                                style={{ outline: opt.isCorrect ? '3px solid white' : 'none', outlineOffset: '3px', cursor: 'default' }}>
                                <span className="text-2xl shrink-0">{OPTION_COLORS[i % 4].icon}</span>
                                {q.type === 'truefalse' ? (
                                    <span className="flex-1 text-white font-extrabold text-lg">{opt.text}</span>
                                ) : (
                                    <input value={opt.text} onChange={e => setOptText(i, e.target.value)}
                                        placeholder={`${i + 1}-variant...`}
                                        className="flex-1 bg-transparent text-white font-bold text-base outline-none placeholder-white/40" />
                                )}
                                <button onClick={() => toggleCorrect(i)} className="text-2xl shrink-0 transition-transform hover:scale-110">
                                    {opt.isCorrect ? '✅' : '⬜'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-white/30 text-sm font-bold text-center">✅ ni bosib to&apos;g&apos;ri javob(lar)ni belgilang</p>

                    {errors.length > 0 && (
                        <div className="glass p-4 rounded-2xl" style={{ border: '1px solid rgba(255,23,68,0.4)' }}>
                            {errors.map((e, i) => <p key={i} className="text-red-400 font-bold text-sm">⚠️ {e}</p>)}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
