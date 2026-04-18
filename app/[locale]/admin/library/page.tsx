'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Question {
    question: string;
    correctAnswer: string;
    wrongAnswers: [string, string, string];
}

interface LibraryQuiz {
    id: string;
    title: string;
    subject: string;
    grade: string;
    game_type: string;
    badge_type: string;
    play_count: number;
    rating: number;
    is_pinned: boolean;
    is_seasonal: boolean;
    is_active: boolean;
    created_at: string;
    questions: Question[];
}

interface Stats {
    total: number;
    thisMonth: number;
    totalPlays: number;
    avgRating: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SUBJECTS = [
    // Maktab fanlari
    'Matematika', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya',
    'Tarix', 'Geografiya', "O'zbek tili", "O'zbek adabiyoti", 'Rus tili',
    'Ingliz tili', 'Nemis tili', 'Fransuz tili', 'Informatika',
    'Chizmachilik', 'Texnologiya', 'Jismoniy tarbiya', 'Musiqa', "Tasviriy san'at",
    // Oliy ta'lim
    'Iqtisodiyot', 'Huquq', 'Falsafa', 'Psixologiya', 'Sotsiologiya',
    'Tibbiyot', 'Farmakologiya', 'Arxitektura', 'Muhandislik',
    'Dasturlash', "Ma'lumotlar bazasi", 'Tarmoq texnologiyalari', "Sun'iy intellekt",
    'Moliya', 'Buxgalteriya', 'Marketing', 'Menejment', 'Pedagogika',
    // Maxsus
    'DTM tayyorlov', 'IELTS/CEFR', 'Umumiy bilim',
    '— Boshqa (o\'zim yozaman)',
];

const GRADES_SCHOOL = [
    '1-sinf', '2-sinf', '3-sinf', '4-sinf', '5-sinf',
    '6-sinf', '7-sinf', '8-sinf', '9-sinf', '10-sinf', '11-sinf',
];
const GRADES_HIGHER = [
    '1-kurs', '2-kurs', '3-kurs', '4-kurs',
    'Magistratura', 'Doktorantura',
];
const GRADES_OTHER = ['DTM tayyorlov', 'Barcha', '— Boshqa (o\'zim yozaman)'];

const ALL_GRADES = [...GRADES_SCHOOL, ...GRADES_HIGHER, ...GRADES_OTHER];

const GAME_TYPES = ['Klassik', 'Blitz', 'Mantiqiy zanjir'];
const BADGE_TYPES = ['Trendda', 'Moderator tanlovi', "Yangi qo'shildi", 'DTM tayyorlov'];

const CUSTOM_MARKER = "— Boshqa (o'zim yozaman)";

const emptyQuestion = (): Question => ({
    question: '',
    correctAnswer: '',
    wrongAnswers: ['', '', ''],
});

const emptyForm = () => ({
    title: '',
    subject: 'Matematika',
    subjectCustom: '',
    grade: 'Barcha',
    gradeCustom: '',
    game_type: 'Klassik',
    badge_type: "Yangi qo'shildi",
    is_pinned: false,
    is_seasonal: false,
    questions: [emptyQuestion()],
});

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color?: string }) {
    return (
        <div className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-2xl">{icon}</span>
            <p className="text-white/40 text-xs font-black uppercase tracking-wider mt-1">{label}</p>
            <p className="text-2xl font-black" style={{ color: color ?? 'white' }}>{value}</p>
        </div>
    );
}

// ─── SelectOrType ─────────────────────────────────────────────────────────────

