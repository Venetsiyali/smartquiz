'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface AnswerOption {
    text: string;
    isCorrect: boolean;
}

interface QuizQuestion {
    id: string;
    text: string;
    options: AnswerOption[];
    timeLimit: number;
    imageUrl?: string;
}

const DEFAULT_OPTIONS: AnswerOption[] = [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
];

const OPTION_COLORS = [
    { bg: 'btn-red', label: '🔴', name: 'Qizil' },
    { bg: 'btn-blue', label: '🔵', name: 'Ko\'k' },
    { bg: 'btn-yellow', label: '🟡', name: 'Sariq' },
    { bg: 'btn-green', label: '🟢', name: 'Yashil' },
];

const TIME_OPTIONS = [10, 20, 30, 60];

export default function TeacherCreatePage() {
    const router = useRouter();
    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([
        {
            id: uuidv4(),
            text: '',
            options: DEFAULT_OPTIONS.map((o) => ({ ...o })),
            timeLimit: 20,
        },
    ]);
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);

    const currentQ = questions[activeQuestion];

    const updateQuestion = useCallback((field: Partial<QuizQuestion>) => {
        setQuestions((prev) =>
            prev.map((q, i) => (i === activeQuestion ? { ...q, ...field } : q))
        );
    }, [activeQuestion]);

    const updateOption = useCallback((optIdx: number, value: string) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== activeQuestion) return q;
                const opts = q.options.map((o, oi) =>
                    oi === optIdx ? { ...o, text: value } : o
                );
                return { ...q, options: opts };
            })
        );
    }, [activeQuestion]);

    const toggleCorrect = useCallback((optIdx: number) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== activeQuestion) return q;
                const opts = q.options.map((o, oi) =>
                    oi === optIdx ? { ...o, isCorrect: !o.isCorrect } : o
                );
                return { ...q, options: opts };
            })
        );
    }, [activeQuestion]);

    const addQuestion = () => {
        const newQ: QuizQuestion = {
            id: uuidv4(),
            text: '',
            options: DEFAULT_OPTIONS.map((o) => ({ ...o })),
            timeLimit: 20,
        };
        setQuestions((prev) => [...prev, newQ]);
        setActiveQuestion(questions.length);
    };

    const deleteQuestion = (idx: number) => {
        if (questions.length === 1) return;
        setQuestions((prev) => prev.filter((_, i) => i !== idx));
        setActiveQuestion(Math.max(0, idx - 1));
    };

    const validate = (): boolean => {
        const errs: string[] = [];
        if (!quizTitle.trim()) errs.push('Quiz nomi kerak');
        questions.forEach((q, i) => {
            if (!q.text.trim()) errs.push(`${i + 1}-savol matni bo'sh`);
            if (q.options.filter((o) => o.text.trim()).length < 2)
                errs.push(`${i + 1}-savolda kamida 2 ta variant kerak`);
            if (!q.options.some((o) => o.isCorrect))
                errs.push(`${i + 1}-savolda to'g'ri javob belgilanmagan`);
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
                correctOptions: q.options
                    .map((o, i) => (o.isCorrect ? i : -1))
                    .filter((i) => i !== -1),
                timeLimit: q.timeLimit,
                imageUrl: q.imageUrl,
            })),
        };
        sessionStorage.setItem('quiz', JSON.stringify(quizData));
        router.push('/teacher/lobby');
    };

    return (
        <div className="bg-teacher min-h-screen">
            {/* Header */}
            <header className="p-4 md:p-6 flex items-center justify-between border-b border-white/10">
                <button onClick={() => router.push('/')} className="text-white/60 hover:text-white transition-colors text-2xl">←</button>
                <input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Quiz nomini kiriting..."
                    className="input-game max-w-xs md:max-w-sm text-lg"
                    style={{ borderRadius: '12px', padding: '10px 20px' }}
                />
                <button
                    onClick={handleStartLobby}
                    className="btn-primary text-base px-6 py-3"
                >
                    🚀 Lobby
                </button>
            </header>

            <div className="flex flex-col lg:flex-row h-full">
                {/* Sidebar: Question list */}
                <aside className="lg:w-72 p-4 border-b lg:border-b-0 lg:border-r border-white/10 space-y-2">
                    <h3 className="text-white/60 font-bold text-sm mb-3">SAVOLLAR ({questions.length})</h3>
                    <div className="space-y-2 max-h-60 lg:max-h-screen overflow-y-auto scrollbar-hide">
                        {questions.map((q, i) => (
                            <div
                                key={q.id}
                                onClick={() => setActiveQuestion(i)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${activeQuestion === i
                                        ? 'glass border-purple-500/50'
                                        : 'glass opacity-60 hover:opacity-100'
                                    }`}
                                style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: activeQuestion === i ? '#6C63FF' : 'transparent' }}
                            >
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ background: activeQuestion === i ? '#6C63FF' : 'rgba(255,255,255,0.1)' }}>
                                    {i + 1}
                                </span>
                                <span className="flex-1 text-sm text-white/80 font-semibold truncate">
                                    {q.text || 'Savol matni...'}
                                </span>
                                {questions.length > 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all text-lg"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addQuestion}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm font-bold"
                    >
                        + Savol qo&apos;shish
                    </button>
                </aside>

                {/* Main Editor */}
                <main className="flex-1 p-4 md:p-8 space-y-6">
                    {/* Question text */}
                    <div className="glass p-6 space-y-3">
                        <label className="text-white/60 font-bold text-sm">SAVOL #{activeQuestion + 1}</label>
                        <textarea
                            value={currentQ.text}
                            onChange={(e) => updateQuestion({ text: e.target.value })}
                            placeholder="Savolingizni shu yerga kiriting..."
                            className="w-full bg-transparent text-white text-xl font-bold outline-none resize-none placeholder-white/30"
                            rows={3}
                        />
                        <div className="flex items-center gap-4 flex-wrap">
                            <div>
                                <label className="text-white/50 text-xs font-bold block mb-1">RASM URL (ixtiyoriy)</label>
                                <input
                                    value={currentQ.imageUrl || ''}
                                    onChange={(e) => updateQuestion({ imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white/80 text-sm outline-none"
                                    style={{ width: '280px' }}
                                />
                            </div>
                            <div>
                                <label className="text-white/50 text-xs font-bold block mb-1">VAQT</label>
                                <div className="flex gap-2">
                                    {TIME_OPTIONS.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => updateQuestion({ timeLimit: t })}
                                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${currentQ.timeLimit === t
                                                    ? 'text-white'
                                                    : 'text-white/50 bg-white/10 hover:text-white'
                                                }`}
                                            style={currentQ.timeLimit === t ? { background: '#6C63FF', boxShadow: '0 4px 16px rgba(108,99,255,0.4)' } : {}}
                                        >
                                            {t}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {currentQ.imageUrl && (
                            <img src={currentQ.imageUrl} alt="Question" className="w-40 h-28 object-cover rounded-xl" onError={() => { }} />
                        )}
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQ.options.map((opt, i) => (
                            <div
                                key={i}
                                className={`btn-answer ${['btn-red', 'btn-blue', 'btn-yellow', 'btn-green'][i]
                                    } relative p-4 rounded-2xl`}
                                style={{
                                    cursor: 'default',
                                    outline: opt.isCorrect ? '3px solid white' : 'none',
                                    outlineOffset: '3px',
                                }}
                            >
                                <span className="text-2xl">{OPTION_COLORS[i].label}</span>
                                <input
                                    value={opt.text}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                    placeholder={`${OPTION_COLORS[i].name} variant...`}
                                    className="flex-1 bg-transparent text-white font-bold text-lg outline-none placeholder-white/50 w-full"
                                />
                                <button
                                    onClick={() => toggleCorrect(i)}
                                    className="ml-2 text-2xl transition-transform hover:scale-110"
                                    title={opt.isCorrect ? "To'g'ri javob" : "Noto'g'ri javob"}
                                >
                                    {opt.isCorrect ? '✅' : '⬜'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-white/40 text-sm font-semibold text-center">
                        ✅ ni bosib to&apos;g'ri javoblarni belgilang (bir nechta bo&apos;lishi mumkin)
                    </p>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="glass border-red-500/50 p-4 rounded-2xl space-y-1" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.5)' }}>
                            {errors.map((e, i) => (
                                <p key={i} className="text-red-400 font-bold text-sm">⚠️ {e}</p>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
