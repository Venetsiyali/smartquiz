'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

interface TeamConfig {
    name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARACTERS = [
    { id: 'polvon', name: 'Polvon Aka', desc: '1–4 sinf · Matematika, Ona tili', img: '/game/polvon.png', bg: '#fef3c7' },
    { id: 'nilufar', name: 'Dr. Nilufar', desc: '5–8 sinf · Biologiya, Fizika, Kimyo', img: '/game/nilufar.png', bg: '#dbeafe' },
    { id: 'mirzo', name: 'Bobur Mirzo', desc: '9–11 sinf · Tarix, Adabiyot', img: '/game/mirzo.png', bg: '#ede9fe' },
    { id: 'kamola', name: 'Kamola', desc: 'Barcha sinf · Ingliz tili, Geografiya', img: '/game/kamola.png', bg: '#dcfce7' },
];

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
const TEAM_COLOR_NAMES = ["Qizil", "Ko'k", "Yashil", "Sariq"];

const SUBJECTS = [
    'Barcha', 'Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix',
    "O'zbek tili", 'Ingliz tili', 'Geografiya', 'Informatika', 'Adabiyot',
];

// ─── Setup Page ───────────────────────────────────────────────────────────────

export default function QishloqBozoriSetup() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) ?? 'uz';

    // Character
    const [character, setCharacter] = useState('polvon');

    // Teams
    const [teamCount, setTeamCount] = useState(2);
    const [teams, setTeams] = useState<TeamConfig[]>([
        { name: 'Sherlar' },
        { name: 'Burgutlar' },
        { name: 'Qoplanlar' },
        { name: 'Tulkilar' },
    ]);

    // Settings
    const [timePerQ, setTimePerQ] = useState(20);
    const [questionCount, setQuestionCount] = useState(15);
    const [economyOn, setEconomyOn] = useState(true);

    // AI generation
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('Barcha');
    const [aiLang, setAiLang] = useState<'uz' | 'ru' | 'en'>('uz');
    const [generating, setGenerating] = useState(false);
    const [genMsg, setGenMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // Questions
    const [questions, setQuestions] = useState<Question[]>([]);
    const [editingQ, setEditingQ] = useState<number | null>(null);

    // Creating session
    const [creating, setCreating] = useState(false);
    const [createErr, setCreateErr] = useState('');

    const updateTeamName = (i: number, name: string) => {
        setTeams(prev => prev.map((t, j) => j === i ? { ...t, name } : t));
    };

    // ── AI Generate ──────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!topic.trim()) { setGenMsg({ type: 'err', text: 'Mavzu kiriting' }); return; }
        setGenerating(true);
        setGenMsg(null);
        try {
            const topicWithSubject = subject !== 'Barcha' ? `${subject}: ${topic}` : topic;
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topicWithSubject, count: questionCount, language: aiLang, timeLimit: timePerQ }),
            });
            const data = await res.json();
            if (!res.ok) {
                setGenMsg({ type: 'err', text: data.error ?? 'AI xatoligi' });
                return;
            }
            const converted: Question[] = (data.questions ?? []).map((q: any) => ({
                text: q.text ?? '',
                options: q.options ?? [],
                correctIndex: (q.correctOptions ?? [0])[0],
                explanation: q.explanation ?? '',
            }));
            setQuestions(prev => [...prev, ...converted]);
            setGenMsg({ type: 'ok', text: `✓ ${converted.length} ta savol qo'shildi` });
            setTimeout(() => setGenMsg(null), 4000);
        } catch {
            setGenMsg({ type: 'err', text: "Server xatoligi" });
        } finally {
            setGenerating(false);
        }
    };

    const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, j) => j !== i));

    const updateQuestion = (i: number, field: keyof Question, value: unknown) => {
        setQuestions(prev => prev.map((q, j) => j === i ? { ...q, [field]: value } : q));
    };

    // ── Start Game ───────────────────────────────────────────────────────────
    const handleStart = async () => {
        if (questions.length === 0) { setCreateErr("Kamida 1 ta savol bo'lishi shart"); return; }
        setCreating(true);
        setCreateErr('');
        try {
            const res = await fetch('/api/game/bozor/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character,
                    teamCount,
                    teams: teams.slice(0, teamCount),
                    timePerQ,
                    economyOn,
                    questions,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setCreateErr(data.error ?? 'Xatolik'); return; }
            router.push(`/${locale}/play/qishloq-bozori/${data.id}`);
        } catch {
            setCreateErr("Server bilan aloqa yo'q");
        } finally {
            setCreating(false);
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #2d1500 50%, #1a0a00 100%)' }}>
            {/* Decorative top border */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)' }} />

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-5xl font-black tracking-tight mb-2" style={{ color: '#f59e0b', textShadow: '0 0 40px rgba(245,158,11,0.4)' }}>
                        🏪 Qishloq Bozori
                    </h1>
                    <p className="text-white/50 font-semibold">Interaktiv o'yin sozlamasi — o'qituvchi paneli</p>
                </div>

                {/* ── 1. Character ─────────────────────────────────────────── */}
                <Section title="1. Personaj tanlash">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CHARACTERS.map(ch => (
                            <button
                                key={ch.id}
                                onClick={() => setCharacter(ch.id)}
                                className="rounded-2xl p-3 flex flex-col items-center gap-2 transition-all duration-200 active:scale-95"
                                style={{
                                    background: character === ch.id ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: character === ch.id ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.08)',
                                    boxShadow: character === ch.id ? '0 0 20px rgba(245,158,11,0.3)' : 'none',
                                }}
                            >
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
                            <button
                                key={n}
                                onClick={() => setTeamCount(n)}
                                className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
                                style={{
                                    background: teamCount === n ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                                    color: teamCount === n ? '#1a0a00' : 'rgba(255,255,255,0.5)',
                                }}
                            >
                                {n} Jamoa
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Array.from({ length: teamCount }).map((_, i) => (
                            <div key={i} className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${TEAM_COLORS[i]}40` }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TEAM_COLORS[i] }} />
                                    <span className="text-white/40 text-xs font-black uppercase">{TEAM_COLOR_NAMES[i]}</span>
                                </div>
                                <input
                                    value={teams[i]?.name ?? ''}
                                    onChange={e => updateTeamName(i, e.target.value)}
                                    placeholder={`${i + 1}-jamoa`}
                                    className="w-full rounded-lg px-3 py-2 text-sm font-bold text-white placeholder-white/20 outline-none"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${TEAM_COLORS[i]}30` }}
                                />
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── 3. Settings ──────────────────────────────────────────── */}
                <Section title="3. O'yin sozlamalari">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Question count */}
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-2">Savol soni</label>
                            <div className="flex gap-2 flex-wrap">
                                {[10, 15, 20, 30].map(n => (
                                    <button key={n} onClick={() => setQuestionCount(n)} className="flex-1 py-2 rounded-xl font-black text-sm transition-all active:scale-95 min-w-[48px]"
                                        style={{ background: questionCount === n ? '#f59e0b' : 'rgba(255,255,255,0.06)', color: questionCount === n ? '#1a0a00' : 'rgba(255,255,255,0.5)' }}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Time per question */}
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-2">Savol vaqti</label>
                            <div className="flex gap-2 flex-wrap">
                                {[10, 15, 20, 30].map(n => (
                                    <button key={n} onClick={() => setTimePerQ(n)} className="flex-1 py-2 rounded-xl font-black text-sm transition-all active:scale-95 min-w-[48px]"
                                        style={{ background: timePerQ === n ? '#f59e0b' : 'rgba(255,255,255,0.06)', color: timePerQ === n ? '#1a0a00' : 'rgba(255,255,255,0.5)' }}>
                                        {n}s
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Economy */}
                        <div>
                            <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-2">Virtual iqtisodiyot</label>
                            <button
                                onClick={() => setEconomyOn(!economyOn)}
                                className="w-full py-2 rounded-xl font-black text-sm transition-all active:scale-95"
                                style={{ background: economyOn ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', color: economyOn ? '#22c55e' : 'rgba(255,255,255,0.4)', border: economyOn ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.08)' }}
                            >
                                {economyOn ? '✅ Yoqilgan' : '⬜ O\'chirilgan'}
                            </button>
                        </div>
                    </div>
                </Section>

                {/* ── 4. AI Questions ──────────────────────────────────────── */}
                <Section title="4. AI bilan savollar yaratish">
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Mavzu</label>
                                <input
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                                    placeholder="Masalan: Fotosintez, Ikkinchi jahon urushi..."
                                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 font-semibold outline-none"
                                    style={{ background: '#0d1a2e', border: '1px solid rgba(245,158,11,0.3)' }}
                                />
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-black uppercase tracking-wider block mb-1.5">Fan</label>
                                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-xl px-3 py-3 text-sm font-semibold text-white outline-none cursor-pointer"
                                    style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <select value={aiLang} onChange={e => setAiLang(e.target.value as 'uz' | 'ru' | 'en')} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white outline-none cursor-pointer"
                                style={{ background: '#0d1a2e', border: '1px solid rgba(255,255,255,0.12)', colorScheme: 'dark' }}>
                                <option value="uz">🇺🇿 O'zbek</option>
                                <option value="ru">🇷🇺 Rus</option>
                                <option value="en">🇬🇧 English</option>
                            </select>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#1a0a00' }}
                            >
                                {generating ? '⏳ AI yaratyapti...' : `✨ ${questionCount} ta savol yaratish`}
                            </button>
                        </div>
                        {genMsg && (
                            <div className="px-4 py-2.5 rounded-xl text-sm font-bold" style={genMsg.type === 'ok' ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e' } : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                                {genMsg.text}
                            </div>
                        )}
                    </div>
                </Section>

                {/* ── 5. Questions list ─────────────────────────────────────── */}
                {questions.length > 0 && (
                    <Section title={`5. Savollar ro'yxati (${questions.length} ta)`}>
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                            {questions.map((q, i) => (
                                <div key={i} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    {editingQ === i ? (
                                        <>
                                            <textarea
                                                value={q.text}
                                                onChange={e => updateQuestion(i, 'text', e.target.value)}
                                                rows={2}
                                                className="w-full rounded-lg px-3 py-2 text-sm text-white font-semibold outline-none resize-none"
                                                style={{ background: '#0d1a2e', border: '1px solid rgba(245,158,11,0.3)' }}
                                            />
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2">
                                                    <span className="text-xs font-black w-6 text-center" style={{ color: oi === q.correctIndex ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                                                        {['A', 'B', 'C', 'D'][oi]}
                                                    </span>
                                                    <input
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOpts = [...q.options];
                                                            newOpts[oi] = e.target.value;
                                                            updateQuestion(i, 'options', newOpts);
                                                        }}
                                                        className="flex-1 rounded-lg px-3 py-1.5 text-xs text-white font-semibold outline-none"
                                                        style={{ background: '#0d1a2e', border: `1px solid ${oi === q.correctIndex ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}` }}
                                                    />
                                                    <button onClick={() => updateQuestion(i, 'correctIndex', oi)} className="text-xs px-2 py-1 rounded-lg font-black transition-all"
                                                        style={{ background: oi === q.correctIndex ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color: oi === q.correctIndex ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                                                        ✓
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setEditingQ(null)} className="text-xs font-black px-3 py-1.5 rounded-lg self-end" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                                                Saqlash ✓
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <span className="text-white/30 text-xs font-black w-6 flex-shrink-0 mt-0.5">{i + 1}.</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold leading-snug">{q.text}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                                    {q.options.map((opt, oi) => (
                                                        <span key={oi} className="text-xs font-semibold" style={{ color: oi === q.correctIndex ? '#22c55e' : 'rgba(255,255,255,0.35)' }}>
                                                            {['A', 'B', 'C', 'D'][oi]}: {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <button onClick={() => setEditingQ(i)} className="text-xs px-2 py-1 rounded-lg font-black" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>✏️</button>
                                                <button onClick={() => removeQuestion(i)} className="text-xs px-2 py-1 rounded-lg font-black" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>✕</button>
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
                        <div className="mb-3 px-4 py-3 rounded-xl text-sm font-bold text-center" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                            {createErr}
                        </div>
                    )}
                    <button
                        onClick={handleStart}
                        disabled={creating || questions.length === 0}
                        className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: questions.length > 0 ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : 'rgba(255,255,255,0.06)', color: 'white', boxShadow: questions.length > 0 ? '0 0 40px rgba(245,158,11,0.3)' : 'none' }}
                    >
                        {creating ? '⏳ O\'yin yaratilmoqda...' : `🏪 O'yinni Boshlash (${questions.length} savol)`}
                    </button>
                    {questions.length === 0 && (
                        <p className="text-center text-white/30 text-sm font-semibold mt-2">Avval AI bilan savollar yarating</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <h2 className="text-white font-black text-base tracking-wide" style={{ color: '#f59e0b' }}>{title}</h2>
            {children}
        </div>
    );
}
