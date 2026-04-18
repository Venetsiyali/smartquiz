'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Question {
    id: string;
    text: string;
    options: { text: string; isCorrect: boolean }[];
    imageUrl?: string;
    hint?: string;
    timeLimit: number;
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
    questions: any[];
}

interface Stats { total: number; thisMonth: number; totalPlays: number; avgRating: number; }

// ─── Constants ──────────────────────────────────────────────────────────────

const SUBJECTS = [
    'Matematika', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya',
    'Tarix', 'Geografiya', "O'zbek tili", "O'zbek adabiyoti", 'Rus tili',
    'Ingliz tili', 'Nemis tili', 'Fransuz tili', 'Informatika',
    'Chizmachilik', 'Texnologiya', 'Jismoniy tarbiya', 'Musiqa', "Tasviriy san'at",
    'Iqtisodiyot', 'Huquq', 'Falsafa', 'Psixologiya', 'Sotsiologiya',
    'Tibbiyot', 'Farmakologiya', 'Arxitektura', 'Muhandislik',
    'Dasturlash', "Ma'lumotlar bazasi", 'Tarmoq texnologiyalari', "Sun'iy intellekt",
    'Moliya', 'Buxgalteriya', 'Marketing', 'Menejment', 'Pedagogika',
    'DTM tayyorlov', 'IELTS/CEFR', 'Umumiy bilim',
    "— Boshqa (o'zim yozaman)",
];

const GRADES_SCHOOL = ['1-sinf','2-sinf','3-sinf','4-sinf','5-sinf','6-sinf','7-sinf','8-sinf','9-sinf','10-sinf','11-sinf'];
const GRADES_HIGHER = ['1-kurs','2-kurs','3-kurs','4-kurs','Magistratura','Doktorantura'];
const GRADES_OTHER  = ['DTM tayyorlov','Barcha',"— Boshqa (o'zim yozaman)"];
const ALL_GRADES = [...GRADES_SCHOOL, ...GRADES_HIGHER, ...GRADES_OTHER];
const GAME_TYPES  = ['Klassik','Blitz','Mantiqiy zanjir'];
const BADGE_TYPES = ['Trendda','Moderator tanlovi',"Yangi qo'shildi",'DTM tayyorlov'];
const CUSTOM_MARKER = "— Boshqa (o'zim yozaman)";

const emptyQuestion = (): Question => ({
    id: uuidv4(),
    text: '',
    options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
    ],
    imageUrl: '',
    hint: '',
    timeLimit: 20,
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

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color?: string }) {
    return (
        <div className="rounded-2xl p-5 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-2xl">{icon}</span>
            <p className="text-white/40 text-xs font-black uppercase tracking-wider mt-1">{label}</p>
            <p className="text-2xl font-black" style={{ color: color ?? 'white' }}>{value}</p>
        </div>
    );
}

