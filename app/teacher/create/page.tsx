'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface AnswerOption { text: string; isCorrect: boolean; }
interface QuizQuestion { id: string; text: string; options: AnswerOption[]; timeLimit: number; imageUrl?: string; }

const DEFAULT_OPTIONS = (): AnswerOption[] => [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
];

const OPTION_COLORS = [
    { cls: 'btn-red', icon: '🔴', name: 'Qizil' },
    { cls: 'btn-blue', icon: '🔵', name: 'Ko\'k' },
    { cls: 'btn-yellow', icon: '🟡', name: 'Sariq' },
    { cls: 'btn-green', icon: '🟢', name: 'Yashil' },
];
const TIME_OPTIONS = [10, 20, 30, 60];

// ── AI Modal ─────────────────────────────────────────────────────────────────
function AIGenerateModal({ onClose, onImport }: {
    onClose: () => void;
    onImport: (questions: QuizQuestion[]) => void;
}) {
    const [topic, setTopic] = useState('');
    const [count, setCount] = useState(5);
    const [language, setLanguage] = useState('uz');
    const [timeLimit, setTimeLimit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<QuizQuestion[] | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) { setError("Mavzu kiriting"); return; }
        setError('');
        setLoading(true);
        setPreview(null);

        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, count, language }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Xatolik'); setLoading(false); return; }

            const mapped: QuizQuestion[] = data.questions.map((q: any) => ({
                id: uuidv4(),
                text: q.text,
                options: q.options.map((opt: string, i: number) => ({
                    text: opt,
                    isCorrect: q.correctOptions.includes(i),
                })),
                timeLimit,
            }));
            setPreview(mapped);
        } catch {
            setError("Server bilan ulanishda xatolik");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="glass w-full max-w-2xl rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: 'linear-gradient(135deg, #6C63FF, #4834d4)' }}>🤖</div>
                        <div>
                            <h2 className="text-xl font-black text-white">AI Savol Yaratuvchi</h2>
                            <p className="text-white/40 text-xs font-semibold">Groq · LLaMA 3.3-70B</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-2xl transition-colors">×</button>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                    <div>
                        <label className="text-white/60 font-bold text-xs block mb-2">MAVZU / TOPIC</label>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Masalan: Astronomiya, O'zbekiston tarixi, Python dasturlash..."
                            className="input-game text-base"
                            style={{ borderRadius: '14px', padding: '12px 18px' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-white/60 font-bold text-xs block mb-2">SAVOLLAR SONI</label>
                            <div className="flex gap-2 flex-wrap">
                                {[3, 5, 8, 10].map((n) => (
                                    <button key={n} onClick={() => setCount(n)}
                                        className="px-3 py-2 rounded-xl font-bold text-sm transition-all"
                                        style={count === n ? { background: '#6C63FF', color: 'white', boxShadow: '0 4px 16px rgba(108,99,255,0.4)' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-white/60 font-bold text-xs block mb-2">TIL</label>
                            <div className="flex gap-2">
                                {[{ code: 'uz', label: "🇺🇿 UZ" }, { code: 'ru', label: "🇷🇺 RU" }, { code: 'en', label: "🇬🇧 EN" }].map((l) => (
                                    <button key={l.code} onClick={() => setLanguage(l.code)}
                                        className="px-3 py-2 rounded-xl font-bold text-xs transition-all"
                                        style={language === l.code ? { background: '#6C63FF', color: 'white' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-white/60 font-bold text-xs block mb-2">TAYMER</label>
                            <div className="flex gap-2 flex-wrap">
                                {TIME_OPTIONS.map((t) => (
                                    <button key={t} onClick={() => setTimeLimit(t)}
                                        className="px-3 py-2 rounded-xl font-bold text-sm transition-all"
                                        style={timeLimit === t ? { background: '#FF6B6B', color: 'white' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                        {t}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-red-400 font-bold text-sm text-center bg-red-500/10 rounded-xl py-2 px-4">⚠️ {error}</div>
                )}

                {/* Generate button */}
                <button onClick={handleGenerate} disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none">
                    {loading ? (
                        <>
                            <span className="animate-spin text-xl">🤖</span>
                            AI savollar tayyorlamoqda...
                        </>
                    ) : '✨ AI bilan Savollar Yaratish'}
                </button>

                {/* Preview */}
                {preview && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-green-400 font-bold text-sm">✅ {preview.length} ta savol tayyor!</p>
                            <button onClick={handleGenerate} className="text-white/40 hover:text-white/70 text-xs font-bold transition-colors">
                                🔄 Qayta yaratish
                            </button>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                            {preview.map((q, i) => (
                                <div key={q.id} className="glass p-4 rounded-2xl space-y-2">
                                    <p className="text-white font-bold text-sm">{i + 1}. {q.text}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} className={`text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-2 ${opt.isCorrect ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-white/60'}`}>
                                                <span>{['🔴', '🔵', '🟡', '🟢'][oi]}</span>
                                                <span className="truncate">{opt.text}</span>
                                                {opt.isCorrect && <span className="ml-auto">✅</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => { onImport(preview); onClose(); }}
                            className="w-full py-4 rounded-2xl font-extrabold text-white text-lg transition-all"
                            style={{ background: 'linear-gradient(135deg, #6BCB77, #11998e)', boxShadow: '0 8px 32px rgba(107,203,119,0.4)' }}>
                            ✅ Barcha savollarni Quiz ga qo&apos;shish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Quiz Builder ─────────────────────────────────────────────────────────
export default function TeacherCreatePage() {
    const router = useRouter();
    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([{
        id: uuidv4(), text: '', options: DEFAULT_OPTIONS(), timeLimit: 20,
    }]);
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [showAI, setShowAI] = useState(false);

    const currentQ = questions[activeQuestion];

    const updateQuestion = useCallback((field: Partial<QuizQuestion>) => {
        setQuestions((prev) => prev.map((q, i) => i === activeQuestion ? { ...q, ...field } : q));
    }, [activeQuestion]);

    const updateOption = useCallback((optIdx: number, value: string) => {
        setQuestions((prev) => prev.map((q, i) => {
            if (i !== activeQuestion) return q;
            const opts = q.options.map((o, oi) => oi === optIdx ? { ...o, text: value } : o);
            return { ...q, options: opts };
        }));
    }, [activeQuestion]);

    const toggleCorrect = useCallback((optIdx: number) => {
        setQuestions((prev) => prev.map((q, i) => {
            if (i !== activeQuestion) return q;
            const opts = q.options.map((o, oi) => oi === optIdx ? { ...o, isCorrect: !o.isCorrect } : o);
            return { ...q, options: opts };
        }));
    }, [activeQuestion]);

    const addQuestion = () => {
        const newQ: QuizQuestion = { id: uuidv4(), text: '', options: DEFAULT_OPTIONS(), timeLimit: 20 };
        setQuestions((prev) => [...prev, newQ]);
        setActiveQuestion(questions.length);
    };

    const deleteQuestion = (idx: number) => {
        if (questions.length === 1) return;
        setQuestions((prev) => prev.filter((_, i) => i !== idx));
        setActiveQuestion(Math.max(0, idx - 1));
    };

    // Import AI questions (append or replace)
    const handleAIImport = (aiQuestions: QuizQuestion[]) => {
        const hasEmpty = questions.length === 1 && !questions[0].text.trim();
        if (hasEmpty) {
            setQuestions(aiQuestions);
        } else {
            setQuestions((prev) => [...prev, ...aiQuestions]);
        }
        setActiveQuestion(0);
    };

    const validate = (): boolean => {
        const errs: string[] = [];
        if (!quizTitle.trim()) errs.push('Quiz nomi kerak');
        questions.forEach((q, i) => {
            if (!q.text.trim()) errs.push(`${i + 1}-savol matni bo'sh`);
            if (q.options.filter((o) => o.text.trim()).length < 2) errs.push(`${i + 1}-savolda kamida 2 ta variant kerak`);
            if (!q.options.some((o) => o.isCorrect)) errs.push(`${i + 1}-savolda to'g'ri javob belgilanmagan`);
        });
        setErrors(errs);
        return errs.length === 0;
    };

    const handleStartLobby = () => {
        if (!validate()) return;
        const quizData = {
            title: quizTitle,
            questions: questions.map((q) => ({
                id: q.id,
                text: q.text,
                options: q.options.map((o) => o.text),
                correctOptions: q.options.map((o, i) => o.isCorrect ? i : -1).filter((i) => i !== -1),
                timeLimit: q.timeLimit,
                imageUrl: q.imageUrl,
            })),
        };
        sessionStorage.setItem('quiz', JSON.stringify(quizData));
        router.push('/teacher/lobby');
    };

    return (
        <div className="bg-teacher min-h-screen">
            {showAI && <AIGenerateModal onClose={() => setShowAI(false)} onImport={handleAIImport} />}

            {/* Header */}
            <header className="p-4 md:p-6 flex items-center justify-between border-b border-white/10 gap-3">
                <button onClick={() => router.push('/')} className="text-white/60 hover:text-white transition-colors text-2xl flex-shrink-0">←</button>
                <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Quiz nomini kiriting..."
                    className="input-game max-w-xs md:max-w-sm text-lg flex-1"
                    style={{ borderRadius: '12px', padding: '10px 20px' }} />
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* AI Button */}
                    <button onClick={() => setShowAI(true)}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #6C63FF, #4834d4)', boxShadow: '0 4px 20px rgba(108,99,255,0.5)' }}>
                        🤖 AI Savol
                    </button>
                    <button onClick={handleStartLobby} className="btn-primary text-base px-6 py-3">🚀 Lobby</button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row h-full">
                {/* Sidebar */}
                <aside className="lg:w-72 p-4 border-b lg:border-b-0 lg:border-r border-white/10 space-y-2">
                    <h3 className="text-white/60 font-bold text-sm mb-3">SAVOLLAR ({questions.length})</h3>
                    <div className="space-y-2 max-h-60 lg:max-h-screen overflow-y-auto scrollbar-hide">
                        {questions.map((q, i) => (
                            <div key={q.id} onClick={() => setActiveQuestion(i)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group glass`}
                                style={{ border: `2px solid ${activeQuestion === i ? '#6C63FF' : 'transparent'}`, opacity: activeQuestion === i ? 1 : 0.6 }}>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ background: activeQuestion === i ? '#6C63FF' : 'rgba(255,255,255,0.1)' }}>{i + 1}</span>
                                <span className="flex-1 text-sm text-white/80 font-semibold truncate">{q.text || 'Savol matni...'}</span>
                                {questions.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all text-lg">×</button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button onClick={addQuestion}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm font-bold">
                        + Savol qo&apos;shish
                    </button>
                    <button onClick={() => setShowAI(true)}
                        className="w-full p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
                        style={{ background: 'rgba(108,99,255,0.2)', border: '2px solid rgba(108,99,255,0.4)', color: '#a78bfa' }}>
                        🤖 AI bilan qo&apos;shish
                    </button>
                </aside>

                {/* Main Editor */}
                <main className="flex-1 p-4 md:p-8 space-y-6">
                    <div className="glass p-6 space-y-3">
                        <label className="text-white/60 font-bold text-sm">SAVOL #{activeQuestion + 1}</label>
                        <textarea value={currentQ.text} onChange={(e) => updateQuestion({ text: e.target.value })}
                            placeholder="Savolingizni shu yerga kiriting..."
                            className="w-full bg-transparent text-white text-xl font-bold outline-none resize-none placeholder-white/30" rows={3} />
                        <div className="flex items-center gap-4 flex-wrap">
                            <div>
                                <label className="text-white/50 text-xs font-bold block mb-1">RASM URL (ixtiyoriy)</label>
                                <input value={currentQ.imageUrl || ''} onChange={(e) => updateQuestion({ imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white/80 text-sm outline-none"
                                    style={{ width: '280px' }} />
                            </div>
                            <div>
                                <label className="text-white/50 text-xs font-bold block mb-1">VAQT</label>
                                <div className="flex gap-2">
                                    {TIME_OPTIONS.map((t) => (
                                        <button key={t} onClick={() => updateQuestion({ timeLimit: t })}
                                            className="px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200"
                                            style={currentQ.timeLimit === t ? { background: '#6C63FF', color: 'white', boxShadow: '0 4px 16px rgba(108,99,255,0.4)' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                                            {t}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {currentQ.imageUrl && (
                            <img src={currentQ.imageUrl} alt="Question" className="w-40 h-28 object-cover rounded-xl" />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQ.options.map((opt, i) => (
                            <div key={i} className={`btn-answer ${OPTION_COLORS[i].cls} relative p-4 rounded-2xl`}
                                style={{ cursor: 'default', outline: opt.isCorrect ? '3px solid white' : 'none', outlineOffset: '3px' }}>
                                <span className="text-2xl">{OPTION_COLORS[i].icon}</span>
                                <input value={opt.text} onChange={(e) => updateOption(i, e.target.value)}
                                    placeholder={`${OPTION_COLORS[i].name} variant...`}
                                    className="flex-1 bg-transparent text-white font-bold text-lg outline-none placeholder-white/50 w-full" />
                                <button onClick={() => toggleCorrect(i)} className="ml-2 text-2xl transition-transform hover:scale-110"
                                    title={opt.isCorrect ? "To'g'ri javob" : "Noto'g'ri javob"}>
                                    {opt.isCorrect ? '✅' : '⬜'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-white/40 text-sm font-semibold text-center">
                        ✅ ni bosib to&apos;g&apos;ri javoblarni belgilang (bir nechta bo&apos;lishi mumkin)
                    </p>

                    {errors.length > 0 && (
                        <div className="glass p-4 rounded-2xl space-y-1" style={{ border: '1px solid rgba(239,68,68,0.5)' }}>
                            {errors.map((e, i) => <p key={i} className="text-red-400 font-bold text-sm">⚠️ {e}</p>)}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
