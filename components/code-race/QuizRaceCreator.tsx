'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { EngQuestion } from '@/lib/engRace';

export interface SampleSet { id: string; label: string; title: string; questions: EngQuestion[]; lang?: 'uz' | 'ru' }
export interface PromptLang { id: string; label: string }

const UI = {
    uz: {
        questions: '{n} ta savol', gameName: "O'yin nomi", minutes: '⏱ {n} daqiqa', finish: "🏁 Finish: {n} ta to'g'ri javob",
        fromAi: "🧩 Boshqa AI'dan savollar", addQ: "➕ Savol qo'shish", all: 'Hammasi ({n})', other: 'Boshqa', del: "O'chirish",
        creating: '⏳ Yaratilmoqda...', create: '🚀 Poygani yaratish ({n} ta savol)', error: 'Xatolik',
        qText: "Savol matni (gapda bo'sh joy bo'lsa ___ bilan belgilang)", opts: "Variantlar vergul bilan (bo'sh qoldirsangiz — talaba o'zi yozadi)",
        answer: "To'g'ri javob", topic: 'Mavzu (ixtiyoriy)', explain: 'Izoh (ixtiyoriy)', add: "✅ Qo'shish",
        step1: "1. Promptni nusxalab ChatGPT, Claude yoki Gemini'ga yuboring", copied: '✅ Nusxalandi', copy: '📋 Promptni nusxalash',
        step2: '2. AI javobini (JSON) shu yerga joylang', load: '✅ Savollarni yuklash', min3: 'Kamida 3 ta savol kerak',
        badJson: "JSON o'qilmadi — AI javobini to'liq nusxalang", topicPh: 'Mavzu', uiLang: "O'yin ekranlari tili",
        community: '👥 Boshqalarning savollari', communitySub: "Boshqa o'qituvchilar AI orqali qo'shgan savollar · {n} ta",
        communityEmpty: "Hozircha bu omborda savol yo'q — birinchi bo'lib qo'shing!", saved: "✅ {n} ta yangi savol umumiy omborga qo'shildi",
        shareNote: "AI'dan va qo'lda qo'shilgan savollar \"Boshqalarning savollari\" omboriga ham yig'iladi.",
        levels: ['🟢 Oson', "🟡 O'rtacha", '🔴 Qiyin'], levelHint: "Darajalar — o'yinga qaysi savollar kirishini tanlang:",
    },
    ru: {
        questions: '{n} вопросов', gameName: 'Название игры', minutes: '⏱ {n} мин', finish: '🏁 Финиш: {n} правильных ответов',
        fromAi: '🧩 Вопросы из другого ИИ', addQ: '➕ Добавить вопрос', all: 'Все ({n})', other: 'Другое', del: 'Удалить',
        creating: '⏳ Создаётся...', create: '🚀 Создать гонку ({n} вопросов)', error: 'Ошибка',
        qText: 'Текст вопроса (пропуск в предложении обозначьте ___)', opts: 'Варианты через запятую (оставьте пустым — студент напишет ответ сам)',
        answer: 'Правильный ответ', topic: 'Тема (необязательно)', explain: 'Пояснение (необязательно)', add: '✅ Добавить',
        step1: '1. Скопируйте промпт и отправьте в ChatGPT, Claude или Gemini', copied: '✅ Скопировано', copy: '📋 Скопировать промпт',
        step2: '2. Вставьте ответ ИИ (JSON) сюда', load: '✅ Загрузить вопросы', min3: 'Нужно минимум 3 вопроса',
        badJson: 'Не удалось прочитать JSON — скопируйте ответ ИИ полностью', topicPh: 'Тема', uiLang: 'Язык игровых экранов',
        community: '👥 Вопросы коллег', communitySub: 'Вопросы, добавленные другими преподавателями через ИИ · {n}',
        communityEmpty: 'В этой базе пока нет вопросов — добавьте первыми!', saved: '✅ {n} новых вопросов добавлено в общую базу',
        shareNote: 'Вопросы из ИИ и добавленные вручную также попадают в общую базу «Вопросы коллег».',
        levels: ['🟢 Лёгкие', '🟡 Средние', '🔴 Сложные'], levelHint: 'Уровни — выберите, какие вопросы войдут в игру:',
    },
};
type Ui = typeof UI.uz;
const fill = (s: string, n: number | string) => s.replace('{n}', String(n));

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-sky-400/60';

