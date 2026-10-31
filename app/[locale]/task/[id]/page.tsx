'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playerOrder } from '@/lib/engRace';
import type { AudBlock } from '@/lib/psixolab/auditoriya';
import Blocks from '@/components/psixolab/Blocks';
import { audUi, fillN } from '@/components/psixolab/audI18n';

interface PublicTask {
    id: string; lang: 'uz' | 'ru'; topicId: string; title: string;
    explain: AudBlock[]; concepts: string[];
    tests: { q: string; options: string[] }[];
    pairs: { left: string[]; right: string[] };
    caseTask: string;
}
interface Result { test: { answers: number[]; correct: number; max: number }; match: { score: number; max: number; mistakes: number }; correctAnswers: number[] }

const field = 'w-full bg-white/5 border-2 border-white/10 rounded-2xl px-4 py-3 text-lg text-white placeholder-white/30 font-bold outline-none focus:border-violet-400';
const store = {
    get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

export default function TaskPage() {
    const { id } = useParams<{ id: string }>();
    const [task, setTask] = useState<PublicTask | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(0);              // 0 kirish, 1 tushuntirish, 2 test, 3 moslashtirish, 4 keys, 5 natija
    const [name, setName] = useState('');
    const [group, setGroup] = useState('');
    const [startedAt, setStartedAt] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [attempts, setAttempts] = useState<[number, number][]>([]);
    const [matchTime, setMatchTime] = useState(0);
    const [caseText, setCaseText] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<Result | null>(null);

    useEffect(() => {
        fetch(`/api/task/get?id=${id}`, { cache: 'no-store' }).then(r => r.json())
            .then(d => d.task ? setTask(d.task) : setError('notFound')).catch(() => setError('notFound'));
        const done = store.get(`task-${id}-result`);
        if (done) { try { setResult(JSON.parse(done)); setStep(5); } catch { /* ignore */ } }
        setName(store.get('task-name') ?? ''); setGroup(store.get('task-group') ?? '');
    }, [id]);

    const ui = audUi(task?.lang);

    // Har bir talabada variantlar oʻz tartibida (ism + topshiriq boʻyicha barqaror)
    const orders = useMemo(() => task?.tests.map((t, i) => playerOrder(`${id}:${name}:${i}`, t.options.length)) ?? [], [task, id, name]);

    const submit = async () => {
        if (!task) return;
        setBusy(true);
        try {
            const res = await fetch('/api/task/submit', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, group, startedAt, testAnswers: answers, matchAttempts: attempts, matchTimeSec: matchTime, caseText }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResult(data); setStep(5);
            store.set(`task-${id}-result`, JSON.stringify(data));
        } catch (e: any) { alert(e.message || 'Error'); } finally { setBusy(false); }
    };

    if (error) return <Screen><p className="text-5xl">🔍</p><p className="font-black text-xl">{ui.notFound}</p></Screen>;
    if (!task) return <Screen><p className="animate-pulse text-white/50 font-bold">⏳</p></Screen>;

    return (
        <div className="min-h-screen bg-[#0b0a1f] text-white px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-5">
                <div>
                    <p className="text-violet-300 text-xs font-black uppercase tracking-widest">🎓 {ui.section} · {task.topicId}</p>
                    <h1 className="text-2xl font-black mt-1">{task.title}</h1>
                    {step >= 1 && step <= 4 && <p className="text-white/40 text-sm font-bold mt-1">{fillN(ui.step, step)}</p>}
                </div>

                {step === 0 && (
                    <div className="space-y-3">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder={ui.enterName} className={field} maxLength={80} />
                        <input value={group} onChange={e => setGroup(e.target.value)} placeholder={ui.enterGroup} className={field} maxLength={30} />
                        <Btn disabled={name.trim().length < 3 || !group.trim()} onClick={() => {
                            store.set('task-name', name.trim()); store.set('task-group', group.trim());
                            setStartedAt(Date.now()); setAnswers(task.tests.map(() => -1)); setStep(1);
                        }}>{ui.start}</Btn>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black">📖 {ui.explain}</h2>
                        <Blocks blocks={task.explain} />
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs text-white/40 font-black mr-1 self-center">{ui.concepts}:</span>
                            {task.concepts.map(c => <span key={c} className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-200 text-xs font-bold">{c}</span>)}
                        </div>
                        <Btn onClick={() => setStep(2)}>{ui.next}</Btn>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        {task.tests.map((t, i) => (
                            <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2">
                                <p className="font-black">{i + 1}. {t.q}</p>
                                {orders[i].map((ci, k) => (
                                    <button key={ci} onClick={() => setAnswers(a => a.map((x, j) => (j === i ? ci : x)))}
                                        className={`w-full text-left px-4 py-3 rounded-xl font-bold border-2 transition-colors ${answers[i] === ci ? 'border-violet-400 bg-violet-500/20' : 'border-white/10 bg-white/5'}`}>
                                        <span className="text-white/40 mr-2">{'ABCD'[k]})</span>{t.options[ci]}
                                    </button>
                                ))}
                            </div>
                        ))}
                        {answers.includes(-1) && <p className="text-yellow-300/80 text-sm font-bold">{ui.answerAll}</p>}
                        <Btn disabled={answers.includes(-1)} onClick={() => setStep(3)}>{ui.next}</Btn>
                    </div>
                )}

                {step === 3 && (
                    <MatchStep left={task.pairs.left} right={task.pairs.right} seed={`${id}:${name}`} ui={ui}
                        onDone={(att, sec) => { setAttempts(att); setMatchTime(sec); setStep(4); }} />
                )}

                {step === 4 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-black">✍️ {ui.caseCol}</h2>
                        <p className="text-white/85 leading-relaxed rounded-2xl bg-white/[0.04] border border-white/10 p-4">{task.caseTask}</p>
                        <textarea value={caseText} onChange={e => setCaseText(e.target.value)} rows={9} placeholder={ui.caseHint}
                            className={`${field} text-base font-semibold resize-y`} />
                        <Btn disabled={busy || caseText.trim().length < 10} onClick={submit}>{busy ? ui.submitting : ui.submit}</Btn>
                    </div>
                )}

                {step === 5 && result && (
                    <div className="space-y-4">
                        <div className="text-center space-y-2">
                            <p className="text-6xl">🎉</p>
                            <p className="text-2xl font-black">{ui.done}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Score label={ui.testScore} v={result.test.correct} max={result.test.max} />
                            <Score label={ui.matchScore} v={result.match.score} max={result.match.max} />
                        </div>
                        <p className="text-center text-white/60 font-bold">⏳ {ui.casePending}</p>
                        {/* Test boʻyicha toʻgʻri javoblar — mustaqil oʻrganish uchun */}
                        {task.tests.map((t, i) => {
                            const mine = result.test.answers[i], right = result.correctAnswers[i];
                            return (
                                <div key={i} className={`rounded-xl p-3 text-sm border ${mine === right ? 'border-green-400/40 bg-green-500/10' : 'border-red-400/40 bg-red-500/10'}`}>
                                    <p className="font-black">{mine === right ? '✅' : '❌'} {i + 1}. {t.q}</p>
                                    {mine !== right && <p className="text-white/60 mt-1">{ui.yours}: {t.options[mine] ?? '—'}</p>}
                                    <p className="text-green-300 font-bold mt-0.5">{ui.correctWas}: {t.options[right]}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Moslashtirish: chapdagi elementni, soʻng oʻngdagi taʼrifni bosish (telefonda qulay). */
function MatchStep({ left, right, seed, ui, onDone }: {
    left: string[]; right: string[]; seed: string; ui: ReturnType<typeof audUi>; onDone: (att: [number, number][], sec: number) => void;
}) {
    const rightOrder = useMemo(() => playerOrder(`${seed}:match`, right.length), [seed, right.length]);
    const [sel, setSel] = useState<number | null>(null);
    const [matched, setMatched] = useState<number[]>([]);
    const [wrong, setWrong] = useState<number | null>(null);
    const [att, setAtt] = useState<[number, number][]>([]);
    const start = useRef(Date.now());
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const i = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(i); }, []);
    const mistakes = att.filter(([l, r]) => l !== r).length;

    const pick = (r: number) => {
        if (sel === null || matched.includes(r)) return;
        const next: [number, number][] = [...att, [sel, r]];
        setAtt(next);
        if (sel === r) {
            const m = [...matched, r]; setMatched(m); setSel(null);
            if (m.length === left.length) setTimeout(() => onDone(next, Math.round((Date.now() - start.current) / 1000)), 600);
        } else { setWrong(r); setTimeout(() => setWrong(null), 500); }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between text-sm font-black">
                <span className="text-white/50">{ui.matchHint}</span>
                <span className="shrink-0 ml-3">⏱ {Math.round((now - start.current) / 1000)} s · ❌ {mistakes}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    {left.map((l, i) => (
                        <button key={i} onClick={() => !matched.includes(i) && setSel(i)}
                            className={`w-full min-h-16 px-3 py-2 rounded-xl text-sm font-black text-left border-2 transition-colors ${matched.includes(i) ? 'border-green-400/50 bg-green-500/15 opacity-60' : sel === i ? 'border-violet-400 bg-violet-500/25' : 'border-white/10 bg-white/5'}`}>
                            {l}
                        </button>
                    ))}
                </div>
                <div className="space-y-2">
                    {rightOrder.map(r => (
                        <motion.button key={r} onClick={() => pick(r)} animate={wrong === r ? { x: [0, -6, 6, -4, 0] } : {}}
                            className={`w-full min-h-16 px-3 py-2 rounded-xl text-sm font-bold text-left border-2 transition-colors ${matched.includes(r) ? 'border-green-400/50 bg-green-500/15 opacity-60' : wrong === r ? 'border-red-400 bg-red-500/20' : 'border-white/10 bg-white/5'}`}>
                            {right[r]}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Btn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...p} className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>{children}</button>;
}
function Score({ label, v, max }: { label: string; v: number; max: number }) {
    return (
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 text-center">
            <p className="text-white/50 text-xs font-black">{label}</p>
            <p className="text-4xl font-black text-violet-200">{v}<span className="text-lg text-white/30"> / {max}</span></p>
        </div>
    );
}
function Screen({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-[#0b0a1f] text-white flex flex-col items-center justify-center gap-3 p-6 text-center">{children}</div>;
}
