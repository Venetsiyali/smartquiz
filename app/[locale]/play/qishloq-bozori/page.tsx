'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

interface TeamConfig { name: string }

type AddTab = 'bank' | 'ai' | 'manual';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARACTERS = [
    { id: 'polvon',  name: 'Polvon Aka',   desc: '1–4 sinf · Matematika, Ona tili',         img: '/game/polvon.png',  bg: '#fef3c7' },
    { id: 'nilufar', name: 'Dr. Nilufar',   desc: '5–8 sinf · Biologiya, Fizika, Kimyo',      img: '/game/nilufar.png', bg: '#dbeafe' },
    { id: 'mirzo',   name: 'Bobur Mirzo',   desc: '9–11 sinf · Tarix, Adabiyot',              img: '/game/mirzo.png',   bg: '#ede9fe' },
    { id: 'kamola',  name: 'Kamola',        desc: 'Barcha sinf · Ingliz tili, Geografiya',    img: '/game/kamola.png',  bg: '#dcfce7' },
];

const TEAM_COLORS      = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
const TEAM_COLOR_NAMES = ["Qizil", "Ko'k", "Yashil", "Sariq"];
const LABELS           = ['A', 'B', 'C', 'D'];

const AI_SUBJECTS = [
    'Barcha', 'Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix',
    "O'zbek tili", 'Ingliz tili', 'Geografiya', 'Informatika', 'Adabiyot',
];

const INP = "w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder-white/20 outline-none";
const INP_S = { background: '#0d1a2e', border: '1px solid rgba(245,158,11,0.25)' };

// ─── Setup Page ───────────────────────────────────────────────────────────────