/**
 * Savol-poyga (Grammar Race, AKT Poygasi) uchun umumiy "o'yin yaratish" sahifasi:
 * tayyor to'plamlar, qo'lda savol qo'shish, tashqi AI'dan import va o'yinni yaratish.
 */
export default function QuizRaceCreator({
    kicker, heading, description, theme, sampleSets, buildPrompt, promptLangs, defaultTopic,
    gradient = 'linear-gradient(135deg,#0ea5e9,#2563eb)', defaultDuration = 10, defaultGoal = 15,
}: {
    kicker: string; heading: string; description: string; theme: 'grammar' | 'it';
    sampleSets: SampleSet[]; buildPrompt: (topic: string, count: number, lang: string) => string;
    promptLangs?: PromptLang[]; defaultTopic: string;
    gradient?: string; defaultDuration?: number; defaultGoal?: number;
}) {
    const router = useRouter();
    const { locale } = useParams<{ locale: string }>();
    const ui = UI[locale === 'ru' ? 'ru' : 'uz'];
    const [setId, setSetId] = useState(sampleSets[0].id);
    const [gameLang, setGameLang] = useState<'uz' | 'ru'>(sampleSets[0].lang ?? 'uz');
    const [title, setTitle] = useState(sampleSets[0].title);
    const [duration, setDuration] = useState(defaultDuration);
    const [goal, setGoal] = useState(defaultGoal);
    const [questions, setQuestions] = useState<EngQuestion[]>(sampleSets[0].questions);
    const [topicFilter, setTopicFilter] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [showAi, setShowAi] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [levels, setLevels] = useState<(1 | 2 | 3)[]>([1, 2, 3]);
    const hasLevels = questions.some(q => q.level);
    const inLevel = (q: EngQuestion) => !hasLevels || levels.includes(q.level ?? 1);
    const selected = questions.filter(inLevel);
    const toggleLevel = (l: 1 | 2 | 3) =>
        setLevels(cur => cur.includes(l) ? (cur.length > 1 ? cur.filter(x => x !== l) : cur) : [...cur, l].sort());

    const topics = useMemo(() => Array.from(new Set(questions.map(q => q.topic || ui.other))), [questions, ui.other]);

    // ── "Boshqalarning savollari" — umumiy ombor (yo'nalish va til bo'yicha alohida) ──
    const [communityCount, setCommunityCount] = useState<number | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    useEffect(() => {
        fetch(`/api/community-questions?theme=${theme}&lang=${gameLang}&count=1`, { cache: 'no-store' })
            .then(r => r.json()).then(d => setCommunityCount(typeof d.count === 'number' ? d.count : 0)).catch(() => setCommunityCount(null));
    }, [theme, gameLang]);

    const loadCommunity = async () => {
        setError(null);
        try {
            const d = await fetch(`/api/community-questions?theme=${theme}&lang=${gameLang}`, { cache: 'no-store' }).then(r => r.json());
            if (!d.questions?.length) { setNotice(ui.communityEmpty); return; }
            setQuestions(d.questions); setSetId('community'); setTopicFilter(null); setCommunityCount(d.count);
        } catch { setError(ui.error); }
    };

    /** Yangi savollarni umumiy omborga yuboradi (fon rejimida; xato o'yin yaratishga xalaqit bermaydi). */
    const share = useCallback((qs: EngQuestion[], lang: string) => {
        fetch('/api/community-questions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme, lang: lang === 'ru' ? 'ru' : 'uz', questions: qs }),
        }).then(r => r.json()).then(d => {
            if (d.added > 0) {
                setNotice(fill(ui.saved, d.added));
                if (lang === gameLang) setCommunityCount(c => (c ?? 0) + d.added);
            }
        }).catch(() => {});
    }, [theme, gameLang, ui.saved]);

    const pickSet = (s: SampleSet) => { setSetId(s.id); setQuestions(s.questions); setTitle(s.title); setTopicFilter(null); if (s.lang) setGameLang(s.lang); };

    const create = async () => {
        setError(null); setCreating(true);
        try {
            const res = await fetch('/api/code-race/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind: 'english', theme, uiLang: gameLang, title, durationSec: duration * 60, goal, questions: selected }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || ui.error);
            try { localStorage.setItem(`cr-host-${data.pin}`, data.hostKey); } catch { /* ignore */ }
            router.push(`/teacher/code-race/${data.pin}`);
        } catch (err: any) {
            setError(err.message); setCreating(false);
        }
    };

    const shown = questions.map((q, i) => ({ q, i })).filter(({ q }) => inLevel(q) && (!topicFilter || (q.topic || ui.other) === topicFilter));

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <p className="text-sky-400 text-xs font-black uppercase tracking-widest">{kicker}</p>
                    <h1 className="text-3xl md:text-4xl font-black mt-1">{heading}</h1>
                    <p className="text-white/50 mt-2 text-sm">{description}</p>
                </div>

                {sampleSets.length > 1 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {sampleSets.map(s => (
                            <button key={s.id} onClick={() => pickSet(s)}
                                className={`px-3 py-3 rounded-2xl text-sm font-black text-left border-2 transition-colors ${setId === s.id ? 'border-sky-400 bg-sky-500/15' : 'border-white/10 bg-white/5 text-white/70'}`}>
                                {s.label}<span className="block text-xs font-bold text-white/40 mt-0.5">{fill(ui.questions, s.questions.length)}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-3">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder={ui.gameName} className={field} />
                    <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={field} style={{ colorScheme: 'dark' }}>
                        {[3, 5, 7, 10, 15, 20, 30].map(m => <option key={m} value={m}>{fill(ui.minutes, m)}</option>)}
                    </select>
                    <select value={goal} onChange={e => setGoal(Number(e.target.value))} className={field} style={{ colorScheme: 'dark' }}>
                        {[5, 10, 15, 20, 25, 30].map(g => <option key={g} value={g}>{fill(ui.finish, g)}</option>)}
                    </select>
                </div>

                <div className="flex flex-wrap gap-2 text-sm font-black">
                    {sampleSets.length === 1 && (
                        <button onClick={() => pickSet(sampleSets[0])} className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">📚 {sampleSets[0].label} ({sampleSets[0].questions.length})</button>
                    )}
                    <button onClick={() => setShowAi(true)} className="px-4 py-2 rounded-xl" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>{ui.fromAi}</button>
                    <button onClick={() => setShowAdd(s => !s)} className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">{ui.addQ}</button>
                    <select value={gameLang} onChange={e => setGameLang(e.target.value as 'uz' | 'ru')} title={ui.uiLang}
                        className="px-3 py-2 rounded-xl bg-white/5 text-white/70 font-black" style={{ colorScheme: 'dark' }}>
                        <option value="uz">🖥 O&apos;zbekcha</option>
                        <option value="ru">🖥 Русский</option>
                    </select>
                </div>

                <button onClick={loadCommunity}
                    className={`w-full px-4 py-3 rounded-2xl text-left border-2 border-dashed transition-colors ${setId === 'community' ? 'border-violet-400 bg-violet-500/15' : 'border-violet-400/30 bg-violet-500/5 hover:bg-violet-500/10'}`}>
                    <span className="font-black text-violet-200">{ui.community} · {gameLang === 'ru' ? 'Русский' : "O'zbekcha"}</span>
                    <span className="block text-xs font-bold text-white/40 mt-0.5">{fill(ui.communitySub, communityCount ?? '…')}</span>
                </button>
                <p className="text-white/30 text-xs font-semibold -mt-3">ℹ️ {ui.shareNote}</p>
                {notice && <p className="rounded-xl px-4 py-2 text-sm font-bold text-violet-200 bg-violet-500/10">{notice}</p>}

                {showAdd && <AddQuestion ui={ui} onAdd={q => { setQuestions(x => [...x, q]); setShowAdd(false); share([q], gameLang); }} />}

                {hasLevels && (
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 space-y-2">
                        <p className="text-white/50 text-xs font-black">{ui.levelHint}</p>
                        <div className="flex flex-wrap gap-2">
                            {([1, 2, 3] as const).map(l => (
                                <button key={l} onClick={() => toggleLevel(l)}
                                    className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-colors ${levels.includes(l) ? 'border-white/40 bg-white/10 text-white' : 'border-white/5 bg-transparent text-white/30 line-through'}`}>
                                    {ui.levels[l - 1]} ({questions.filter(q => (q.level ?? 1) === l).length})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setTopicFilter(null)} className={`px-3 py-1 rounded-full text-xs font-black ${!topicFilter ? 'bg-sky-500/30 text-sky-200' : 'bg-white/5 text-white/50'}`}>{fill(ui.all, selected.length)}</button>
                    {topics.map(t => (
                        <button key={t} onClick={() => setTopicFilter(t)} className={`px-3 py-1 rounded-full text-xs font-black ${topicFilter === t ? 'bg-sky-500/30 text-sky-200' : 'bg-white/5 text-white/50'}`}>
                            {t} ({selected.filter(q => (q.topic || ui.other) === t).length})
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                    {shown.map(({ q, i }) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                            <span className="text-white/30 font-black w-6 shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold">{hasLevels && <span className="mr-1.5" title={ui.levels[(q.level ?? 1) - 1]}>{['🟢', '🟡', '🔴'][(q.level ?? 1) - 1]}</span>}{q.q}</p>
                                <p className="text-xs text-white/40 mt-0.5">
                                    {q.options ? q.options.map(o => <span key={o} className={o === q.answer ? 'text-emerald-300 font-black' : ''}>{o}{'  ·  '}</span>) : <span className="text-emerald-300 font-black">✍️ {q.answer}</span>}
                                </p>
                            </div>
                            <button onClick={() => setQuestions(x => x.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-300" title={ui.del}>✕</button>
                        </div>
                    ))}
                </div>

                {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}

                <button onClick={create} disabled={creating || selected.length < 3}
                    className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40"
                    style={{ background: gradient, boxShadow: '0 10px 40px rgba(14,165,233,0.3)' }}>
                    {creating ? ui.creating : fill(ui.create, selected.length)}
                </button>
            </div>

            {showAi && (
                <AiModal ui={ui} buildPrompt={buildPrompt} promptLangs={promptLangs} defaultTopic={defaultTopic}
                    onClose={() => setShowAi(false)} onImport={(qs, lang) => {
                        setQuestions(qs); setShowAi(false); setTopicFilter(null); setSetId('');
                        const l = lang === 'ru' || lang === 'uz' ? lang : gameLang;
                        setGameLang(l);
                        share(qs, l);
                    }} />
            )}
        </div>
    );
}

function AddQuestion({ onAdd, ui }: { onAdd: (q: EngQuestion) => void; ui: Ui }) {
    const [q, setQ] = useState('');
    const [options, setOptions] = useState('');
    const [answer, setAnswer] = useState('');
    const [explain, setExplain] = useState('');
    const [topic, setTopic] = useState('');
    const opts = options.split(',').map(o => o.trim()).filter(Boolean);
    const valid = q.trim() && answer.trim() && (opts.length === 0 || opts.includes(answer.trim()));
    return (
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={ui.qText} className={field} />
            <input value={options} onChange={e => setOptions(e.target.value)} placeholder={ui.opts} className={field} />
            <div className="grid md:grid-cols-3 gap-2">
                <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder={ui.answer} className={field} />
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={ui.topic} className={field} />
                <input value={explain} onChange={e => setExplain(e.target.value)} placeholder={ui.explain} className={field} />
            </div>
            <button disabled={!valid} onClick={() => onAdd({ q, answer: answer.trim(), options: opts.length ? opts : undefined, explain: explain || undefined, topic: topic || undefined })}
                className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-40" style={{ background: 'rgba(14,165,233,0.2)', color: '#7dd3fc' }}>
                {ui.add}
            </button>
        </div>
    );
}

function AiModal({ onClose, onImport, buildPrompt, promptLangs, defaultTopic, ui }: {
    onClose: () => void; onImport: (q: EngQuestion[], lang: string) => void; ui: Ui;
    buildPrompt: (topic: string, count: number, lang: string) => string; promptLangs?: PromptLang[]; defaultTopic: string;
}) {
    const [topic, setTopic] = useState(defaultTopic);
    const [count, setCount] = useState(30);
    const [lang, setLang] = useState(promptLangs?.[0]?.id ?? '');
    const [text, setText] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prompt = buildPrompt(topic, count, lang);

    const load = () => {
        setError(null);
        try {
            const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
            if (!Array.isArray(arr) || arr.length < 3) throw new Error(ui.min3);
            onImport(arr.map((x: any) => ({
                q: String(x.q ?? ''), answer: String(x.answer ?? ''), options: Array.isArray(x.options) ? x.options.map(String) : undefined,
                explain: x.explain ? String(x.explain) : undefined, topic: x.topic ? String(x.topic) : undefined,
                level: [1, 2, 3].includes(Number(x.level)) ? Number(x.level) as 1 | 2 | 3 : undefined,
            })), lang);
        } catch (err: any) {
            setError(err?.message === ui.min3 ? err.message : ui.badJson);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur">
            <div className="w-full max-w-xl rounded-3xl p-6 space-y-3 max-h-[90vh] overflow-y-auto bg-[#111830] border border-white/10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">{ui.fromAi}</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white text-3xl">×</button>
                </div>
                <p className="text-white/60 text-sm font-bold">{ui.step1}</p>
                <div className="flex gap-2">
                    <input value={topic} onChange={e => setTopic(e.target.value)} className={field} placeholder={ui.topicPh} />
                    {promptLangs && (
                        <select value={lang} onChange={e => setLang(e.target.value)} className={`${field} !w-32`} style={{ colorScheme: 'dark' }}>
                            {promptLangs.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                        </select>
                    )}
                    <select value={count} onChange={e => setCount(Number(e.target.value))} className={`${field} !w-20`} style={{ colorScheme: 'dark' }}>
                        {[15, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <pre className="text-white/50 text-xs whitespace-pre-wrap bg-black/30 rounded-xl p-3 max-h-36 overflow-y-auto">{prompt}</pre>
                <button onClick={() => navigator.clipboard.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {})}
                    className="px-4 py-2 rounded-xl text-sm font-black" style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>
                    {copied ? ui.copied : ui.copy}
                </button>
                <p className="text-white/60 text-sm font-bold pt-2">{ui.step2}</p>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={7} className={`${field} font-mono text-xs`} placeholder='[ { "q": "...", "options": [...], "answer": "..." } ]' />
                {error && <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>}
                <button onClick={load} disabled={!text.trim()} className="w-full py-3 rounded-xl font-black disabled:opacity-40" style={{ background: 'rgba(14,165,233,0.2)', color: '#7dd3fc' }}>
                    {ui.load}
                </button>
            </div>
        </div>
    );
}
