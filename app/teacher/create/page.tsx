'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useSubscription, ProLock, CrownBadge, PLAN_LIMITS } from '@/lib/subscriptionContext';

type QuestionType = 'multiple' | 'truefalse';
interface AnswerOption { text: string; isCorrect: boolean; }
interface QuizQuestion {
    id: string; type: QuestionType; text: string;
    options: AnswerOption[]; timeLimit: number;
    imageUrl?: string; explanation?: string;
}

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

/* ── File Upload Modal ── */
function FileModal({ onClose, onImport }: { onClose: () => void; onImport: (qs: QuizQuestion[]) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [count, setCount] = useState(5);
    const [lang, setLang] = useState('uz');
    const [timeLimit, setTimeLimit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<QuizQuestion[] | null>(null);
    const [fileInfo, setFileInfo] = useState<{ name: string; chars: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!file) { setError('Fayl tanlang'); return; }
        setError(''); setLoading(true); setPreview(null);

        const fd = new FormData();
        fd.append('file', file);
        fd.append('count', String(count));
        fd.append('language', lang);
        fd.append('timeLimit', String(timeLimit));

        try {
            const res = await fetch('/api/ai/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Xatolik'); setLoading(false); return; }

            const mapped: QuizQuestion[] = data.questions.map((q: any) => ({
                id: uuidv4(), type: 'multiple' as QuestionType, text: q.text,
                options: q.options.map((o: string, i: number) => ({ text: o, isCorrect: q.correctOptions.includes(i) })),
                timeLimit: q.timeLimit || timeLimit,
                explanation: q.explanation || '',
            }));
            setPreview(mapped);
            setFileInfo(data.fileInfo);
        } catch { setError('Server xatoligi'); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
            <div className="glass w-full max-w-2xl rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white">📄 Fayl orqali Savol Yaratish</h2>
                        <p className="text-white/40 text-xs font-bold">PDF yoki DOCX → AI → Savollar</p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-3xl">×</button>
                </div>

                {/* Drop zone */}
                <div onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-[#0056b3]"
                    style={{ borderColor: file ? '#00E676' : 'rgba(255,255,255,0.2)' }}>
                    <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
                        onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); }} />
                    <div className="text-4xl mb-2">{file ? '📄' : '📁'}</div>
                    {file ? (
                        <div>
                            <p className="text-green-400 font-bold">{file.name}</p>
                            <p className="text-white/40 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-white/60 font-bold">PDF yoki DOCX faylni shu yerga tashlang</p>
                            <p className="text-white/30 text-sm">yoki bosing</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-white/50 font-bold text-xs block mb-1.5">SONI</label>
                        <div className="flex flex-wrap gap-1.5">
                            {[3, 5, 8, 10, 15].map(n => (
                                <button key={n} onClick={() => setCount(n)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={count === n ? { background: '#0056b3', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-white/50 font-bold text-xs block mb-1.5">TIL</label>
                        <div className="flex gap-1.5">
                            {[{ c: 'uz', l: '🇺🇿' }, { c: 'ru', l: '🇷🇺' }, { c: 'en', l: '🇬🇧' }].map(x => (
                                <button key={x.c} onClick={() => setLang(x.c)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={lang === x.c ? { background: '#0056b3', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                    {x.l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-white/50 font-bold text-xs block mb-1.5">VAQT</label>
                        <div className="flex flex-wrap gap-1">
                            {[20, 30, 60].map(t => (
                                <button key={t} onClick={() => setTimeLimit(t)}
                                    className="px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={timeLimit === t ? { background: '#FF1744', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                    {t}s
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-400 font-bold text-sm text-center bg-red-500/10 rounded-xl py-2">⚠️ {error}</p>}

                <button onClick={handleUpload} disabled={loading || !file}
                    className="w-full btn-primary justify-center disabled:opacity-50 disabled:transform-none">
                    {loading ? <><span className="animate-spin">⚙️</span> Tahlil qilinmoqda...</> : '🤖 AI bilan Tahlil Qilish'}
                </button>

                {fileInfo && <p className="text-center text-white/30 text-xs">{fileInfo.name} · {fileInfo.chars.toLocaleString()} belgi o&apos;qildi</p>}

                {preview && (
                    <div className="space-y-3">
                        <p className="text-green-400 font-bold text-sm">✅ {preview.length} ta savol tayyor</p>
                        <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-hide">
                            {preview.map((q, i) => (
                                <div key={q.id} className="glass-blue p-3 rounded-xl">
                                    <p className="text-white font-bold text-sm mb-1">{i + 1}. {q.text}</p>
                                    {q.explanation && <p className="text-white/40 text-xs mb-2">💡 {q.explanation}</p>}
                                    <div className="grid grid-cols-2 gap-1">
                                        {q.options.map((o, oi) => (
                                            <div key={oi} className={`text-xs px-2 py-1 rounded-lg font-semibold ${o.isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
                                                {['🔴', '🔵', '🟡', '🟢'][oi]} {o.text.slice(0, 30)}{o.text.length > 30 ? '…' : ''}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => { onImport(preview); onClose(); }}
                            className="w-full py-4 rounded-2xl font-extrabold text-white text-lg hover:scale-105 transition-all"
                            style={{ background: 'linear-gradient(135deg, #00E676, #009944)', boxShadow: '0 8px 28px rgba(0,230,118,0.35)' }}>
                            ✅ Quizga qo&apos;shish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── AI Text Modal ── */
function AIModal({ onClose, onImport }: { onClose: () => void; onImport: (qs: QuizQuestion[]) => void }) {
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
            if (!res.ok) { setError(data.error || 'Xatolik'); setLoading(false); return; }
            const mapped: QuizQuestion[] = data.questions.map((q: any) => ({
                id: uuidv4(), type: 'multiple' as QuestionType, text: q.text,
                options: q.options.map((o: string, i: number) => ({ text: o, isCorrect: q.correctOptions.includes(i) })),
                timeLimit, explanation: q.explanation || '',
            }));
            setPreview(mapped);
        } catch { setError('Server xatoligi'); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
            <div className="glass w-full max-w-xl rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white">🤖 AI Savol Yaratuvchi</h2>
                        <p className="text-white/40 text-xs">Groq · LLaMA 3.3-70B</p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-3xl">×</button>
                </div>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="Mavzuni kiriting (masalan: Optika, Algebra, Tarix...)"
                    className="input-game" onKeyDown={e => e.key === 'Enter' && generate()} />
                <div className="flex gap-3 flex-wrap">
                    {[3, 5, 8, 10].map(n => (
                        <button key={n} onClick={() => setCount(n)} className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                            style={count === n ? { background: '#0056b3', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{n} ta</button>
                    ))}
                    {[{ c: 'uz', l: '🇺🇿 UZ' }, { c: 'ru', l: '🇷🇺 RU' }, { c: 'en', l: '🇬🇧 EN' }].map(x => (
                        <button key={x.c} onClick={() => setLang(x.c)} className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                            style={lang === x.c ? { background: '#0056b3', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{x.l}</button>
                    ))}
                    {[20, 30, 60].map(t => (
                        <button key={t} onClick={() => setTimeLimit(t)} className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                            style={timeLimit === t ? { background: '#FF1744', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{t}s</button>
                    ))}
                </div>
                {error && <p className="text-red-400 text-sm font-bold bg-red-500/10 rounded-xl py-2 text-center">⚠️ {error}</p>}
                <button onClick={generate} disabled={loading}
                    className="w-full btn-primary justify-center disabled:opacity-50 disabled:transform-none">
                    {loading ? <><span className="animate-spin">🤖</span> Yaratilmoqda...</> : '✨ Yaratish'}
                </button>
                {preview && (
                    <div className="space-y-2">
                        <p className="text-green-400 font-bold text-sm">✅ {preview.length} ta savol</p>
                        <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1.5">
                            {preview.map((q, i) => (
                                <div key={q.id} className="glass-blue p-2.5 rounded-xl">
                                    <p className="text-white text-sm font-bold">{i + 1}. {q.text}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => { onImport(preview); onClose(); }}
                            className="w-full py-3 rounded-2xl font-extrabold text-white hover:scale-105 transition-all"
                            style={{ background: 'linear-gradient(135deg, #00E676, #009944)' }}>
                            ✅ Qo&apos;shish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

type ModalType = 'none' | 'ai' | 'file';

export default function TeacherCreatePage() {
    const router = useRouter();
    const { isPro, plan } = useSubscription();
    const maxQ = isPro ? PLAN_LIMITS.pro.maxQuestions : PLAN_LIMITS.free.maxQuestions;
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([
        { id: uuidv4(), type: 'multiple', text: '', options: MULTI_DEFAULTS(), timeLimit: 20 }
    ]);
    const [active, setActive] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [modal, setModal] = useState<ModalType>('none');

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
        if (questions.length >= maxQ) {
            if (!isPro) setErrors([`Bepul tarif: max ${maxQ} ta savol. Pro versiyaga o'ting!`]);
            return;
        }
        const nq: QuizQuestion = { id: uuidv4(), type: 'multiple', text: '', options: MULTI_DEFAULTS(), timeLimit: 20 };
        setQuestions(p => [...p, nq]);
        setActive(questions.length);
    };

    const delQ = (idx: number) => {
        if (questions.length === 1) return;
        setQuestions(p => p.filter((_, i) => i !== idx));
        setActive(Math.max(0, idx - 1));
    };

    const importQuestions = (qs: QuizQuestion[]) => {
        const empty = questions.length === 1 && !questions[0].text.trim();
        const merged = empty ? qs : [...questions, ...qs];
        setQuestions(merged.slice(0, 50));
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
                timeLimit: q.timeLimit,
                imageUrl: q.imageUrl,
                explanation: q.explanation || '',
            })),
        };
        sessionStorage.setItem('quiz', JSON.stringify(quiz));
        router.push('/teacher/lobby');
    };

    return (
        <div className="bg-host min-h-screen">
            {modal === 'ai' && <AIModal onClose={() => setModal('none')} onImport={importQuestions} />}
            {modal === 'file' && <FileModal onClose={() => setModal('none')} onImport={importQuestions} />}

            {/* Header */}
            <header className="flex items-center gap-3 p-4 border-b border-white/10 flex-wrap">
                <button onClick={() => router.push('/')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
                <span className="text-xl font-black text-white">Zukk<span className="logo-z">oo</span></span>
                {isPro && <CrownBadge />}
                <span className="text-white/30">·</span>
                <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Quiz nomi..."
                    className="input-game flex-1 min-w-48 max-w-xs text-sm"
                    style={{ textAlign: 'left', padding: '10px 16px', borderRadius: '12px' }} />
                <div className="ml-auto flex items-center gap-2">
                    {/* File upload — Pro only */}
                    {isPro ? (
                        <button onClick={() => setModal('file')}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                            style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                            📄 Fayl
                        </button>
                    ) : (
                        <button onClick={() => router.push('/pricing')}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 opacity-60"
                            title="Pro xususiyat"
                            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>
                            📄 Fayl <ProLock />
                        </button>
                    )}
                    {/* AI text — Pro only */}
                    {isPro ? (
                        <button onClick={() => setModal('ai')}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                            style={{ background: 'rgba(0,86,179,0.2)', border: '1px solid rgba(0,86,179,0.4)', color: '#60a5fa' }}>
                            🤖 AI
                        </button>
                    ) : (
                        <button onClick={() => router.push('/pricing')}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 opacity-60"
                            title="Pro xususiyat"
                            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>
                            🤖 AI <ProLock />
                        </button>
                    )}
                    <button onClick={startLobby} className="btn-primary text-sm px-5 py-2.5">🚀 Lobby</button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row">
                {/* Sidebar — scrollable, up to 50 */}
                <aside className="lg:w-64 p-4 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col gap-3">
                    <p className="text-white/40 font-bold text-xs">
                        SAVOLLAR ({questions.length}/{maxQ})
                        {!isPro && <span className="ml-1.5 text-yellow-500">· Bepul: max 10</span>}
                    </p>
                    <div className="space-y-1.5 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                        {questions.map((q, i) => (
                            <div key={q.id} onClick={() => setActive(i)}
                                className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all group"
                                style={{
                                    background: active === i ? 'rgba(0,86,179,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${active === i ? 'rgba(0,86,179,0.5)' : 'transparent'}`
                                }}>
                                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{ background: active === i ? '#0056b3' : 'rgba(255,255,255,0.1)' }}>{i + 1}</span>
                                <span className="flex-1 text-xs font-bold text-white/60 truncate">{q.text || 'Savol...'}</span>
                                <span className="text-xs px-1 py-0.5 rounded font-bold shrink-0"
                                    style={{ background: q.type === 'truefalse' ? 'rgba(0,230,118,0.15)' : 'rgba(0,86,179,0.15)', color: q.type === 'truefalse' ? '#00E676' : '#60a5fa' }}>
                                    {q.type === 'truefalse' ? 'T/F' : 'MC'}
                                </span>
                                {questions.length > 1 && (
                                    <button onClick={e => { e.stopPropagation(); delQ(i); }}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 text-base leading-none transition-opacity shrink-0">×</button>
                                )}
                            </div>
                        ))}
                    </div>
                    {questions.length < maxQ && (
                        <button onClick={addQ}
                            className="w-full p-2.5 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/30 text-xs font-bold transition-all">
                            + Savol qo&apos;shish
                        </button>
                    )}
                    {!isPro && questions.length >= maxQ && (
                        <button onClick={() => router.push('/pricing')}
                            className="w-full p-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>
                            👑 Pro → 50 ta savolga
                        </button>
                    )}
                </aside>

                {/* Editor */}
                <main className="flex-1 p-4 md:p-8 space-y-5">
                    {/* Type toggle */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-white/40 font-bold text-sm">Turi:</span>
                        {([['multiple', "📋 Ko'p tanlov"], ['truefalse', "✅ To'g'ri/Noto'g'ri"]] as [QuestionType, string][]).map(([t, l]) => (
                            <button key={t} onClick={() => setType(t)}
                                className="px-4 py-2 rounded-xl font-bold text-sm transition-all"
                                style={q.type === t ? { background: '#0056b3', color: 'white', boxShadow: '0 4px 16px rgba(0,86,179,0.4)' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* Question text */}
                    <div className="glass p-5 space-y-4">
                        <label className="text-white/40 font-bold text-xs">SAVOL #{active + 1}</label>
                        <textarea value={q.text} onChange={e => upQ({ text: e.target.value })}
                            placeholder="Savolingizni kiriting..."
                            className="w-full bg-transparent text-white text-xl font-bold outline-none resize-none placeholder-white/20" rows={3} />

                        {/* Explanation */}
                        <div>
                            <label className="text-white/40 font-bold text-xs block mb-1.5">💡 IZOH (ixtiyoriy — to'g'ri javobdan keyin ko'rsatiladi)</label>
                            <input value={q.explanation || ''} onChange={e => upQ({ explanation: e.target.value })}
                                placeholder="Masalan: Fotosintez jarayonida xlоrofill yordam beradi..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/60 text-sm outline-none focus:border-blue-500 transition-colors" />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="text-white/40 text-xs font-bold block mb-1">RASM URL</label>
                                <input value={q.imageUrl || ''} onChange={e => upQ({ imageUrl: e.target.value })}
                                    placeholder="https://..." className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/60 text-sm outline-none w-52" />
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-bold block mb-1">VAQT LIMITI</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {TIME_OPTIONS.map(t => (
                                        <button key={t} onClick={() => upQ({ timeLimit: t })}
                                            className="px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all"
                                            style={q.timeLimit === t ? { background: '#FF1744', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                            {t}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {q.imageUrl && <img src={q.imageUrl} alt="" className="h-28 rounded-xl object-cover" />}
                    </div>

                    {/* Options */}
                    <div className={`grid gap-4 ${q.type === 'truefalse' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {q.options.map((opt, i) => (
                            <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl ${OPTION_COLORS[i % 4].cls}`}
                                style={{ outline: opt.isCorrect ? '3px solid white' : 'none', outlineOffset: '3px' }}>
                                <span className="text-2xl shrink-0">{OPTION_COLORS[i % 4].icon}</span>
                                {q.type === 'truefalse' ? (
                                    <span className="flex-1 text-white font-extrabold text-lg">{opt.text}</span>
                                ) : (
                                    <input value={opt.text} onChange={e => setOptText(i, e.target.value)}
                                        placeholder={`${i + 1}-variant...`}
                                        className="flex-1 bg-transparent text-white font-bold text-base outline-none placeholder-white/40" />
                                )}
                                <button onClick={() => toggleCorrect(i)} className="text-2xl shrink-0 hover:scale-110 transition-transform">
                                    {opt.isCorrect ? '✅' : '⬜'}
                                </button>
                            </div>
                        ))}
                    </div>

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