function SelectOrType({
    label,
    options,
    value,
    customValue,
    onSelect,
    onCustom,
}: {
    label: string;
    options: string[];
    value: string;
    customValue: string;
    onSelect: (v: string) => void;
    onCustom: (v: string) => void;
}) {
    const isCustom = value === CUSTOM_MARKER;
    return (
        <div>
            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">{label}</label>
            <select
                value={value}
                onChange={e => onSelect(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
            >
                {options.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {isCustom && (
                <input
                    value={customValue}
                    onChange={e => onCustom(e.target.value)}
                    placeholder="O'zingiz yozing..."
                    className="w-full mt-1.5 bg-white/5 border border-blue-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-blue-500/60"
                    autoFocus
                />
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminLibraryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) ?? 'uz';

    const [quizzes, setQuizzes] = useState<LibraryQuiz[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('Barchasi');

    const [form, setForm] = useState(emptyForm());
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // AI generation state
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [aiLang, setAiLang] = useState<'uz' | 'ru' | 'en'>('uz');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMsg, setAiMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') { router.replace(`/${locale}`); return; }
        const role = (session?.user as any)?.role;
        if (role !== 'MODERATOR' && role !== 'ADMIN') router.replace(`/${locale}`);
    }, [status, session, locale, router]);

    // ── Data loading ────────────────────────────────────────────────────────
    const loadData = useCallback(() => {
        setLoading(true);
        fetch('/api/library/quizzes?all=true')
            .then(r => r.json())
            .then(d => { setQuizzes(d.quizzes ?? []); setStats(d.stats ?? null); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (status === 'authenticated') loadData();
    }, [status, loadData]);

    // ── Derived ─────────────────────────────────────────────────────────────
    const filtered = quizzes.filter(q => {
        const matchS = !search || q.title.toLowerCase().includes(search.toLowerCase());
        const matchF = subjectFilter === 'Barchasi' || q.subject === subjectFilter;
        return matchS && matchF;
    });

    // ── Form helpers ────────────────────────────────────────────────────────
    const setField = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const getSubject = () => form.subject === CUSTOM_MARKER ? form.subjectCustom.trim() : form.subject;
    const getGrade = () => form.grade === CUSTOM_MARKER ? form.gradeCustom.trim() : form.grade;

    const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }));

    const removeQuestion = (i: number) =>
        setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }));

    const updateQuestion = (i: number, key: 'question' | 'correctAnswer', val: string) =>
        setForm(f => ({
            ...f,
            questions: f.questions.map((q, j) => j === i ? { ...q, [key]: val } : q),
        }));

    const updateWrong = (qi: number, wi: number, val: string) =>
        setForm(f => ({
            ...f,
            questions: f.questions.map((q, j) =>
                j === qi
                    ? { ...q, wrongAnswers: q.wrongAnswers.map((w, k) => k === wi ? val : w) as [string, string, string] }
                    : q
            ),
        }));

    const startEdit = (quiz: LibraryQuiz) => {
        const knownSubject = SUBJECTS.includes(quiz.subject);
        const knownGrade = ALL_GRADES.includes(quiz.grade);
        setEditId(quiz.id);
        setForm({
            title: quiz.title,
            subject: knownSubject ? quiz.subject : CUSTOM_MARKER,
            subjectCustom: knownSubject ? '' : quiz.subject,
            grade: knownGrade ? quiz.grade : CUSTOM_MARKER,
            gradeCustom: knownGrade ? '' : quiz.grade,
            game_type: quiz.game_type,
            badge_type: quiz.badge_type,
            is_pinned: quiz.is_pinned,
            is_seasonal: quiz.is_seasonal,
            questions: quiz.questions.length > 0 ? quiz.questions : [emptyQuestion()],
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => { setEditId(null); setForm(emptyForm()); setSaveMsg(null); };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const subject = getSubject();
        const grade = getGrade();
        if (!form.title.trim() || !subject || form.questions.length === 0) {
            setSaveMsg({ type: 'err', text: "Sarlavha, fan va kamida 1 ta savol kiritilishi shart" });
            return;
        }
        setSaving(true);
        setSaveMsg(null);
        try {
            const url = editId ? `/api/library/quizzes/${editId}` : '/api/library/quizzes';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, subject, grade }),
            });
            if (res.ok) {
                setSaveMsg({ type: 'ok', text: editId ? '✓ Yangilandi!' : '✓ Saqlandi!' });
                setEditId(null);
                setForm(emptyForm());
                loadData();
                setTimeout(() => setSaveMsg(null), 3000);
            } else {
                const d = await res.json();
                setSaveMsg({ type: 'err', text: d.error ?? 'Xatolik yuz berdi' });
            }
        } catch {
            setSaveMsg({ type: 'err', text: "Server bilan aloqa yo'q" });
        } finally {
            setSaving(false);
        }
    };

    // ── AI Generate ──────────────────────────────────────────────────────────
    const handleAiGenerate = async () => {
        if (!aiTopic.trim()) { setAiMsg({ type: 'err', text: 'Mavzu kiriting' }); return; }
        setAiLoading(true);
        setAiMsg(null);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: aiTopic, count: aiCount, language: aiLang, timeLimit: 20 }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.rateLimited) {
                    setAiMsg({ type: 'err', text: `⏱ Rate limit. ${data.retryAfter ? `${data.retryAfter}s kutib urining` : 'Bir oz kuting'}` });
                } else {
                    setAiMsg({ type: 'err', text: data.error ?? 'AI xatoligi' });
                }
                return;
            }
            // Convert AI format → our Question format
            const converted: Question[] = (data.questions ?? []).map((q: any) => {
                const opts: string[] = q.options ?? [];
                const correctIdx: number = (q.correctOptions ?? [0])[0];
                const correct = opts[correctIdx] ?? '';
                const wrong = opts.filter((_: string, i: number) => i !== correctIdx).slice(0, 3);
                while (wrong.length < 3) wrong.push('');
                return {
                    question: q.text ?? '',
                    correctAnswer: correct,
                    wrongAnswers: wrong as [string, string, string],
                };
            });
            setForm(f => ({ ...f, questions: [...f.questions.filter(q => q.question), ...converted] }));
            setAiMsg({ type: 'ok', text: `✓ ${converted.length} ta savol qo'shildi` });
            setTimeout(() => setAiMsg(null), 4000);
        } catch {
            setAiMsg({ type: 'err', text: "Server bilan aloqa yo'q" });
        } finally {
            setAiLoading(false);
        }
    };

    // ── Archive ──────────────────────────────────────────────────────────────
    const handleArchive = async (quiz: LibraryQuiz) => {
        setActionLoading(quiz.id + '_arch');
        await fetch(`/api/library/quizzes/${quiz.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !quiz.is_active }),
        });
        setActionLoading(null);
        loadData();
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        if (!confirm("Rostdan ham o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.")) return;
        setActionLoading(id + '_del');
        await fetch(`/api/library/quizzes/${id}`, { method: 'DELETE' });
        setActionLoading(null);
        if (editId === id) cancelEdit();
        loadData();
    };

    // ── Render ───────────────────────────────────────────────────────────────
    if (status === 'loading' || (loading && quizzes.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-64 text-white/30 font-bold text-lg">
                Yuklanmoqda...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-1">Admin · Kutubxona</p>
                    <h1 className="text-3xl font-black text-white">📚 Library Quizlar</h1>
                </div>
                <a href={`/${locale}/admin`} className="text-white/40 hover:text-white font-bold text-sm transition-colors">
                    ← Admin panelga
                </a>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon="📚" label="Jami quizlar" value={stats.total} />
                    <StatCard icon="✨" label="Bu oy qo'shilgan" value={stats.thisMonth} color="#60a5fa" />
                    <StatCard icon="▶" label="Umumiy o'ynalish" value={stats.totalPlays.toLocaleString()} color="#00E676" />
                    <StatCard icon="⭐" label="O'rtacha reyting" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'} color="#fbbf24" />
                </div>
            )}

            {/* Main 2-column layout */}
            <div className="flex flex-col xl:flex-row gap-6">

                {/* ── LEFT: Quiz table ────────────────────────────────────── */}
                <div className="flex-1 min-w-0 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-white/5">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="🔍 Sarlavha bo'yicha qidirish..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-blue-500/50"
                        />
                        <select
                            value={subjectFilter}
                            onChange={e => setSubjectFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 font-semibold outline-none cursor-pointer"
                        >
                            <option value="Barchasi">Barcha fanlar</option>
                            {SUBJECTS.filter(s => s !== CUSTOM_MARKER).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Sarlavha', 'Fan', 'Sinf', 'Savollar', "O'ynalgan", 'Reyting', 'Holat', 'Amallar'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-white/25 font-black text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-white/25 font-bold">
                                            {search || subjectFilter !== 'Barchasi' ? "Natija topilmadi" : "Hali quizlar qo'shilmagan"}
                                        </td>
                                    </tr>
                                ) : filtered.map(quiz => (
                                    <tr
                                        key={quiz.id}
                                        className="border-b border-white/5 last:border-0 transition-colors"
                                        style={{ background: editId === quiz.id ? 'rgba(59,130,246,0.06)' : undefined }}
                                    >
                                        <td className="px-4 py-3 text-white font-bold max-w-[180px] truncate" title={quiz.title}>
                                            {quiz.is_pinned && <span className="text-yellow-400 mr-1">📌</span>}
                                            {quiz.is_seasonal && <span className="text-purple-400 mr-1">🌸</span>}
                                            {quiz.title}
                                        </td>
                                        <td className="px-4 py-3 text-white/50 font-semibold whitespace-nowrap">{quiz.subject}</td>
                                        <td className="px-4 py-3 text-white/50 font-semibold whitespace-nowrap">{quiz.grade}</td>
                                        <td className="px-4 py-3 text-white/50 font-semibold text-center">{Array.isArray(quiz.questions) ? quiz.questions.length : 0}</td>
                                        <td className="px-4 py-3 text-white/50 font-semibold text-center">{quiz.play_count}</td>
                                        <td className="px-4 py-3 text-white/50 font-semibold text-center">{quiz.rating > 0 ? quiz.rating.toFixed(1) : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-lg text-xs font-black" style={quiz.is_active ? { background: 'rgba(0,230,118,0.1)', color: '#00E676' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                                                {quiz.is_active ? 'Faol' : 'Arxiv'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <button onClick={() => startEdit(quiz)} className="px-2.5 py-1 rounded-lg text-xs font-black transition-all hover:scale-105" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>✏️</button>
                                                <button onClick={() => handleArchive(quiz)} disabled={actionLoading === quiz.id + '_arch'} className="px-2.5 py-1 rounded-lg text-xs font-black transition-all hover:scale-105 disabled:opacity-50" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }} title={quiz.is_active ? 'Arxivlash' : 'Faollashtirish'}>
                                                    {quiz.is_active ? '📦' : '♻️'}
                                                </button>
                                                <button onClick={() => handleDelete(quiz.id)} disabled={actionLoading === quiz.id + '_del'} className="px-2.5 py-1 rounded-lg text-xs font-black transition-all hover:scale-105 disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-3 border-t border-white/5 text-white/25 text-xs font-semibold">
                        {filtered.length} ta quiz ko&apos;rsatilmoqda
                    </div>
                </div>

                {/* ── RIGHT: Add / Edit form ──────────────────────────────── */}
                <div className="xl:w-[440px] shrink-0 flex flex-col gap-4">

                    {/* Form card */}
                    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-black text-base">{editId ? '✏️ Tahrirlash' : '➕ Yangi quiz'}</h2>
                            {editId && (
                                <button onClick={cancelEdit} className="text-white/40 hover:text-white text-xs font-bold transition-colors">Bekor qilish ✕</button>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Sarlavha *</label>
                            <input
                                value={form.title}
                                onChange={e => setField('title', e.target.value)}
                                placeholder="Quiz sarlavhasini kiriting..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 font-semibold outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {/* Subject + Grade */}
                        <div className="grid grid-cols-2 gap-3">
                            <SelectOrType
                                label="Fan *"
                                options={SUBJECTS}
                                value={form.subject}
                                customValue={form.subjectCustom}
                                onSelect={v => setField('subject', v)}
                                onCustom={v => setField('subjectCustom', v)}
                            />
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Sinf</label>
                                <select
                                    value={form.grade}
                                    onChange={e => setField('grade', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                >
                                    <optgroup label="Maktab">
                                        {GRADES_SCHOOL.map(g => <option key={g} value={g}>{g}</option>)}
                                    </optgroup>
                                    <optgroup label="Oliy ta'lim">
                                        {GRADES_HIGHER.map(g => <option key={g} value={g}>{g}</option>)}
                                    </optgroup>
                                    <optgroup label="Boshqa">
                                        {GRADES_OTHER.map(g => <option key={g} value={g}>{g}</option>)}
                                    </optgroup>
                                </select>
                                {form.grade === CUSTOM_MARKER && (
                                    <input
                                        value={form.gradeCustom}
                                        onChange={e => setField('gradeCustom', e.target.value)}
                                        placeholder="O'zingiz yozing..."
                                        className="w-full mt-1.5 bg-white/5 border border-blue-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-blue-500/60"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                        {/* Game type + Badge */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">O&apos;yin turi</label>
                                <select value={form.game_type} onChange={e => setField('game_type', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer">
                                    {GAME_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Badge</label>
                                <select value={form.badge_type} onChange={e => setField('badge_type', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer">
                                    {BADGE_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-4">
                            {[
                                { key: 'is_pinned', label: '📌 Pinlangan', hint: 'Karuselda 1-slot' },
                                { key: 'is_seasonal', label: '🌸 Mavsum', hint: 'Karuselda oxirgi slot' },
                            ].map(({ key, label, hint }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setField(key, !(form as any)[key])}
                                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-black transition-all"
                                    style={{
                                        background: (form as any)[key] ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                                        color: (form as any)[key] ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                                        border: (form as any)[key] ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <span>{label}</span>
                                    <span className="text-[10px] opacity-60">{hint}</span>
                                </button>
                            ))}
                        </div>

                        {/* Questions */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider">Savollar ({form.questions.length})</label>
                                <button onClick={addQuestion} className="text-xs font-black px-3 py-1.5 rounded-lg transition-all hover:scale-105" style={{ background: 'rgba(0,230,118,0.12)', color: '#00E676' }}>
                                    + Savol qo&apos;shish
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                                {form.questions.map((q, i) => (
                                    <div key={i} className="rounded-xl p-4 flex flex-col gap-2.5 relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white/30 text-xs font-black">{i + 1}-savol</span>
                                            {form.questions.length > 1 && (
                                                <button onClick={() => removeQuestion(i)} className="text-red-400/60 hover:text-red-400 text-xs font-black transition-colors">O&apos;chirish ✕</button>
                                            )}
                                        </div>
                                        <textarea
                                            value={q.question}
                                            onChange={e => updateQuestion(i, 'question', e.target.value)}
                                            placeholder="Savol matni..."
                                            rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 font-semibold outline-none focus:border-blue-500/40 resize-none"
                                        />
                                        <input
                                            value={q.correctAnswer}
                                            onChange={e => updateQuestion(i, 'correctAnswer', e.target.value)}
                                            placeholder="✓ To'g'ri javob"
                                            className="w-full rounded-lg px-3 py-2 text-xs text-green-300 placeholder-green-500/40 font-semibold outline-none focus:border-green-500/40"
                                            style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)' }}
                                        />
                                        {q.wrongAnswers.map((w, wi) => (
                                            <input
                                                key={wi}
                                                value={w}
                                                onChange={e => updateWrong(i, wi, e.target.value)}
                                                placeholder={`✗ Noto'g'ri javob ${wi + 1}`}
                                                className="w-full rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/20 font-semibold outline-none"
                                                style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {saveMsg && (
                            <div className="px-4 py-2.5 rounded-xl text-sm font-bold text-center" style={saveMsg.type === 'ok' ? { background: 'rgba(0,230,118,0.12)', color: '#00E676' } : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                {saveMsg.text}
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white' }}
                        >
                            {saving ? '⏳ Saqlanmoqda...' : editId ? '💾 Yangilash' : '💾 Saqlash'}
                        </button>
                    </div>

                    {/* ── AI Generator card ───────────────────────────────── */}
                    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <h2 className="text-white font-black text-base">AI bilan savollar yaratish</h2>
                        </div>
                        <p className="text-white/35 text-xs font-semibold -mt-2">
                            Mavzu yozing, AI avtomatik savollar yaratib yuqoridagi savollar ro&apos;yxatiga qo&apos;shadi
                        </p>

                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Mavzu / Fan</label>
                            <input
                                value={aiTopic}
                                onChange={e => setAiTopic(e.target.value)}
                                placeholder="Masalan: Fotosintez jarayoni, Kvadrat tenglama..."
                                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 font-semibold outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Savollar soni</label>
                                <select
                                    value={aiCount}
                                    onChange={e => setAiCount(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                >
                                    {[3, 5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} ta</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Til</label>
                                <select
                                    value={aiLang}
                                    onChange={e => setAiLang(e.target.value as 'uz' | 'ru' | 'en')}
                                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                >
                                    <option value="uz">🇺🇿 O&apos;zbek</option>
                                    <option value="ru">🇷🇺 Rus</option>
                                    <option value="en">🇬🇧 English</option>
                                </select>
                            </div>
                        </div>

                        {aiMsg && (
                            <div className="px-4 py-2.5 rounded-xl text-xs font-bold text-center" style={aiMsg.type === 'ok' ? { background: 'rgba(0,230,118,0.12)', color: '#00E676' } : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                {aiMsg.text}
                            </div>
                        )}

                        <button
                            onClick={handleAiGenerate}
                            disabled={aiLoading}
                            className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: aiLoading ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }}
                        >
                            {aiLoading ? '⏳ AI yaratyapti...' : '✨ AI bilan yaratish'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