function SelectOrType({ label, options, value, customValue, onSelect, onCustom }: { label: string; options: string[]; value: string; customValue: string; onSelect: (v: string) => void; onCustom: (v: string) => void; }) {
    const isCustom = value === CUSTOM_MARKER;
    return (
        <div>
            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">{label}</label>
            <select value={value} onChange={e => onSelect(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold outline-none cursor-pointer text-white" style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                {options.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {isCustom && (
                <input value={customValue} onChange={e => onCustom(e.target.value)} placeholder="O'zingiz yozing..." className="w-full mt-1.5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none" style={{ background: '#0d1a2e', border: '1px solid rgba(59,130,246,0.4)' }} autoFocus />
            )}
        </div>
    );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ q, idx, total, onChange, onRemove }: {
    q: Question; idx: number; total: number;
    onChange: (updated: Question) => void;
    onRemove: () => void;
}) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload/image', { method: 'POST', body: fd });
            if (res.ok) {
                const data = await res.json();
                onChange({ ...q, imageUrl: data.url });
            }
        } catch { /* ignore */ }
        setUploading(false);
    };

    const setOption = (optIdx: number, text: string) => {
        const opts = q.options.map((o, i) => i === optIdx ? { ...o, text } : o);
        onChange({ ...q, options: opts });
    };
    const setCorrect = (optIdx: number) => {
        const opts = q.options.map((o, i) => ({ ...o, isCorrect: i === optIdx }));
        onChange({ ...q, options: opts });
    };

    const optColors = ['rgba(239,68,68,0.12)', 'rgba(59,130,246,0.12)', 'rgba(234,179,8,0.12)', 'rgba(34,197,94,0.12)'];
    const optBorders = ['rgba(239,68,68,0.3)', 'rgba(59,130,246,0.3)', 'rgba(234,179,8,0.3)', 'rgba(34,197,94,0.3)'];
    const optIcons = ['🔴', '🔵', '🟡', '🟢'];

    return (
        <div className="rounded-2xl p-4 flex flex-col gap-3 relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs font-black">{idx + 1}-savol</span>
                <div className="flex gap-2">
                    <select value={q.timeLimit} onChange={e => onChange({ ...q, timeLimit: Number(e.target.value) })}
                        className="text-xs font-bold px-2 py-1 rounded-lg text-white/60 outline-none cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}>
                        {[10, 20, 30, 60, 90].map(t => <option key={t} value={t}>{t}s</option>)}
                    </select>
                    {total > 1 && (
                        <button onClick={onRemove} className="text-red-400/50 hover:text-red-400 text-xs font-black transition-colors">✕</button>
                    )}
                </div>
            </div>

            {/* Savol matni */}
            <textarea value={q.text} onChange={e => onChange({ ...q, text: e.target.value })}
                placeholder="Savol matni..." rows={2}
                className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 font-semibold outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />

            {/* Rasm */}
            <div>
                {q.imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={q.imageUrl} alt="savol rasm" className="w-full h-28 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => imageInputRef.current?.click()} className="px-2 py-1 rounded-lg text-xs font-bold bg-white/20 text-white">🔄 O'zgartirish</button>
                            <button onClick={() => onChange({ ...q, imageUrl: '' })} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-500/40 text-white">🗑️</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => imageInputRef.current?.click()}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-white/5 flex items-center justify-center gap-2"
                        style={{ border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }}>
                        {uploading ? '⏳ Yuklanmoqda...' : '🖼️ Rasm qo\'shish (ixtiyoriy)'}
                    </button>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            </div>

            {/* Variantlar */}
            <div className="grid grid-cols-2 gap-2">
                {q.options.map((o, oi) => (
                    <div key={oi} className="relative flex gap-1.5">
                        <button onClick={() => setCorrect(oi)}
                            className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-2"
                            style={{ borderColor: o.isCorrect ? '#00E676' : 'rgba(255,255,255,0.2)', background: o.isCorrect ? 'rgba(0,230,118,0.2)' : 'transparent' }}>
                            {o.isCorrect && <div className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />}
                        </button>
                        <div className="flex-1 relative">
                            <input value={o.text} onChange={e => setOption(oi, e.target.value)}
                                placeholder={`${optIcons[oi]} Variant ${oi + 1}`}
                                className="w-full rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 font-semibold outline-none"
                                style={{ background: optColors[oi], border: `1px solid ${optBorders[oi]}` }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Izoh (ixtiyoriy) */}
            <input value={q.hint || ''} onChange={e => onChange({ ...q, hint: e.target.value })}
                placeholder="💡 Ishora (ixtiyoriy — o'yin vaqtida ko'mak sifatida ko'rsatiladi)"
                className="w-full rounded-xl px-3 py-2 text-xs text-white/60 placeholder-white/20 font-semibold outline-none"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }} />
        </div>
    );
}

// ─── File Upload Section ──────────────────────────────────────────────────────

function FileUploadSection({ onImport, aiProvider, setAiProvider }: {
    onImport: (qs: Question[]) => void;
    aiProvider: 'groq' | 'gemini';
    setAiProvider: (p: 'groq' | 'gemini') => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [count, setCount] = useState(5);
    const [lang, setLang] = useState<'uz' | 'ru' | 'en'>('uz');
    const [timeLimit, setTimeLimit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!file) { setMsg({ type: 'err', text: 'Fayl tanlang' }); return; }
        setLoading(true); setMsg(null);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('count', String(count));
        fd.append('language', lang);
        fd.append('timeLimit', String(timeLimit));
        fd.append('provider', aiProvider);
        try {
            const res = await fetch('/api/ai/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) { setMsg({ type: 'err', text: data.error ?? 'Xatolik' }); return; }
            const mapped: Question[] = (data.questions ?? []).map((q: any) => ({
                id: uuidv4(), text: q.text,
                options: (q.options ?? []).map((o: string, i: number) => ({ text: o, isCorrect: (q.correctOptions ?? [0]).includes(i) })),
                hint: q.hint ?? '',
                timeLimit,
                imageUrl: '',
            }));
            onImport(mapped);
            setMsg({ type: 'ok', text: `✓ ${mapped.length} ta savol qo'shildi` });
            setFile(null);
            setTimeout(() => setMsg(null), 4000);
        } catch { setMsg({ type: 'err', text: 'Server xatoligi' }); }
        setLoading(false);
    };

    return (
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <h3 className="text-white font-black text-sm">Fayl orqali AI yaratish</h3>
            </div>
            <p className="text-white/35 text-xs font-semibold -mt-2">PDF yoki DOCX faylni yuklang. AI matndan savollar tuzib qo'shadi.</p>

            <div onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all hover:border-blue-500/50"
                style={{ borderColor: file ? '#00E676' : 'rgba(255,255,255,0.15)' }}>
                <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                <div className="text-3xl mb-1">{file ? '📄' : '📁'}</div>
                {file
                    ? <><p className="text-green-400 font-bold text-xs">{file.name}</p><p className="text-white/30 text-xs">{(file.size / 1024).toFixed(1)} KB</p></>
                    : <><p className="text-white/50 font-bold text-xs">PDF yoki DOCX yuklang</p><p className="text-white/25 text-xs">yoki bosing</p></>}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1">Savollar</label>
                    <div className="flex flex-wrap gap-1">
                        {[3,5,8,10,15].map(n => (
                            <button key={n} onClick={() => setCount(n)} className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                                style={count === n ? { background: '#1d4ed8', color: 'white' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>{n}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1">Til</label>
                    <div className="flex gap-1">
                        {[{c:'uz',l:'🇺🇿'},{c:'ru',l:'🇷🇺'},{c:'en',l:'🇬🇧'}].map(x => (
                            <button key={x.c} onClick={() => setLang(x.c as 'uz'|'ru'|'en')} className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                                style={lang === x.c ? { background: '#1d4ed8', color: 'white' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>{x.l}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1">Vaqt</label>
                    <div className="flex gap-1">
                        {[20,30,60].map(t => (
                            <button key={t} onClick={() => setTimeLimit(t)} className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                                style={timeLimit === t ? { background: '#dc2626', color: 'white' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>{t}s</button>
                        ))}
                    </div>
                </div>
            </div>

            {msg && <div className="px-3 py-2 rounded-xl text-xs font-bold text-center" style={msg.type === 'ok' ? { background: 'rgba(0,230,118,0.12)', color: '#00E676' } : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{msg.text}</div>}

            <button onClick={handleUpload} disabled={loading || !file}
                className="w-full py-2.5 rounded-xl font-black text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)', color: 'white' }}>
                {loading ? '⏳ AI yaratyapti...' : '📤 Faylni yuklash va savol tuzish'}
            </button>
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

    // AI
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [aiLang, setAiLang] = useState<'uz' | 'ru' | 'en'>('uz');
    const [aiProvider, setAiProvider] = useState<'groq' | 'gemini'>('groq');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMsg, setAiMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // Accordion tabs
    const [activeTab, setActiveTab] = useState<'manual' | 'ai-topic' | 'ai-file'>('ai-topic');

    // Auth guard
    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') { router.replace(`/${locale}`); return; }
        const role = (session?.user as any)?.role;
        if (role !== 'MODERATOR' && role !== 'ADMIN') router.replace(`/${locale}`);
    }, [status, session, locale, router]);

    // Data loading
    const loadData = useCallback(() => {
        setLoading(true);
        fetch('/api/library/quizzes?all=true')
            .then(r => r.json())
            .then(d => { setQuizzes(d.quizzes ?? []); setStats(d.stats ?? null); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { if (status === 'authenticated') loadData(); }, [status, loadData]);

    const filtered = quizzes.filter(q => {
        const matchS = !search || q.title.toLowerCase().includes(search.toLowerCase());
        const matchF = subjectFilter === 'Barchasi' || q.subject === subjectFilter;
        return matchS && matchF;
    });

    // Form helpers
    const setField = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
    const getSubject = () => form.subject === CUSTOM_MARKER ? form.subjectCustom.trim() : form.subject;
    const getGrade = () => form.grade === CUSTOM_MARKER ? form.gradeCustom.trim() : form.grade;

    const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
    const removeQuestion = (i: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }));
    const updateQuestion = (i: number, updated: Question) =>
        setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === i ? updated : q) }));

    const startEdit = (quiz: LibraryQuiz) => {
        const knownSubject = SUBJECTS.includes(quiz.subject);
        const knownGrade = ALL_GRADES.includes(quiz.grade);
        setEditId(quiz.id);

        // Convert old format to new
        const qs: Question[] = (quiz.questions || []).map((q: any) => {
            if (q.id && q.options) return q; // already new format
            // Legacy {question, correctAnswer, wrongAnswers}
            return {
                id: uuidv4(),
                text: q.question || q.text || '',
                options: [
                    { text: q.correctAnswer || '', isCorrect: true },
                    ...(q.wrongAnswers || []).map((w: string) => ({ text: w, isCorrect: false })),
                ].slice(0, 4),
                hint: q.hint || '',
                imageUrl: q.imageUrl || '',
                timeLimit: q.timeLimit || 20,
            };
        });

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
            questions: qs.length > 0 ? qs : [emptyQuestion()],
        });
        setActiveTab('manual');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => { setEditId(null); setForm(emptyForm()); setSaveMsg(null); };

    // Save
    const handleSave = async () => {
        const subject = getSubject();
        const grade = getGrade();
        if (!form.title.trim() || !subject || form.questions.length === 0) {
            setSaveMsg({ type: 'err', text: 'Sarlavha, fan va kamida 1 ta savol kiritilishi shart' });
            return;
        }
        // Convert to legacy format for API compatibility
        const questionsForApi = form.questions.map((q: Question) => {
            const correct = q.options.find(o => o.isCorrect)?.text ?? '';
            const wrong = q.options.filter(o => !o.isCorrect).map(o => o.text);
            while (wrong.length < 3) wrong.push('');
            return {
                question: q.text,
                correctAnswer: correct,
                wrongAnswers: wrong.slice(0, 3) as [string, string, string],
            };
        });
        setSaving(true); setSaveMsg(null);
        try {
            const url = editId ? `/api/library/quizzes/${editId}` : '/api/library/quizzes';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, subject, grade, questions: questionsForApi }),
            });
            if (res.ok) {
                setSaveMsg({ type: 'ok', text: editId ? '✓ Yangilandi!' : '✓ Saqlandi!' });
                setEditId(null); setForm(emptyForm()); loadData();
                setTimeout(() => setSaveMsg(null), 3000);
            } else {
                const d = await res.json();
                setSaveMsg({ type: 'err', text: d.error ?? 'Xatolik yuz berdi' });
            }
        } catch { setSaveMsg({ type: 'err', text: "Server bilan aloqa yo'q" }); }
        finally { setSaving(false); }
    };

    // AI Generate (topic-based)
    const handleAiGenerate = async () => {
        if (!aiTopic.trim()) { setAiMsg({ type: 'err', text: 'Mavzu kiriting' }); return; }
        setAiLoading(true); setAiMsg(null);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: aiTopic, count: aiCount, language: aiLang, timeLimit: 20, provider: aiProvider }),
            });
            const data = await res.json();
            if (!res.ok) {
                setAiMsg({ type: 'err', text: data.rateLimited ? `⏱ Rate limit. Bir oz kuting.` : (data.error ?? 'AI xatoligi') });
                return;
            }
            const converted: Question[] = (data.questions ?? []).map((q: any) => ({
                id: uuidv4(), text: q.text ?? '',
                options: (q.options ?? []).map((o: string, i: number) => ({ text: o, isCorrect: (q.correctOptions ?? [0]).includes(i) })),
                hint: q.hint ?? '',
                imageUrl: '',
                timeLimit: 20,
            }));
            setForm(f => ({ ...f, questions: [...f.questions.filter((q: Question) => q.text), ...converted] }));
            setAiMsg({ type: 'ok', text: `✓ ${converted.length} ta savol qo'shildi` });
            setTimeout(() => setAiMsg(null), 4000);
        } catch { setAiMsg({ type: 'err', text: "Server bilan aloqa yo'q" }); }
        finally { setAiLoading(false); }
    };

    // File import handler
    const handleFileImport = (qs: Question[]) => {
        setForm(f => ({ ...f, questions: [...f.questions.filter((q: Question) => q.text), ...qs] }));
        setActiveTab('manual');
    };

    // Archive / Delete
    const handleArchive = async (quiz: LibraryQuiz) => {
        setActionLoading(quiz.id + '_arch');
        await fetch(`/api/library/quizzes/${quiz.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !quiz.is_active }) });
        setActionLoading(null); loadData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Rostdan ham o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.")) return;
        setActionLoading(id + '_del');
        await fetch(`/api/library/quizzes/${id}`, { method: 'DELETE' });
        setActionLoading(null);
        if (editId === id) cancelEdit();
        loadData();
    };

    if (status === 'loading' || (loading && quizzes.length === 0)) {
        return <div className="flex items-center justify-center min-h-64 text-white/30 font-bold text-lg">Yuklanmoqda...</div>;
    }

    const tabStyle = (t: string) => ({
        background: activeTab === t ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
        color: activeTab === t ? '#60a5fa' : 'rgba(255,255,255,0.4)',
        border: activeTab === t ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.07)',
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/30 text-xs font-black tracking-widest uppercase mb-1">Admin · Kutubxona</p>
                    <h1 className="text-3xl font-black text-white">📚 Library Quizlar</h1>
                </div>
                <a href={`/${locale}/admin`} className="text-white/40 hover:text-white font-bold text-sm transition-colors">← Admin panelga</a>
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

            <div className="flex flex-col xl:flex-row gap-6">

                {/* ── LEFT: Quiz table ──────────────────────────────────────── */}
                <div className="flex-1 min-w-0 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-white/5">
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="🔍 Sarlavha bo'yicha qidirish..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-blue-500/50" />
                        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 font-semibold outline-none cursor-pointer" style={{ colorScheme: 'dark' }}>
                            <option value="Barchasi">Barcha fanlar</option>
                            {SUBJECTS.filter(s => s !== CUSTOM_MARKER).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Sarlavha', 'Fan', 'Sinf', 'Savollar', "O'ynalgan", 'Holat', 'Amallar'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-white/25 font-black text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-10 text-center text-white/25 font-bold">
                                        {search || subjectFilter !== 'Barchasi' ? 'Natija topilmadi' : "Hali quizlar qo'shilmagan"}
                                    </td></tr>
                                ) : filtered.map(quiz => (
                                    <tr key={quiz.id} className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/2"
                                        style={{ background: editId === quiz.id ? 'rgba(59,130,246,0.06)' : undefined }}>
                                        <td className="px-4 py-3 text-white font-bold max-w-[160px] truncate" title={quiz.title}>
                                            {quiz.is_pinned && <span className="text-yellow-400 mr-1">📌</span>}
                                            {quiz.is_seasonal && <span className="text-purple-400 mr-1">🌸</span>}
                                            {quiz.title}
                                        </td>
                                        <td className="px-4 py-3 text-white/50 font-semibold whitespace-nowrap">{quiz.subject}</td>
                                        <td className="px-4 py-3 text-white/50 font-semibold whitespace-nowrap">{quiz.grade}</td>
                                        <td className="px-4 py-3 text-white/50 font-semibold text-center">{Array.isArray(quiz.questions) ? quiz.questions.length : 0}</td>
                                        <td className="px-4 py-3 text-white/50 font-semibold text-center">{quiz.play_count}</td>
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

                {/* ── RIGHT: Form panel ─────────────────────────────────────── */}
                <div className="xl:w-[480px] shrink-0 flex flex-col gap-4">

                    {/* Quiz meta card */}
                    <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-black text-base">{editId ? '✏️ Tahrirlash' : '➕ Yangi quiz'}</h2>
                            {editId && <button onClick={cancelEdit} className="text-white/40 hover:text-white text-xs font-bold transition-colors">Bekor qilish ✕</button>}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Sarlavha *</label>
                            <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="Quiz sarlavhasini kiriting..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 font-semibold outline-none focus:border-blue-500/50" />
                        </div>

                        {/* Subject + Grade */}
                        <div className="grid grid-cols-2 gap-3">
                            <SelectOrType label="Fan *" options={SUBJECTS} value={form.subject} customValue={form.subjectCustom}
                                onSelect={v => setField('subject', v)} onCustom={v => setField('subjectCustom', v)} />
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Sinf</label>
                                <select value={form.grade} onChange={e => setField('grade', e.target.value)}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                    style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                                    <optgroup label="Maktab">{GRADES_SCHOOL.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
                                    <optgroup label="Oliy ta'lim">{GRADES_HIGHER.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
                                    <optgroup label="Boshqa">{GRADES_OTHER.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
                                </select>
                                {form.grade === CUSTOM_MARKER && (
                                    <input value={form.gradeCustom} onChange={e => setField('gradeCustom', e.target.value)}
                                        placeholder="O'zingiz yozing..." autoFocus
                                        className="w-full mt-1.5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none"
                                        style={{ background: '#0d1a2e', border: '1px solid rgba(59,130,246,0.4)' }} />
                                )}
                            </div>
                        </div>

                        {/* Game type + Badge */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">O&apos;yin turi</label>
                                <select value={form.game_type} onChange={e => setField('game_type', e.target.value)}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                    style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                                    {GAME_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Badge</label>
                                <select value={form.badge_type} onChange={e => setField('badge_type', e.target.value)}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                    style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                                    {BADGE_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-3">
                            {[{ key: 'is_pinned', label: '📌 Pinlangan', hint: 'Karuselda 1-slot' }, { key: 'is_seasonal', label: '🌸 Mavsum', hint: 'Karuselda oxirgi slot' }].map(({ key, label, hint }) => (
                                <button key={key} type="button" onClick={() => setField(key, !(form as any)[key])}
                                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-black transition-all"
                                    style={{ background: (form as any)[key] ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', color: (form as any)[key] ? '#60a5fa' : 'rgba(255,255,255,0.35)', border: (form as any)[key] ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
                                    <span>{label}</span>
                                    <span className="text-[10px] opacity-60">{hint}</span>
                                </button>
                            ))}
                        </div>

                        {/* Save */}
                        {saveMsg && (
                            <div className="px-4 py-2.5 rounded-xl text-sm font-bold text-center" style={saveMsg.type === 'ok' ? { background: 'rgba(0,230,118,0.12)', color: '#00E676' } : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                {saveMsg.text}
                            </div>
                        )}
                        <button onClick={handleSave} disabled={saving}
                            className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white' }}>
                            {saving ? '⏳ Saqlanmoqda...' : editId ? '💾 Yangilash' : '💾 Saqlash'}
                        </button>
                    </div>

                    {/* AI Provider toggle */}
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                        <button onClick={() => setAiProvider('groq')}
                            className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${aiProvider === 'groq' ? 'bg-[#0056b3] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                            🚀 Zukkoo AI (Oson)
                        </button>
                        <button onClick={() => setAiProvider('gemini')}
                            className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${aiProvider === 'gemini' ? 'bg-[#d81b60] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                            ✨ Zukkoo AI (Qiyin)
                        </button>
                    </div>

                    {/* Tab switcher */}
                    <div className="grid grid-cols-3 gap-2">
                        {([
                            { k: 'ai-topic', label: '🤖 Mavzu bilan' },
                            { k: 'ai-file', label: '📄 Fayl orqali' },
                            { k: 'manual', label: '✍️ Qo\'lda' },
                        ] as const).map(tab => (
                            <button key={tab.k} onClick={() => setActiveTab(tab.k)}
                                className="py-2.5 rounded-xl text-xs font-black transition-all"
                                style={tabStyle(tab.k)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* AI Topic generate */}
                    {activeTab === 'ai-topic' && (
                        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Mavzu / Fan</label>
                                <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                                    placeholder="Masalan: Fotosintez jarayoni, Kvadrat tenglama..."
                                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 font-semibold outline-none focus:border-purple-500/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Savollar soni</label>
                                    <select value={aiCount} onChange={e => setAiCount(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                        style={{ colorScheme: 'dark' }}>
                                        {[3, 5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} ta</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Til</label>
                                    <select value={aiLang} onChange={e => setAiLang(e.target.value as 'uz'|'ru'|'en')}
                                        className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none cursor-pointer"
                                        style={{ colorScheme: 'dark' }}>
                                        <option value="uz">🇺🇿 O&apos;zbek</option>
                                        <option value="ru">🇷🇺 Rus</option>
                                        <option value="en">🇬🇧 English</option>
                                    </select>
                                </div>
                            </div>
                            {aiMsg && <div className="px-4 py-2.5 rounded-xl text-xs font-bold text-center" style={aiMsg.type === 'ok' ? { background: 'rgba(0,230,118,0.12)', color: '#00E676' } : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>{aiMsg.text}</div>}
                            <button onClick={handleAiGenerate} disabled={aiLoading}
                                className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: aiLoading ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }}>
                                {aiLoading ? '⏳ AI yaratyapti...' : '✨ AI bilan yaratish'}
                            </button>
                        </div>
                    )}

                    {/* File upload */}
                    {activeTab === 'ai-file' && (
                        <FileUploadSection onImport={handleFileImport} aiProvider={aiProvider} setAiProvider={setAiProvider} />
                    )}

                    {/* Questions list (manual & review) */}
                    {activeTab === 'manual' && (
                        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center justify-between">
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider">Savollar ({form.questions.length})</label>
                                <button onClick={addQuestion} className="text-xs font-black px-3 py-1.5 rounded-lg transition-all hover:scale-105" style={{ background: 'rgba(0,230,118,0.12)', color: '#00E676' }}>
                                    + Savol qo&apos;shish
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                                {form.questions.map((q: Question, i: number) => (
                                    <QuestionCard key={q.id} q={q} idx={i} total={form.questions.length}
                                        onChange={updated => updateQuestion(i, updated)}
                                        onRemove={() => removeQuestion(i)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* If ai-generated qs exist, also show count */}
                    {activeTab !== 'manual' && form.questions.filter((q: Question) => q.text).length > 0 && (
                        <button onClick={() => setActiveTab('manual')}
                            className="w-full py-2.5 rounded-xl text-xs font-black transition-all hover:scale-[1.02]"
                            style={{ background: 'rgba(0,230,118,0.08)', color: '#00E676', border: '1px solid rgba(0,230,118,0.15)' }}>
                            ✅ {form.questions.filter((q: Question) => q.text).length} ta savol tayyor — Ko&apos;rish va tahrirlash →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