export default function QishloqBozoriSetup() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) ?? 'uz';

    const [character,    setCharacter]    = useState('polvon');
    const [teamCount,    setTeamCount]    = useState(2);
    const [teams,        setTeams]        = useState<TeamConfig[]>([
        { name: 'Sherlar' }, { name: 'Burgutlar' }, { name: 'Qoplanlar' }, { name: 'Tulkilar' },
    ]);
    const [timePerQ,     setTimePerQ]     = useState(20);
    const [questionCount,setQuestionCount]= useState(15);
    const [economyOn,    setEconomyOn]    = useState(true);
    const [questions,    setQuestions]    = useState<Question[]>([]);
    const [editingQ,     setEditingQ]     = useState<number | null>(null);
    const [creating,     setCreating]     = useState(false);
    const [createErr,    setCreateErr]    = useState('');

    // Tab state
    const [addTab, setAddTab] = useState<AddTab>('bank');

    // ── Bank tab state ───────────────────────────────────────────────────────
    const [bankLoading,  setBankLoading]  = useState(false);
    const [bankAll,      setBankAll]      = useState<(Question & { subject: string })[]>([]);
    const [bankSubjects, setBankSubjects] = useState<string[]>([]);
    const [bankFilter,   setBankFilter]   = useState('Barcha');
    const [bankSelected, setBankSelected] = useState<Set<number>>(new Set());

    // ── AI tab state ─────────────────────────────────────────────────────────
    const [topic,        setTopic]        = useState('');
    const [aiSubject,    setAiSubject]    = useState('Barcha');
    const [aiLang,       setAiLang]       = useState<'uz'|'ru'|'en'>('uz');
    const [generating,   setGenerating]   = useState(false);
    const [genMsg,       setGenMsg]       = useState<{type:'ok'|'err';text:string}|null>(null);

    // ── Manual tab state ─────────────────────────────────────────────────────
    const [manualQ,      setManualQ]      = useState('');
    const [manualOpts,   setManualOpts]   = useState(['','','','']);
    const [manualCorrect,setManualCorrect]= useState(0);
    const [manualExp,    setManualExp]    = useState('');

    // ── Load bank on mount ───────────────────────────────────────────────────
    useEffect(() => {
        setBankLoading(true);
        fetch('/api/game/bozor/question-bank')
            .then(r => r.json())
            .then(d => {
                setBankAll(d.questions ?? []);
                setBankSubjects(['Barcha', ...(d.subjects ?? [])]);
            })
            .catch(() => {})
            .finally(() => setBankLoading(false));
    }, []);

    const updateTeamName = (i: number, name: string) =>
        setTeams(prev => prev.map((t, j) => j === i ? { ...t, name } : t));

    const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, j) => j !== i));
    const updateQuestion = (i: number, field: keyof Question, value: unknown) =>
        setQuestions(prev => prev.map((q, j) => j === i ? { ...q, [field]: value } : q));

    // ── Bank: add selected ───────────────────────────────────────────────────
    const bankFiltered = bankFilter === 'Barcha'
        ? bankAll
        : bankAll.filter((q: any) => q.subject === bankFilter);

    const handleAddFromBank = () => {
        const toAdd = [...bankSelected].map(i => {
            const { subject: _s, ...rest } = bankFiltered[i] as any;
            return rest as Question;
        });
        setQuestions(prev => [...prev, ...toAdd]);
        setBankSelected(new Set());
    };

    const toggleBankSelect = (i: number) => {
        setBankSelected(prev => {
            const s = new Set(prev);
            s.has(i) ? s.delete(i) : s.add(i);
            return s;
        });
    };

    const selectAllBank = () => {
        if (bankSelected.size === bankFiltered.length) {
            setBankSelected(new Set());
        } else {
            setBankSelected(new Set(bankFiltered.map((_, i) => i)));
        }
    };

    // ── AI generate ─────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!topic.trim()) { setGenMsg({ type: 'err', text: 'Mavzu kiriting' }); return; }
        setGenerating(true); setGenMsg(null);
        try {
            const topicFull = aiSubject !== 'Barcha' ? `${aiSubject}: ${topic}` : topic;
            const res = await fetch('/api/ai/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topicFull, count: questionCount, language: aiLang, timeLimit: timePerQ }),
            });
            const data = await res.json();
            if (!res.ok) { setGenMsg({ type: 'err', text: data.error ?? 'AI xatoligi' }); return; }
            const converted: Question[] = (data.questions ?? []).map((q: any) => ({
                text: q.text ?? '',
                options: q.options ?? [],
                correctIndex: (q.correctOptions ?? [0])[0],
                explanation: q.explanation ?? '',
            }));
            setQuestions(prev => [...prev, ...converted]);
            setGenMsg({ type: 'ok', text: `✓ ${converted.length} ta savol qo'shildi` });
            setTimeout(() => setGenMsg(null), 4000);
        } catch { setGenMsg({ type: 'err', text: 'Server xatoligi' }); }
        finally { setGenerating(false); }
    };

    // ── Manual add ───────────────────────────────────────────────────────────
    const handleManualAdd = () => {
        if (!manualQ.trim()) return;
        if (manualOpts.some(o => !o.trim())) return;
        setQuestions(prev => [...prev, {
            text: manualQ.trim(),
            options: manualOpts.map(o => o.trim()),
            correctIndex: manualCorrect,
            explanation: manualExp.trim() || undefined,
        }]);
        setManualQ(''); setManualOpts(['','','','']); setManualCorrect(0); setManualExp('');
    };

    // ── Start game ───────────────────────────────────────────────────────────
    const handleStart = async () => {
        if (questions.length === 0) { setCreateErr("Kamida 1 ta savol bo'lishi shart"); return; }
        setCreating(true); setCreateErr('');
        try {
            const res = await fetch('/api/game/bozor/sessions', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character, teamCount, teams: teams.slice(0, teamCount), timePerQ, economyOn, questions }),
            });
            const data = await res.json();
            if (!res.ok) { setCreateErr(data.error ?? 'Xatolik'); return; }
            router.push(`/${locale}/play/qishloq-bozori/${data.id}`);
        } catch { setCreateErr("Server bilan aloqa yo'q"); }
        finally { setCreating(false); }
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #2d1500 50%, #1a0a00 100%)' }}>
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)' }} />

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-5xl font-black tracking-tight mb-2" style={{ color: '#f59e0b', textShadow: '0 0 40px rgba(245,158,11,0.4)' }}>
                        🏪 Qishloq Bozori
                    </h1>
                    <p className="text-white/50 font-semibold">Interaktiv o&apos;yin sozlamasi — o&apos;qituvchi paneli</p>
                </div>

                {/* ── 1. Character ─────────────────────────────────────────── */}
                <Section title="1. Personaj tanlash">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CHARACTERS.map(ch => (
                            <button key={ch.id} onClick={() => setCharacter(ch.id)}
                                className="rounded-2xl p-3 flex flex-col items-center gap-2 transition-all active:scale-95"
                                style={{
                                    background: character === ch.id ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: character === ch.id ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.08)',
                                    boxShadow: character === ch.id ? '0 0 20px rgba(245,158,11,0.3)' : 'none',
                                }}>
                                <div className="w-20 h-20 rounded-xl overflow-hidden relative" style={{ background: ch.bg }}>
                                    <Image src={ch.img} alt={ch.name} fill className="object-contain object-bottom" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-sm text-white">{ch.name}</p>
                                    <p className="text-white/40 text-[10px] font-semibold mt-0.5">{ch.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </Section>

                {/* ── 2. Teams ─────────────────────────────────────────────── */}
                <Section title="2. Jamoalar">
                    <div className="flex gap-2 mb-4">
                        {[2, 3, 4].map(n => (
                            <button key={n} onClick={() => setTeamCount(n)}
                                className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
                                style={{ background: teamCount === n ? '#f59e0b' : 'rgba(255,255,255,0.06)', color: teamCount === n ? '#1a0a00' : 'rgba(255,255,255,0.5)' }}>
                                {n} Jamoa
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Array.from({ length: teamCount }).map((_, i) => (
                            <div key={i} className="rounded-xl p-3 flex flex-col gap-2"
                                style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${TEAM_COLORS[i]}40` }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TEAM_COLORS[i] }} />
                                    <span className="text-white/40 text-xs font-black uppercase">{TEAM_COLOR_NAMES[i]}</span>
                                </div>
                                <input value={teams[i]?.name ?? ''} onChange={e => updateTeamName(i, e.target.value)}
                                    placeholder={`${i + 1}-jamoa`}
                                    className="w-full rounded-lg px-3 py-2 text-sm font-bold text-white placeholder-white/20 outline-none"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${TEAM_COLORS[i]}30` }} />
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── 3. Settings ──────────────────────────────────────────── */}
                <Section title="3. O'yin sozlamalari">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-2">Savol soni</label>
                            <div className="flex gap-2 flex-wrap">
                                {[10, 15, 20, 30].map(n => (
                                    <button key={n} onClick={() => setQuestionCount(n)}
                                        className="flex-1 py-2 rounded-xl font-black text-sm transition-all active:scale-95 min-w-[48px]"
                                        style={{ background: questionCount === n ? '#f59e0b' : 'rgba(255,255,255,0.06)', color: questionCount === n ? '#1a0a00' : 'rgba(255,255,255,0.5)' }}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-2">Savol vaqti</label>
                            <div className="flex gap-2 flex-wrap">
                                {[10, 15, 20, 30].map(n => (
                                    <button key={n} onClick={() => setTimePerQ(n)}
                                        className="flex-1 py-2 rounded-xl font-black text-sm transition-all active:scale-95 min-w-[48px]"
                                        style={{ background: timePerQ === n ? '#f59e0b' : 'rgba(255,255,255,0.06)', color: timePerQ === n ? '#1a0a00' : 'rgba(255,255,255,0.5)' }}>
                                        {n}s
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-2">Virtual iqtisodiyot</label>
                            <button onClick={() => setEconomyOn(!economyOn)}
                                className="w-full py-2 rounded-xl font-black text-sm transition-all active:scale-95"
                                style={{ background: economyOn ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', color: economyOn ? '#22c55e' : 'rgba(255,255,255,0.4)', border: economyOn ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
                                {economyOn ? "✅ Yoqilgan" : "⬜ O'chirilgan"}
                            </button>
                        </div>
                    </div>
                </Section>

                {/* ── 4. Question Add (3 tabs) ──────────────────────────────── */}
                <Section title="4. Savollar qo'shish">
                    {/* Tab switcher */}
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        {([
                            { key: 'bank',   label: '📚 Savol ombori',   color: '#f59e0b' },
                            { key: 'ai',     label: '🤖 AI bilan',        color: '#8b5cf6' },
                            { key: 'manual', label: '✏️  Qo\'lda yozish', color: '#22c55e' },
                        ] as const).map(tab => (
                            <button key={tab.key} onClick={() => setAddTab(tab.key)}
                                className="flex-1 py-2.5 rounded-lg font-black text-sm transition-all"
                                style={addTab === tab.key
                                    ? { background: tab.color, color: '#1a0a00' }
                                    : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── TAB: Savol ombori ─────────────────────────────────── */}
                    {addTab === 'bank' && (
                        <div className="flex flex-col gap-3">
                            {/* Subject filter */}
                            <div className="flex gap-2 flex-wrap">
                                {bankSubjects.map(s => (
                                    <button key={s} onClick={() => { setBankFilter(s); setBankSelected(new Set()); }}
                                        className="px-3 py-1.5 rounded-xl font-black text-xs transition-all"
                                        style={bankFilter === s
                                            ? { background: '#f59e0b', color: '#1a0a00' }
                                            : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Select all + add button */}
                            <div className="flex items-center gap-3">
                                <button onClick={selectAllBank}
                                    className="px-3 py-1.5 rounded-xl font-black text-xs transition-all"
                                    style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                                    {bankSelected.size === bankFiltered.length && bankFiltered.length > 0 ? '✕ Bekor' : '✓ Hammasini'}
                                </button>
                                <span className="text-white/30 text-xs font-semibold flex-1">
                                    {bankFiltered.length} ta savol · {bankSelected.size} tanlandi
                                </span>
                                <button onClick={handleAddFromBank} disabled={bankSelected.size === 0}
                                    className="px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-30"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#1a0a00' }}>
                                    + Qo&apos;shish ({bankSelected.size})
                                </button>
                            </div>

                            {/* Questions list */}
                            {bankLoading ? (
                                <div className="text-center py-6 text-white/30 font-bold">⏳ Yuklanmoqda...</div>
                            ) : bankFiltered.length === 0 ? (
                                <div className="text-center py-6 text-white/30 font-bold">Savol topilmadi</div>
                            ) : (
                                <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
                                    {bankFiltered.map((q, i) => (
                                        <button key={i} onClick={() => toggleBankSelect(i)}
                                            className="flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all"
                                            style={{
                                                background: bankSelected.has(i) ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                                                border: bankSelected.has(i) ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.07)',
                                            }}>
                                            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: bankSelected.has(i) ? '#f59e0b' : 'rgba(255,255,255,0.1)', border: bankSelected.has(i) ? 'none' : '1px solid rgba(255,255,255,0.2)' }}>
                                                {bankSelected.has(i) && <span className="text-[10px] font-black text-black">✓</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-black px-1.5 py-0.5 rounded mr-2"
                                                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                                                    {(q as any).subject}
                                                </span>
                                                <p className="text-white text-sm font-semibold leading-snug mt-1">{q.text}</p>
                                                <div className="flex flex-wrap gap-x-3 mt-1">
                                                    {q.options.map((opt, oi) => (
                                                        <span key={oi} className="text-xs font-semibold"
                                                            style={{ color: oi === q.correctIndex ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                                                            {LABELS[oi]}: {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB: AI bilan ─────────────────────────────────────── */}
                    {addTab === 'ai' && (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Mavzu</label>
                                    <input value={topic} onChange={e => setTopic(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                                        placeholder="Masalan: Fotosintez, Ikkinchi jahon urushi..."
                                        className={INP} style={INP_S} />
                                </div>
                                <div>
                                    <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Fan</label>
                                    <select value={aiSubject} onChange={e => setAiSubject(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white outline-none cursor-pointer"
                                        style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                                        {AI_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center">
                                <select value={aiLang} onChange={e => setAiLang(e.target.value as 'uz'|'ru'|'en')}
                                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white outline-none cursor-pointer"
                                    style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                                    <option value="uz">🇺🇿 O&apos;zbek</option>
                                    <option value="ru">🇷🇺 Rus</option>
                                    <option value="en">🇬🇧 English</option>
                                </select>
                                <button onClick={handleGenerate} disabled={generating}
                                    className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white' }}>
                                    {generating ? '⏳ AI yaratyapti...' : `✨ ${questionCount} ta savol yaratish`}
                                </button>
                            </div>
                            {genMsg && (
                                <div className="px-4 py-2.5 rounded-xl text-sm font-bold"
                                    style={genMsg.type === 'ok'
                                        ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                                        : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                    {genMsg.text}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB: Qo'lda yozish ───────────────────────────────── */}
                    {addTab === 'manual' && (
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Savol matni</label>
                                <textarea value={manualQ} onChange={e => setManualQ(e.target.value)} rows={2}
                                    placeholder="Savolni shu yerga yozing..."
                                    className={INP + ' resize-none'} style={INP_S} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {manualOpts.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <button onClick={() => setManualCorrect(i)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 transition-all"
                                            style={manualCorrect === i
                                                ? { background: 'rgba(34,197,94,0.3)', color: '#22c55e', border: '2px solid #22c55e' }
                                                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                            {LABELS[i]}
                                        </button>
                                        <input value={opt} onChange={e => {
                                            const o = [...manualOpts]; o[i] = e.target.value; setManualOpts(o);
                                        }}
                                            placeholder={`${LABELS[i]} variant`}
                                            className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-white placeholder-white/20 outline-none"
                                            style={manualCorrect === i
                                                ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.4)' }
                                                : { background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">
                                    Izoh (ixtiyoriy)
                                </label>
                                <input value={manualExp} onChange={e => setManualExp(e.target.value)}
                                    placeholder="To'g'ri javob haqida qisqacha izoh..."
                                    className={INP} style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/30 text-xs font-semibold">
                                    ✓ tugmani bosib to&apos;g&apos;ri javobni belgilang
                                </span>
                                <button onClick={handleManualAdd}
                                    disabled={!manualQ.trim() || manualOpts.some(o => !o.trim())}
                                    className="ml-auto px-6 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-30"
                                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white' }}>
                                    + Savolni qo&apos;shish
                                </button>
                            </div>
                        </div>
                    )}
                </Section>

                {/* ── 5. Questions list ─────────────────────────────────────── */}
                {questions.length > 0 && (
                    <Section title={`5. O'yin savollari (${questions.length} ta)`}>
                        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                            {questions.map((q, i) => (
                                <div key={i} className="rounded-xl p-3 flex flex-col gap-2"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    {editingQ === i ? (
                                        <>
                                            <textarea value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)}
                                                rows={2} className="w-full rounded-lg px-3 py-2 text-sm text-white font-semibold outline-none resize-none"
                                                style={{ background: '#0d1a2e', border: '1px solid rgba(245,158,11,0.3)' }} />
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2">
                                                    <span className="text-xs font-black w-5 text-center flex-shrink-0"
                                                        style={{ color: oi === q.correctIndex ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                                                        {LABELS[oi]}
                                                    </span>
                                                    <input value={opt}
                                                        onChange={e => { const o = [...q.options]; o[oi] = e.target.value; updateQuestion(i, 'options', o); }}
                                                        className="flex-1 rounded-lg px-3 py-1.5 text-xs text-white font-semibold outline-none"
                                                        style={{ background: '#0d1a2e', border: `1px solid ${oi === q.correctIndex ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}` }} />
                                                    <button onClick={() => updateQuestion(i, 'correctIndex', oi)}
                                                        className="text-xs px-2 py-1 rounded-lg font-black"
                                                        style={{ background: oi === q.correctIndex ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color: oi === q.correctIndex ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                                                        ✓
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setEditingQ(null)}
                                                className="text-xs font-black px-3 py-1.5 rounded-lg self-end"
                                                style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                                                Saqlash ✓
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <span className="text-white/25 text-xs font-black w-6 flex-shrink-0 mt-0.5">{i + 1}.</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold leading-snug">{q.text}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                                    {q.options.map((opt, oi) => (
                                                        <span key={oi} className="text-xs font-semibold"
                                                            style={{ color: oi === q.correctIndex ? '#22c55e' : 'rgba(255,255,255,0.35)' }}>
                                                            {LABELS[oi]}: {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <button onClick={() => setEditingQ(i)} className="text-xs px-2 py-1 rounded-lg font-black"
                                                    style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>✏️</button>
                                                <button onClick={() => removeQuestion(i)} className="text-xs px-2 py-1 rounded-lg font-black"
                                                    style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>✕</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ── Start Button ─────────────────────────────────────────── */}
                <div className="pb-8">
                    {createErr && (
                        <div className="mb-3 px-4 py-3 rounded-xl text-sm font-bold text-center"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                            {createErr}
                        </div>
                    )}
                    <button onClick={handleStart} disabled={creating || questions.length === 0}
                        className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: questions.length > 0 ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : 'rgba(255,255,255,0.06)',
                            color: 'white',
                            boxShadow: questions.length > 0 ? '0 0 40px rgba(245,158,11,0.3)' : 'none',
                        }}>
                        {creating ? "⏳ O'yin yaratilmoqda..." : `🏪 O'yinni Boshlash (${questions.length} savol)`}
                    </button>
                    {questions.length === 0 && (
                        <p className="text-center text-white/30 text-sm font-semibold mt-2">
                            Ombor, AI yoki qo&apos;lda savollar qo&apos;shing
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <h2 className="font-black text-base tracking-wide" style={{ color: '#f59e0b' }}>{title}</h2>
            {children}
        </div>
    );
}
