'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { questionsFor, TOPIC_NAMES, type PsixoLang, type PsixoLevel, type PsixoTopic } from '@/lib/psixolab/questions';

const UI = {
    uz: {
        topics: 'Mavzular', all: 'Hammasi', levels: 'Qiyinlik',
        goal: 'Marraga yetish uchun', goalUnit: 'ta toʻgʻri javob', time: 'Vaqt', min: 'daqiqa',
        available: '{n} ta keys mavjud', none: 'Tanlangan mavzularda savol yoʻq',
        hint: 'Har bir talaba keyslarni oʻz tartibida oladi, variantlar ham aralashtiriladi. Javobdan keyin izoh chiqadi. Kim birinchi boʻlib marraga yetsa — gʻolib.',
        create: '🚀 Oʻyinni yaratish', creating: '⏳ Yaratilmoqda...', title: 'Psixolog-detektiv',
    },
    ru: {
        topics: 'Темы', all: 'Все', levels: 'Сложность',
        goal: 'Для финиша нужно', goalUnit: 'правильных ответов', time: 'Время', min: 'мин',
        available: 'Доступно кейсов: {n}', none: 'В выбранных темах нет вопросов',
        hint: 'Каждый студент получает кейсы в своём порядке, варианты тоже перемешаны. После ответа показывается пояснение. Кто первым дойдёт до финиша — победитель.',
        create: '🚀 Создать игру', creating: '⏳ Создаётся...', title: 'Психолог-детектив',
    },
};

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-semibold outline-none focus:border-violet-400/60';

export default function DetectiveSetup({ lang, uiLang }: { lang: PsixoLang; uiLang: PsixoLang }) {
    const router = useRouter();
    const ui = UI[uiLang];
    const allTopics = useMemo(() => Array.from(new Set(questionsFor(lang, { mode: 'detective' }).map(q => q.topic))), [lang]);
    const [topics, setTopics] = useState<PsixoTopic[]>([]);
    const [levels, setLevels] = useState<PsixoLevel[]>([]);
    const qs = useMemo(() => questionsFor(lang, { mode: 'detective', topics, levels }), [lang, topics, levels]);
    const [goal, setGoal] = useState(10);
    const [minutes, setMinutes] = useState(10);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const effGoal = Math.min(goal, qs.length);

    const toggle = <T,>(list: T[], v: T) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];

    const create = async () => {
        if (qs.length < 3) { setError(ui.none); return; }
        setError(null); setCreating(true);
        try {
            const res = await fetch('/api/code-race/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kind: 'english', theme: 'psixo', uiLang: lang, title: `🕵️ ${UI[lang].title}`,
                    goal: effGoal, durationSec: minutes * 60,
                    questions: qs.map(q => {
                        const options = (lang === 'ru' ? q.options.ru : q.options.uz)!;
                        return {
                            q: (lang === 'ru' ? q.q.ru : q.q.uz)!, options, answer: options[q.correct],
                            explain: lang === 'ru' ? q.explain.ru : q.explain.uz,
                            topic: TOPIC_NAMES[q.topic][lang], level: q.level,
                        };
                    }),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            try { localStorage.setItem(`cr-host-${data.pin}`, data.hostKey); } catch { /* ignore */ }
            router.push(`/teacher/code-race/${data.pin}`);
        } catch (err: any) { setError(err.message); setCreating(false); }
    };

    const chip = (on: boolean) => `px-3 py-1.5 rounded-xl text-xs font-black ${on ? 'bg-violet-500/30 text-white' : 'bg-white/5 text-white/50'}`;

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <p className="text-white/50 text-xs font-black">{ui.topics}</p>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setTopics([])} className={chip(topics.length === 0)}>{ui.all}</button>
                    {allTopics.map(t => (
                        <button key={t} onClick={() => setTopics(toggle(topics, t))} className={chip(topics.includes(t))}>{TOPIC_NAMES[t][uiLang]}</button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <p className="text-white/50 text-xs font-black mr-1">{ui.levels}:</p>
                <button onClick={() => setLevels([])} className={chip(levels.length === 0)}>{ui.all}</button>
                {([1, 2, 3] as PsixoLevel[]).map(l => (
                    <button key={l} onClick={() => setLevels(toggle(levels, l))} className={chip(levels.includes(l))}>{'★'.repeat(l)}</button>
                ))}
            </div>
            <p className={`text-sm font-bold ${qs.length < 3 ? 'text-red-300' : 'text-white/60'}`}>🗂 {qs.length < 3 ? ui.none : ui.available.replace('{n}', String(qs.length))}</p>

            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-white/50 text-xs font-black">{ui.goal}</span>
                    <select value={goal} onChange={e => setGoal(Number(e.target.value))} className={`${field} mt-1`} style={{ colorScheme: 'dark' }}>
                        {[5, 8, 10, 15, 20].map(v => <option key={v} value={v}>{v} {ui.goalUnit}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className="text-white/50 text-xs font-black">{ui.time}</span>
                    <select value={minutes} onChange={e => setMinutes(Number(e.target.value))} className={`${field} mt-1`} style={{ colorScheme: 'dark' }}>
                        {[5, 7, 10, 15, 20].map(v => <option key={v} value={v}>{v} {ui.min}</option>)}
                    </select>
                </label>
            </div>
            <p className="text-white/40 text-xs font-semibold">💡 {ui.hint}</p>

            {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}
            <button onClick={create} disabled={creating || qs.length < 3}
                className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 10px 40px rgba(139,92,246,0.35)' }}>
                {creating ? ui.creating : `${ui.create} · 🏁 ${effGoal}`}
            </button>
        </div>
    );
}
