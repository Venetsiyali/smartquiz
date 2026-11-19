'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

interface Info {
    title: string; description: string; teacherName: string; questionCount: number;
    opensAt: string | null; closesAt: string | null; maxAttempts: number; timePerQuestion: number;
    showAnswers: string; open: boolean; reason: string | null;
}
interface QuestionState {
    finished: false; title: string; position: number; total: number;
    question: { text: string; options: string[] }; timeLeftMs: number | null;
}
interface ReviewItem { text: string; options: string[]; correct: number; selected: number; explanation: string }
interface ResultState {
    finished: true; title: string; studentName: string; correctCount: number; total: number; score: number;
    revealLater: boolean; review: ReviewItem[] | null;
}
type State = QuestionState | ResultState;
interface Saved { id: string; token: string }

const LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['#e11d48', '#1d4ed8', '#ca8a04', '#15803d'];

function deviceId(): string {
    try {
        let id = localStorage.getItem('zk_device_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('zk_device_id', id);
        }
        return id;
    } catch {
        return `tmp-${Math.random().toString(36).slice(2)}${Date.now()}`;
    }
}
const attemptKey = (code: string) => `zk_attempt_${code}`;
function loadSaved(code: string): Saved | null {
    try { return JSON.parse(localStorage.getItem(attemptKey(code)) || 'null'); } catch { return null; }
}
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString('uz-UZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '');

async function fetchJson(url: string, init?: RequestInit, retries = 2): Promise<{ ok: boolean; status: number; data: any }> {
    for (let i = 0; ; i++) {
        try {
            const res = await fetch(url, { cache: 'no-store', ...init });
            return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
        } catch (err) {
            if (i >= retries) throw err;
            await new Promise(r => setTimeout(r, 800 * (i + 1)));
        }
    }
}

export default function AssignmentPage() {
    const { code: rawCode } = useParams<{ code: string }>();
    const code = (rawCode || '').toUpperCase();
    const [info, setInfo] = useState<Info | null>(null);
    const [state, setState] = useState<State | null>(null);
    const [saved, setSaved] = useState<Saved | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [picked, setPicked] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [group, setGroup] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const deadlineRef = useRef<number | null>(null);

    const loadState = useCallback(async (s: Saved) => {
        const r = await fetchJson(`/api/a/attempt/${s.id}`, { headers: { 'x-attempt-token': s.token } });
        if (!r.ok) {
            // Urinish o'chirilgan yoki boshqa qurilma — yangidan boshlanadi
            try { localStorage.removeItem(attemptKey(code)); } catch {}
            setSaved(null);
            return;
        }
        setState(r.data);
    }, [code]);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetchJson(`/api/a/${code}`);
                if (!r.ok) { setError(r.data.error || 'Topshiriq topilmadi'); return; }
                setInfo(r.data);
                try {
                    setName(localStorage.getItem('zk_student_name') || '');
                    setGroup(localStorage.getItem('zk_student_group') || '');
                } catch {}
                const s = loadSaved(code);
                if (s) { setSaved(s); await loadState(s); }
            } catch {
                setError("Internet bilan aloqa yoʻq. Sahifani yangilab koʻring.");
            }
        })();
    }, [code, loadState]);

    // Savol taymeri: server qolgan vaqtni beradi, ekranda sanab boramiz
    useEffect(() => {
        if (state && !state.finished && state.timeLeftMs !== null) {
            deadlineRef.current = Date.now() + state.timeLeftMs;
            setTimeLeft(Math.ceil(state.timeLeftMs / 1000));
        } else {
            deadlineRef.current = null;
            setTimeLeft(null);
        }
        setPicked(null);
    }, [state]);

    useEffect(() => {
        if (deadlineRef.current === null || !saved) return;
        const t = setInterval(() => {
            const left = Math.ceil(((deadlineRef.current ?? 0) - Date.now()) / 1000);
            setTimeLeft(Math.max(0, left));
            if (left <= 0) {
                clearInterval(t);
                loadState(saved); // server vaqti tugagan savolni yozib, keyingisini beradi
            }
        }, 250);
        return () => clearInterval(t);
    }, [state, saved, loadState]);

    const start = async () => {
        if (name.trim().length < 2) { setError('Ismingizni kiriting'); return; }
        setBusy(true);
        setError(null);
        try {
            try {
                localStorage.setItem('zk_student_name', name.trim());
                localStorage.setItem('zk_student_group', group.trim());
            } catch {}
            const r = await fetchJson(`/api/a/${code}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), group: group.trim(), deviceId: deviceId() }),
            });
            if (!r.ok) { setError(r.data.error || 'Boshlab boʻlmadi'); return; }
            const s = { id: r.data.attemptId, token: r.data.token };
            try { localStorage.setItem(attemptKey(code), JSON.stringify(s)); } catch {}
            setSaved(s);
            await loadState(s);
        } catch {
            setError("Internet bilan aloqa yoʻq. Qayta urinib koʻring.");
        } finally {
            setBusy(false);
        }
    };

    const answer = async (i: number) => {
        if (!saved || !state || state.finished || busy) return;
        setPicked(i);
        setBusy(true);
        setError(null);
        try {
            const r = await fetchJson(`/api/a/attempt/${saved.id}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-attempt-token': saved.token },
                body: JSON.stringify({ position: state.position, selected: i }),
            });
            if (!r.ok) { setError(r.data.error || 'Javob yuborilmadi'); await loadState(saved); return; }
            if (r.data.late) setError('Bu savol uchun vaqt tugagan edi — javob qabul qilinmadi.');
            setState(r.data);
        } catch {
            setError("Internet uzildi. Javobingiz saqlanmagan boʻlishi mumkin — qayta bosing.");
            setPicked(null);
        } finally {
            setBusy(false);
        }
    };

    const restart = () => {
        try { localStorage.removeItem(attemptKey(code)); } catch {}
        setSaved(null);
        setState(null);
        setError(null);
    };

    const shell = (children: React.ReactNode) => (
        <div className="min-h-screen bg-zukkoo-dark text-white flex flex-col items-center px-4 py-8">
            <div className="w-full max-w-xl">{children}</div>
            <p className="mt-10 text-white/25 text-xs font-bold">Zukkoo.uz</p>
        </div>
    );

    if (error && !info) return shell(
        <div className="glass rounded-3xl p-8 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-black text-xl mb-2">{error}</p>
            <a href="/v" className="text-blue-300 font-bold underline">Boshqa kod kiritish</a>
        </div>
    );
    if (!info) return shell(<p className="text-center text-white/40 font-bold py-20">Yuklanmoqda...</p>);

    // ── Natija ──
    if (state?.finished) {
        const good = state.score >= 80, mid = state.score >= 55;
        return shell(
            <div className="space-y-5">
                <div className="glass rounded-3xl p-8 text-center">
                    <p className="text-white/50 font-bold text-sm mb-1">{state.title}</p>
                    <div className="text-6xl my-3">{good ? '🏆' : mid ? '👍' : '📚'}</div>
                    <p className="text-5xl font-black" style={{ color: good ? '#00E676' : mid ? '#FFD600' : '#f87171' }}>{state.score}%</p>
                    <p className="text-white/70 font-bold mt-2">{state.total} ta savoldan {state.correctCount} tasi toʻgʻri</p>
                    <p className="text-white/40 text-sm mt-1">{state.studentName}</p>
                    {state.revealLater && <p className="text-amber-300 text-sm font-semibold mt-4">Toʻgʻri javoblar topshiriq muddati tugagach koʻrinadi.</p>}
                </div>
                {state.review && (
                    <div className="space-y-3">
                        {state.review.map((r, i) => (
                            <div key={i} className="glass rounded-2xl p-4">
                                <p className="font-bold mb-2">{i + 1}. {r.text}</p>
                                <div className="space-y-1">
                                    {r.options.map((o, k) => {
                                        const isRight = k === r.correct, isMine = k === r.selected;
                                        return (
                                            <p key={k} className="text-sm rounded-lg px-3 py-1.5" style={{
                                                background: isRight ? 'rgba(0,230,118,0.12)' : isMine ? 'rgba(239,68,68,0.12)' : 'transparent',
                                                color: isRight ? '#6ee7b7' : isMine ? '#fca5a5' : 'rgba(255,255,255,0.55)',
                                            }}>
                                                {LETTERS[k]}) {o} {isRight ? '✓' : isMine ? '✕' : ''}
                                            </p>
                                        );
                                    })}
                                    {r.selected === -1 && <p className="text-xs text-amber-300 font-semibold px-3">Javob berilmagan (vaqt tugagan)</p>}
                                </div>
                                {r.explanation && <p className="text-white/50 text-sm mt-2">💡 {r.explanation}</p>}
                            </div>
                        ))}
                    </div>
                )}
                {info.maxAttempts !== 1 && info.open && (
                    <button onClick={restart} className="btn-primary w-full py-3.5">🔄 Qayta yechish</button>
                )}
            </div>
        );
    }

    // ── Savol ──
    if (state && !state.finished) {
        const progress = (state.position / state.total) * 100;
        return shell(
            <div className="space-y-5">
                <div className="flex items-center justify-between text-sm font-bold text-white/60">
                    <span>{state.position + 1} / {state.total}</span>
                    {timeLeft !== null && (
                        <span className={timeLeft <= 5 ? 'text-red-400' : 'text-white/70'}>⏱ {timeLeft} s</span>
                    )}
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-zukkoo-green transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="glass rounded-3xl p-6">
                    <p className="text-xl md:text-2xl font-black leading-snug">{state.question.text}</p>
                </div>
                <div className="space-y-3">
                    {state.question.options.map((o, i) => (
                        <button key={i} onClick={() => answer(i)} disabled={busy}
                            className="w-full text-left rounded-2xl px-4 py-4 font-bold text-base md:text-lg flex items-start gap-3 transition-transform active:scale-[0.98] disabled:opacity-60"
                            style={{ background: picked === i ? OPTION_COLORS[i] : 'rgba(255,255,255,0.07)', border: `2px solid ${OPTION_COLORS[i]}` }}>
                            <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: OPTION_COLORS[i] }}>{LETTERS[i]}</span>
                            <span>{o}</span>
                        </button>
                    ))}
                </div>
                {error && <p className="text-amber-300 text-sm font-semibold text-center">{error}</p>}
            </div>
        );
    }

    // ── Kirish ──
    return shell(
        <div className="glass rounded-3xl p-7 space-y-5">
            <div>
                <p className="text-white/40 text-xs font-black tracking-widest uppercase mb-1">📅 Topshiriq · {code}</p>
                <h1 className="text-2xl md:text-3xl font-black leading-tight">{info.title}</h1>
                {info.description && <p className="text-white/60 mt-2">{info.description}</p>}
                {info.teacherName && <p className="text-white/40 text-sm mt-2">Oʻqituvchi: {info.teacherName}</p>}
            </div>
            <ul className="text-sm text-white/70 font-semibold space-y-1.5">
                <li>📝 {info.questionCount} ta savol</li>
                {info.timePerQuestion > 0 && <li>⏱ Har bir savolga {info.timePerQuestion} soniya</li>}
                <li>🔁 {info.maxAttempts === 0 ? 'Urinishlar cheklanmagan' : `Yechish imkoniyati: ${info.maxAttempts} marta`}</li>
                {info.closesAt && <li>📆 Muddat: {fmtDate(info.closesAt)} gacha</li>}
                <li>💾 Telefon oʻchib qolsa, qayta ochganingizda qolgan joydan davom etasiz</li>
            </ul>
            {!info.open ? (
                <p className="rounded-xl px-4 py-3 bg-red-500/10 text-red-300 font-bold text-center">
                    {info.reason}{info.opensAt && info.reason?.includes('ochilmagan') ? ` (${fmtDate(info.opensAt)})` : ''}
                </p>
            ) : (
                <>
                    <div className="space-y-3">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ism va familiyangiz" maxLength={60}
                            className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3.5 font-semibold placeholder:text-white/30 outline-none focus:border-blue-400" />
                        <input value={group} onChange={e => setGroup(e.target.value)} placeholder="Guruh yoki sinf (ixtiyoriy)" maxLength={40}
                            className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3.5 font-semibold placeholder:text-white/30 outline-none focus:border-blue-400" />
                    </div>
                    {error && <p className="text-red-300 text-sm font-semibold">{error}</p>}
                    <button onClick={start} disabled={busy} className="btn-primary w-full py-4 text-lg disabled:opacity-60">
                        {busy ? '⏳ Boshlanmoqda...' : '🚀 Boshlash'}
                    </button>
                </>
            )}
        </div>
    );
}
