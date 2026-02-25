'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useSubscription, ProLock, CrownBadge, PLAN_LIMITS } from '@/lib/subscriptionContext';

type QuestionType = 'multiple' | 'truefalse' | 'order' | 'match' | 'blitz' | 'anagram';

interface AnswerOption { text: string; isCorrect: boolean; }
interface OrderItem { text: string; imageUrl?: string; }
interface MatchPair { term: string; definition: string; termImage?: string; definitionImage?: string; }
interface QuizQuestion {
    id: string; type: QuestionType; text: string;
    options: AnswerOption[]; orderItems?: OrderItem[]; matchPairs?: MatchPair[];
    timeLimit: number;
    imageUrl?: string; explanation?: string;
    anagramWord?: string; // the word to guess (stored separate from clue)
}


const MULTI_DEFAULTS = (): AnswerOption[] => [
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
];
const TF_DEFAULTS = (): AnswerOption[] => [
    { text: "To'g'ri ✅", isCorrect: false },
    { text: "Noto'g'ri ❌", isCorrect: false },
];
const ORDER_DEFAULTS = (): OrderItem[] => [
    { text: '' }, { text: '' }, { text: '' }, { text: '' },
];
const MATCH_DEFAULTS = (): MatchPair[] => [
    { term: '', definition: '' }, { term: '', definition: '' },
    { term: '', definition: '' }, { term: '', definition: '' },
];
const TIME_OPTIONS = [10, 20, 30, 60, 90, 120];
const BLITZ_TIME_OPTIONS = [3, 4, 5]; // Blitz only — ultra short
const BLITZ_DEFAULTS = (): AnswerOption[] => [
    { text: "TO'G'RI", isCorrect: false },
    { text: "NOTO'G'RI", isCorrect: false },
];

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
    return (
        <Suspense fallback={<div className="min-h-screen bg-host flex items-center justify-center"><p className="text-white/50 text-xl font-bold">Yuklanmoqda...</p></div>}>
            <TeacherCreateInner />
        </Suspense>
    );
}

function TeacherCreateInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const lockedModeQuery = searchParams.get('mode');

    const { isPro, plan } = useSubscription();
    const maxQ = isPro ? PLAN_LIMITS.pro.maxQuestions : PLAN_LIMITS.free.maxQuestions;
    const [title, setTitle] = useState('');

    const [lockedMode, setLockedMode] = useState<string | null>(lockedModeQuery);

    const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
        let initialType: QuestionType = 'multiple';
        if (lockedModeQuery === 'order' || lockedModeQuery === 'match' || lockedModeQuery === 'blitz' || lockedModeQuery === 'anagram') {
            initialType = lockedModeQuery as QuestionType;
        }

        let opts = MULTI_DEFAULTS();
        let ord = undefined;
        let mtch = undefined;
        if (initialType === 'order') ord = ORDER_DEFAULTS();
        if (initialType === 'match') mtch = MATCH_DEFAULTS();
        if (initialType === 'blitz') opts = BLITZ_DEFAULTS();

        return [{
            id: uuidv4(), type: initialType, text: '', options: opts, orderItems: ord, matchPairs: mtch,
            timeLimit: initialType === 'blitz' ? 5 : (initialType === 'anagram' ? 30 : 20)
        }];
    });

    const [active, setActive] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [modal, setModal] = useState<ModalType>('none');

    // Team mode
    const [teamMode, setTeamMode] = useState(lockedModeQuery === 'team');
    const [teamCount, setTeamCount] = useState(3);
    const [teamNames, setTeamNames] = useState<string[]>(['', '', '', '', '', '']);

    // Teacher name for dashboard greeting
    const [teacherName, setTeacherName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('zk_teacher_name') || '';
        }
        return '';
    });

    useEffect(() => {
        const saved = localStorage.getItem('zk_teacher_name') || '';
        setTeacherName(saved);
    }, []);

    const saveTeacherName = (name: string) => {
        setTeacherName(name);
        if (name.trim()) localStorage.setItem('zk_teacher_name', name.trim());
    };

    const q = questions[active];

    const upQ = useCallback((patch: Partial<QuizQuestion>) => {
        setQuestions(prev => prev.map((x, i) => i === active ? { ...x, ...patch } : x));
    }, [active]);

    const setType = (type: QuestionType) => {
        if (type === 'order') {
            upQ({ type, orderItems: ORDER_DEFAULTS(), options: MULTI_DEFAULTS(), matchPairs: undefined });
        } else if (type === 'match') {
            upQ({ type, matchPairs: MATCH_DEFAULTS(), options: MULTI_DEFAULTS(), orderItems: undefined });
        } else if (type === 'blitz') {
            upQ({ type, options: BLITZ_DEFAULTS(), orderItems: undefined, matchPairs: undefined, timeLimit: 5 });
        } else if (type === 'anagram') {
            upQ({ type, options: MULTI_DEFAULTS(), orderItems: undefined, matchPairs: undefined, timeLimit: 30, anagramWord: '' });
        } else {
            upQ({ type, options: type === 'truefalse' ? TF_DEFAULTS() : MULTI_DEFAULTS(), orderItems: undefined, matchPairs: undefined });
        }
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
        let initialType: QuestionType = 'multiple';
        if (lockedMode === 'order' || lockedMode === 'match' || lockedMode === 'blitz' || lockedMode === 'anagram') {
            initialType = lockedMode as QuestionType;
        }

        let opts = MULTI_DEFAULTS();
        let ord = undefined;
        let mtch = undefined;
        if (initialType === 'order') ord = ORDER_DEFAULTS();
        if (initialType === 'match') mtch = MATCH_DEFAULTS();
        if (initialType === 'blitz') opts = BLITZ_DEFAULTS();

        const nq: QuizQuestion = {
            id: uuidv4(), type: initialType, text: '', options: opts, orderItems: ord, matchPairs: mtch,
            timeLimit: initialType === 'blitz' ? 5 : (initialType === 'anagram' ? 30 : 20)
        };
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
            if (q.type === 'order') {
                const items = q.orderItems || [];
                if (items.filter(it => it.text.trim()).length < 2) errs.push(`${i + 1}-savol: kamida 2 ta element`);
            } else if (q.type === 'match') {
                const pairs = q.matchPairs || [];
                if (pairs.filter(p => p.term.trim() && p.definition.trim()).length < 2)
                    errs.push(`${i + 1}-savol: kamida 2 ta juft kerak`);
            } else if (q.type === 'blitz') {
                if (!q.options.some(o => o.isCorrect))
                    errs.push(`${i + 1}-savol: To'g'ri yoki Noto'g'rini belgilang`);
            } else if (q.type === 'anagram') {
                if (!q.anagramWord || q.anagramWord.trim().length < 2)
                    errs.push(`${i + 1}-savol: Yashirin so'z kamida 2 ta harf bo'lishi kerak`);
                if (!q.text.trim()) errs.push(`${i + 1}-savol: Maslahat matni kerak`);
            } else {

                if (!q.options.some(o => o.isCorrect)) errs.push(`${i + 1}-savolda to'g'ri javob yo'q`);
                if (q.type === 'multiple' && q.options.filter(o => o.text.trim()).length < 2)
                    errs.push(`${i + 1}-savolda kamida 2 variant kerak`);
            }
        });
        setErrors(errs);
        return errs.length === 0;
    };

    const startLobby = async () => {
        if (!validate()) return;
        const quiz = {
            title,
            teamMode,
            teamCount: teamMode ? teamCount : undefined,
            questions: questions.map(q => {
                if (q.type === 'order') {
                    const items = (q.orderItems || []).filter(it => it.text.trim());
                    return {
                        id: q.id, type: 'order', text: q.text,
                        options: items.map(it => it.text),
                        optionImages: items.some(it => it.imageUrl) ? items.map(it => it.imageUrl || '') : undefined,
                        correctOptions: items.map((_, idx) => idx),
                        timeLimit: q.timeLimit, imageUrl: q.imageUrl, explanation: q.explanation || '',
                    };
                }
                if (q.type === 'match') {
                    const pairs = (q.matchPairs || []).filter(p => p.term.trim() && p.definition.trim());
                    return {
                        id: q.id, type: 'match', text: q.text,
                        options: [], correctOptions: [],
                        pairs: pairs.map(p => ({
                            term: p.term,
                            definition: p.definition,
                            termImage: p.termImage || undefined,
                            definitionImage: p.definitionImage || undefined,
                        })),
                        timeLimit: q.timeLimit, imageUrl: q.imageUrl, explanation: q.explanation || '',
                    };
                }
                if (q.type === 'blitz') {
                    return {
                        id: q.id, type: 'blitz', text: q.text,
                        options: ["TO'G'RI", "NOTO'G'RI"],
                        correctOptions: q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1),
                        timeLimit: q.timeLimit, imageUrl: q.imageUrl, explanation: q.explanation || '',
                    };
                }
                if (q.type === 'anagram') {
                    return {
                        id: q.id, type: 'anagram',
                        text: q.text, // clue sentence
                        options: [(q.anagramWord || '').toUpperCase().trim()], // word to find
                        correctOptions: [],
                        timeLimit: q.timeLimit, imageUrl: q.imageUrl, explanation: q.explanation || '',
                    };
                }

                return {
                    id: q.id, type: q.type, text: q.text,
                    options: q.options.map(o => o.text),
                    correctOptions: q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1),
                    timeLimit: q.timeLimit, imageUrl: q.imageUrl, explanation: q.explanation || '',
                };
            }),
        };
        sessionStorage.setItem('quiz', JSON.stringify(quiz));

        try {
            const res = await fetch('/api/game/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quiz),
            });
            const data = await res.json();
            if (!res.ok) { setErrors([data.error || "Xatolik"]); return; }
            const pin = data.pin;
            sessionStorage.setItem('gamePin', pin);

            // If team mode: also set it up on the server
            if (teamMode) {
                await fetch('/api/game/team-setup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pin,
                        teamCount,
                        teamNames: teamNames.slice(0, teamCount).filter(n => n.trim()),
                    }),
                });
            }

            router.push('/teacher/lobby');
        } catch (e) {
            console.error(e);
            setErrors(["Server bilan bog'lanishda xatolik"]);
        }
    };

    return (
        <div className="bg-host min-h-screen">
            {modal === 'ai' && <AIModal onClose={() => setModal('none')} onImport={importQuestions} />}
            {modal === 'file' && <FileModal onClose={() => setModal('none')} onImport={importQuestions} />}

            {/* Header */}
            <header className="flex items-center gap-3 p-4 border-b border-white/10 flex-wrap">
                <button onClick={() => router.push('/')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
                <span className="text-xl font-black text-white">
                    {lockedMode === 'classic' ? 'Zukkoo'
                        : lockedMode === 'order' ? 'Mantiqiy Zanjir'
                            : lockedMode === 'match' ? 'Terminlar Jangi'
                                : lockedMode === 'blitz' ? 'Bliz-Sohat'
                                    : lockedMode === 'anagram' ? 'Yashirin Kod'
                                        : lockedMode === 'team' ? 'Jamoaviy Qutqaruv'
                                            : <><span className="text-xl font-black text-white">Zukk<span className="logo-z">oo</span></span></>}
                </span>
                {isPro && <CrownBadge />}
                <span className="text-white/30">·</span>
                <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Quiz nomi..."
                    className="input-game flex-1 min-w-48 max-w-xs text-sm"
                    style={{ textAlign: 'left', padding: '10px 16px', borderRadius: '12px' }} />
                <input value={teacherName} onChange={e => saveTeacherName(e.target.value)}
                    placeholder="Ismingiz..."
                    className="input-game min-w-28 max-w-[140px] text-sm"
                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '12px', display: isPro ? 'block' : 'none' }} />
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => router.push('/muallif')}
                        className="hidden md:flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/10 mr-2">
                        👤 Muallif
                    </button>
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
                                    style={{
                                        background: q.type === 'truefalse' ? 'rgba(0,230,118,0.15)' : q.type === 'order' ? 'rgba(255,215,0,0.15)' : q.type === 'match' ? 'rgba(167,139,250,0.15)' : q.type === 'blitz' ? 'rgba(239,68,68,0.15)' : q.type === 'anagram' ? 'rgba(99,102,241,0.15)' : 'rgba(0,86,179,0.15)',
                                        color: q.type === 'truefalse' ? '#00E676' : q.type === 'order' ? '#FFD700' : q.type === 'match' ? '#a78bfa' : q.type === 'blitz' ? '#f87171' : q.type === 'anagram' ? '#818cf8' : '#60a5fa'
                                    }}>
                                    {q.type === 'truefalse' ? 'T/F' : q.type === 'order' ? 'ZN' : q.type === 'match' ? 'MG' : q.type === 'blitz' ? '⚡BS' : q.type === 'anagram' ? '🔐ANG' : 'MC'}
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

                    {/* ── Jamoaviy Qutqaruv Panel ── */}
                    {lockedMode === 'team' || lockedMode === null ? (
                        <div className="mt-4 space-y-3">
                            <button
                                onClick={() => setTeamMode(t => !t)}
                                disabled={lockedMode === 'team'}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-2xl font-bold text-sm transition-all"
                                style={{
                                    background: teamMode ? 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))' : 'rgba(255,255,255,0.05)',
                                    border: teamMode ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                    color: teamMode ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                    opacity: lockedMode === 'team' ? 1 : undefined,
                                    cursor: lockedMode === 'team' ? 'default' : 'pointer',
                                }}>
                                <span>🏁 Jamoaviy Qutqaruv</span>
                                <span className="text-lg">{teamMode ? '✅' : '⬜'}</span>
                            </button>

                            {teamMode && (
                                <div className="space-y-3 px-1">
                                    <div>
                                        <p className="text-white/40 font-bold text-xs mb-1.5">JAMOA SONI</p>
                                        <div className="flex gap-2">
                                            {[2, 3, 4, 5, 6].map(n => (
                                                <button key={n} onClick={() => setTeamCount(n)}
                                                    className="flex-1 py-2 rounded-xl font-black text-sm transition-all"
                                                    style={teamCount === n
                                                        ? { background: 'linear-gradient(135deg,#3730a3,#6366f1)', color: 'white' }
                                                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pro: custom team names */}
                                    {isPro ? (
                                        <div className="space-y-1.5">
                                            <p className="text-white/40 font-bold text-xs">JAMOA NOMLARI (ixtiyoriy)</p>
                                            {Array.from({ length: teamCount }, (_, i) => (
                                                <input key={i}
                                                    value={teamNames[i] || ''}
                                                    onChange={e => {
                                                        const next = [...teamNames];
                                                        next[i] = e.target.value;
                                                        setTeamNames(next);
                                                    }}
                                                    placeholder={['Koderlar', 'Hakerlar', 'Analitiklar', 'Dizaynerlar', 'Menejerlar', 'Tadqiqotchilar'][i]}
                                                    className="w-full glass px-3 py-2 rounded-xl font-bold text-sm outline-none text-white/80"
                                                    style={{ border: '1px solid rgba(99,102,241,0.3)' }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <button onClick={() => router.push('/pricing')}
                                            className="w-full py-2 rounded-xl text-xs font-bold text-center transition-all hover:scale-105"
                                            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700' }}>
                                            👑 Pro → Jamoa nomlarini o&apos;zgartirish
                                        </button>
                                    )}

                                    <div className="glass p-2.5 rounded-xl" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
                                        <p className="text-white/40 text-xs font-bold">
                                            🏁 Talabalar tasodifiy jamoalarga bo&apos;linadi.<br />
                                            ❤️ Xato = jamoa joni −10%<br />
                                            🔥 Butun jamoa to&apos;g'ri → Combo +100 ball
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </aside>

                {/* Editor */}
                <main className="flex-1 p-4 md:p-8 space-y-5">
                    {/* Type toggle */}
                    {(lockedMode === 'classic' || lockedMode === 'team' || lockedMode === null) && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-white/40 font-bold text-sm">Savol formati:</span>
                            {([
                                ['multiple', "📋 Ko'p tanlov"],
                                ['truefalse', "✅ To'g'ri/Noto'g'ri"],
                                ['order', "🔗 Mantiqiy Zanjir"],
                                ['match', "💎 Terminlar Jangi"],
                                ['blitz', "⚡ Bliz-Sohat"],
                                ['anagram', "🔐 Yashirin Kod"],
                            ] as [QuestionType, string][])
                                .filter(([t]) => {
                                    if (lockedMode === 'classic') return t === 'multiple' || t === 'truefalse';
                                    return true;
                                })
                                .map(([t, l]) => (
                                    <button key={t} onClick={() => setType(t)}
                                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all"
                                        style={q.type === t
                                            ? { background: t === 'order' ? 'linear-gradient(135deg,#B8860B,#FFD700)' : t === 'match' ? 'linear-gradient(135deg,#6d28d9,#a78bfa)' : t === 'blitz' ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : t === 'anagram' ? 'linear-gradient(135deg,#3730a3,#6366f1)' : '#0056b3', color: 'white', boxShadow: '0 4px 16px rgba(0,86,179,0.4)' }
                                            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                                        {l}
                                    </button>
                                ))}
                        </div>
                    )}

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
                                    {(q.type === 'blitz' ? BLITZ_TIME_OPTIONS : TIME_OPTIONS).map(t => (
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

                    {/* Options — MCQ / TrueFalse only */}
                    {(q.type === 'multiple' || q.type === 'truefalse') && (
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
                    )}

                    {/* Order editor — Mantiqiy Zanjir */}
                    {q.type === 'order' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <p className="text-white/40 font-bold text-xs tracking-widest">TO&apos;G&apos;RI TARTIB (pastdan yuqoriga emas, tartib bo&apos;yicha kiriting)</p>
                                <span className="text-yellow-400 text-xs font-black">🔗</span>
                            </div>
                            {(q.orderItems || ORDER_DEFAULTS()).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                                        style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
                                        {idx + 1}
                                    </div>
                                    <input
                                        value={item.text}
                                        onChange={e => {
                                            const items = [...(q.orderItems || ORDER_DEFAULTS())];
                                            items[idx] = { ...items[idx], text: e.target.value };
                                            upQ({ orderItems: items });
                                        }}
                                        placeholder={`${idx + 1}-qadam yoki element...`}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-yellow-500 transition-colors"
                                    />
                                    {/* Pro: image URL per item */}
                                    {isPro && (
                                        <input
                                            value={item.imageUrl || ''}
                                            onChange={e => {
                                                const items = [...(q.orderItems || ORDER_DEFAULTS())];
                                                items[idx] = { ...items[idx], imageUrl: e.target.value };
                                                upQ({ orderItems: items });
                                            }}
                                            placeholder="Rasm URL..."
                                            className="w-32 bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-white/50 text-xs outline-none focus:border-yellow-500 transition-colors"
                                        />
                                    )}
                                    {!isPro && (
                                        <button onClick={() => router.push('/pricing')}
                                            className="flex items-center gap-1 px-2 py-2 rounded-xl text-xs font-bold opacity-50 hover:opacity-80 transition-opacity"
                                            title="Pro: Rasmli blokllar"
                                            style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                                            🖼️ <ProLock />
                                        </button>
                                    )}
                                    {(q.orderItems || []).length > 2 && (
                                        <button onClick={() => {
                                            const items = (q.orderItems || ORDER_DEFAULTS()).filter((_, i) => i !== idx);
                                            upQ({ orderItems: items });
                                        }} className="text-red-400 hover:text-red-300 text-lg font-bold transition-colors">×</button>
                                    )}
                                </div>
                            ))}
                            {(q.orderItems || ORDER_DEFAULTS()).length < 8 && (
                                <button onClick={() => upQ({ orderItems: [...(q.orderItems || ORDER_DEFAULTS()), { text: '' }] })}
                                    className="w-full py-2.5 rounded-xl border border-dashed text-xs font-bold transition-all hover:scale-105"
                                    style={{ borderColor: 'rgba(255,215,0,0.3)', color: 'rgba(255,215,0,0.6)' }}>
                                    + Element qo&apos;shish (maks 8)
                                </button>
                            )}
                            <div className="glass-blue p-3 rounded-xl">
                                <p className="text-white/50 text-xs font-bold">💡 Talabalar uchun tartib avtomatik aralashtriladi. Yuqoridagi tartib — to&apos;g&apos;ri tartib.</p>
                            </div>
                        </div>
                    )}

                    {/* Match editor — Terminlar Jangi */}
                    {q.type === 'match' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <p className="text-white/40 font-bold text-xs tracking-widest">ATAMA ↔ TA&apos;RIF JUFTLARI</p>
                                <span className="text-purple-400 text-xs font-black">💎</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <p className="text-blue-400 font-black text-xs text-center">ATAMA (Term)</p>
                                <p className="text-purple-400 font-black text-xs text-center">TA&apos;RIF (Definition)</p>
                            </div>
                            {(q.matchPairs || MATCH_DEFAULTS()).map((pair, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                                            style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                                            {idx + 1}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 flex-1">
                                            <input
                                                value={pair.term}
                                                onChange={e => {
                                                    const pairs = [...(q.matchPairs || MATCH_DEFAULTS())];
                                                    pairs[idx] = { ...pairs[idx], term: e.target.value };
                                                    upQ({ matchPairs: pairs });
                                                }}
                                                placeholder={`Atama ${idx + 1}...`}
                                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-blue-500 transition-colors"
                                            />
                                            <input
                                                value={pair.definition}
                                                onChange={e => {
                                                    const pairs = [...(q.matchPairs || MATCH_DEFAULTS())];
                                                    pairs[idx] = { ...pairs[idx], definition: e.target.value };
                                                    upQ({ matchPairs: pairs });
                                                }}
                                                placeholder={`Ta'rif ${idx + 1}...`}
                                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-purple-500 transition-colors"
                                            />
                                        </div>
                                        {(q.matchPairs || []).length > 2 && (
                                            <button onClick={() => {
                                                const pairs = (q.matchPairs || MATCH_DEFAULTS()).filter((_, i) => i !== idx);
                                                upQ({ matchPairs: pairs });
                                            }} className="text-red-400 hover:text-red-300 text-xl font-bold shrink-0 transition-colors">×</button>
                                        )}
                                    </div>
                                    {isPro ? (
                                        <div className="grid grid-cols-2 gap-2 pl-9">
                                            <input value={pair.termImage || ''}
                                                onChange={e => { const p = [...(q.matchPairs || MATCH_DEFAULTS())]; p[idx] = { ...p[idx], termImage: e.target.value }; upQ({ matchPairs: p }); }}
                                                placeholder="Atama rasm URL..." className="bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-white/50 text-xs outline-none focus:border-blue-500" />
                                            <input value={pair.definitionImage || ''}
                                                onChange={e => { const p = [...(q.matchPairs || MATCH_DEFAULTS())]; p[idx] = { ...p[idx], definitionImage: e.target.value }; upQ({ matchPairs: p }); }}
                                                placeholder="Ta'rif rasm URL..." className="bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-white/50 text-xs outline-none focus:border-purple-500" />
                                        </div>
                                    ) : (
                                        <div className="pl-9">
                                            <button onClick={() => router.push('/pricing')}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold opacity-40 hover:opacity-70 transition-opacity"
                                                style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                                                🖼️ Rasm qo&apos;shish <ProLock />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(q.matchPairs || MATCH_DEFAULTS()).length < 8 && (
                                <button onClick={() => upQ({ matchPairs: [...(q.matchPairs || MATCH_DEFAULTS()), { term: '', definition: '' }] })}
                                    className="w-full py-2.5 rounded-xl border border-dashed text-xs font-bold transition-all hover:scale-105"
                                    style={{ borderColor: 'rgba(167,139,250,0.3)', color: 'rgba(167,139,250,0.6)' }}>
                                    + Juft qo&apos;shish (maks 8)
                                </button>
                            )}
                            <div className="glass p-3 rounded-xl" style={{ border: '1px solid rgba(167,139,250,0.2)' }}>
                                <p className="text-white/50 text-xs font-bold">💡 Talabalar atama va ta&apos;riflarni aralashtrilgan holda ko&apos;radi — mos juftlikni bosib topadi.</p>
                            </div>
                        </div>
                    )}

                    {/* Blitz editor — Bliz-Sohat */}
                    {q.type === 'blitz' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <p className="text-white/40 font-bold text-xs tracking-widest">TO'G'RI JAVOBNI BELGILANG</p>
                                <span className="text-red-400 text-xs font-black">⚡</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* TO'G'RI */}
                                <button onClick={() => upQ({ options: [{ text: "TO'G'RI", isCorrect: true }, { text: "NOTO'G'RI", isCorrect: false }] })}
                                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all hover:scale-105"
                                    style={{
                                        background: q.options[0]?.isCorrect ? 'linear-gradient(135deg,#15803d,#22c55e)' : 'rgba(34,197,94,0.08)',
                                        border: q.options[0]?.isCorrect ? 'none' : '2px dashed rgba(34,197,94,0.3)',
                                        boxShadow: q.options[0]?.isCorrect ? '0 8px 32px rgba(34,197,94,0.3)' : 'none',
                                    }}>
                                    <span className="text-4xl">✅</span>
                                    <span className="font-black text-white text-xl">TO&apos;G&apos;RI</span>
                                    <span className="text-2xl">{q.options[0]?.isCorrect ? '✅' : '⬜'}</span>
                                </button>
                                {/* NOTO'G'RI */}
                                <button onClick={() => upQ({ options: [{ text: "TO'G'RI", isCorrect: false }, { text: "NOTO'G'RI", isCorrect: true }] })}
                                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all hover:scale-105"
                                    style={{
                                        background: q.options[1]?.isCorrect ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'rgba(239,68,68,0.08)',
                                        border: q.options[1]?.isCorrect ? 'none' : '2px dashed rgba(239,68,68,0.3)',
                                        boxShadow: q.options[1]?.isCorrect ? '0 8px 32px rgba(239,68,68,0.3)' : 'none',
                                    }}>
                                    <span className="text-4xl">❌</span>
                                    <span className="font-black text-white text-xl">NOTO&apos;G&apos;RI</span>
                                    <span className="text-2xl">{q.options[1]?.isCorrect ? '✅' : '⬜'}</span>
                                </button>
                            </div>
                            <div className="glass p-3 rounded-xl" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                                <p className="text-white/50 text-xs font-bold">⚡ Bliz rejimi: {q.timeLimit}s vaqt. Ballar: 100 × 1.5^(streak-1). Seriyali to&apos;g&apos;ri javoblar uchun eksponensial ko&apos;paytiruvchi!</p>
                            </div>
                        </div>
                    )}

                    {/* Anagram editor — Yashirin Kod */}
                    {q.type === 'anagram' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <p className="text-white/40 font-bold text-xs tracking-widest">YASHIRIN SO&apos;Z VA MASLAHAT</p>
                                <span className="text-indigo-400 text-xs font-black">🔐</span>
                            </div>

                            {/* Clue — already in the main question textarea, explain it */}
                            <div className="glass p-3 rounded-xl" style={{ border: '1px solid rgba(99,102,241,0.25)' }}>
                                <p className="text-white/50 text-xs font-bold">💬 Yuqoridagi &quot;Savol matni&quot; — bu maslahat (clue). Talabalar uni ko&apos;rgan holda so&apos;zni tiklashadi.</p>
                            </div>

                            {/* Hidden word input */}
                            <div className="space-y-1">
                                <label className="text-indigo-300 font-bold text-xs tracking-widest">YASHIRIN SO&apos;Z (Talabalar ko&apos;rmaydi)</label>
                                <input
                                    type="text"
                                    value={q.anagramWord || ''}
                                    onChange={e => upQ({ anagramWord: e.target.value.toUpperCase() })}
                                    placeholder="Masalan: RESPUBLIKA"
                                    maxLength={20}
                                    className="w-full glass px-4 py-3 rounded-xl font-black text-xl tracking-widest outline-none transition-all"
                                    style={{
                                        border: '2px solid rgba(99,102,241,0.4)',
                                        color: '#818cf8',
                                        background: 'rgba(99,102,241,0.08)',
                                        letterSpacing: '0.2em',
                                    }}
                                />
                                {q.anagramWord && (
                                    <p className="text-white/30 text-xs font-bold mt-1">
                                        {q.anagramWord.length} ta harf · Ballar: ~{q.anagramWord.length * 100} (vaqt bo&apos;yicha)
                                    </p>
                                )}
                            </div>

                            {/* Time limit */}
                            <div className="space-y-1">
                                <label className="text-white/40 font-bold text-xs tracking-widest">VAQT CHEGARASI</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[15, 20, 30, 45, 60].map(t => (
                                        <button key={t} onClick={() => upQ({ timeLimit: t })}
                                            className="px-5 py-2.5 rounded-xl font-black text-base transition-all"
                                            style={q.timeLimit === t
                                                ? { background: 'linear-gradient(135deg,#3730a3,#6366f1)', color: 'white', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }
                                                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                                            {t}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="glass p-3 rounded-xl" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
                                <p className="text-white/50 text-xs font-bold">🔐 Harf ko&apos;makka har biri −200 ball jarima. Formula: so&apos;z_uzunligi × 100 × vaqt_ulushi − ko&apos;mak_jarima</p>
                            </div>
                        </div>
                    )}

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
