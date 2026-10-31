'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DetectiveSetup from '@/components/psixolab/DetectiveSetup';
import { memorySetsFor, type MemorySet, type PsixoLang } from '@/lib/psixolab/questions';

const UI = {
    uz: {
        kicker: '“Pedagogika. Psixologiya” fani uchun',
        title: '🧠 PsixoLab',
        desc: 'Oʻyinli oʻquv rejimlari: talabalar telefondan qatnashadi, natijalar proyektorda.',
        modes: [
            { id: 'memory', icon: '🧠', name: 'Xotira sinovi', sub: 'Jonli mini-oʻyin · Miller 7±2', ready: true },
            { id: 'detective', icon: '🕵️', name: 'Psixolog-detektiv', sub: 'Keys asosida tashxis · izoh bilan', ready: true },
            { id: 'match', icon: '🧩', name: 'Moslashtir', sub: 'Tushuncha ↔ taʼrif', ready: false },
        ],
        soon: 'Tez kunda',
        lang: 'Oʻyin tili',
        kinds: { words: 'Tasodifiy soʻzlar', numbers: 'Sonlar', sentence: 'Maʼnoli gap' },
        kindHint: 'Mexanik va mazmunli xotirani solishtirish uchun avval “Tasodifiy soʻzlar”, soʻng “Maʼnoli gap” oʻyinini oʻtkazing.',
        custom: 'Oʻz roʻyxatingiz',
        customPh: 'Soʻzlarni vergul yoki yangi qator bilan yozing (3–20 ta)',
        interval: 'Har bir soʻz', recall: 'Yozish vaqti', sec: 'soniya',
        items: '{n} ta element',
        create: '🚀 Oʻyinni yaratish', creating: '⏳ Yaratilmoqda...',
        needItems: 'Kamida 3 ta soʻz kerak',
    },
    ru: {
        kicker: 'Для предмета «Педагогика. Психология»',
        title: '🧠 PsixoLab',
        desc: 'Игровые учебные режимы: студенты участвуют с телефона, результаты — на экране.',
        modes: [
            { id: 'memory', icon: '🧠', name: 'Тест памяти', sub: 'Живая мини-игра · Миллер 7±2', ready: true },
            { id: 'detective', icon: '🕵️', name: 'Психолог-детектив', sub: 'Диагноз по кейсу · с пояснением', ready: true },
            { id: 'match', icon: '🧩', name: 'Сопоставь', sub: 'Понятие ↔ определение', ready: false },
        ],
        soon: 'Скоро',
        lang: 'Язык игры',
        kinds: { words: 'Случайные слова', numbers: 'Числа', sentence: 'Осмысленное предложение' },
        kindHint: 'Чтобы сравнить механическую и смысловую память, проведите сначала «Случайные слова», затем «Осмысленное предложение».',
        custom: 'Свой список',
        customPh: 'Слова через запятую или с новой строки (3–20)',
        interval: 'Каждое слово', recall: 'Время на запись', sec: 'сек',
        items: '{n} элементов',
        create: '🚀 Создать игру', creating: '⏳ Создаётся...',
        needItems: 'Нужно минимум 3 слова',
    },
};

type Kind = MemorySet['kind'];
const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 font-semibold outline-none focus:border-violet-400/60';

export default function PsixoLabPage() {
    const router = useRouter();
    const { locale } = useParams<{ locale: string }>();
    const ui = UI[locale === 'ru' ? 'ru' : 'uz'];
    const [lang, setLang] = useState<PsixoLang>(locale === 'ru' ? 'ru' : 'uz');
    const [mode, setMode] = useState<'memory' | 'detective'>('memory');
    const [kind, setKind] = useState<Kind>('words');
    const sets = useMemo(() => memorySetsFor(lang, kind), [lang, kind]);
    const [setId, setSetId] = useState<string>('');
    const [custom, setCustom] = useState('');
    const [intervalMs, setIntervalMs] = useState(2000);
    const [recallSec, setRecallSec] = useState(60);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const chosen = sets.find(s => s.id === setId) ?? sets[0];
    const customItems = custom.split(/[,\n;]+/).map(x => x.trim()).filter(Boolean);
    const items = customItems.length > 0 ? customItems : chosen?.items ?? [];

    const create = async () => {
        setError(null);
        if (items.length < 3) { setError(ui.needItems); return; }
        setCreating(true);
        try {
            const res = await fetch('/api/code-race/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kind: 'memory', title: `${ui.modes[0].name} · ${customItems.length ? ui.custom : ui.kinds[kind]}`,
                    items: items.slice(0, 20), memoryKind: kind, setId: customItems.length ? 'custom' : chosen?.id,
                    intervalMs, recallSec, uiLang: lang,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            try { localStorage.setItem(`cr-host-${data.pin}`, data.hostKey); } catch { /* ignore */ }
            router.push(`/teacher/code-race/${data.pin}`);
        } catch (err: any) { setError(err.message); setCreating(false); }
    };

    return (
        <div className="min-h-screen bg-[#0b0a1f] text-white px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <p className="text-violet-300 text-xs font-black uppercase tracking-widest">{ui.kicker}</p>
                    <h1 className="text-3xl md:text-4xl font-black mt-1">{ui.title}</h1>
                    <p className="text-white/50 mt-2 text-sm">{ui.desc}</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-2">
                    {ui.modes.map(m => (
                        <button key={m.id} disabled={!m.ready} onClick={() => m.ready && setMode(m.id as 'memory' | 'detective')}
                            className={`text-left rounded-2xl p-4 border-2 ${!m.ready ? 'border-white/10 bg-white/[0.03] opacity-60' : mode === m.id ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 bg-white/[0.05] hover:border-violet-400/50'}`}>
                            <p className="text-2xl">{m.icon}</p>
                            <p className="font-black mt-1">{m.name}</p>
                            <p className="text-xs text-white/50 font-bold">{m.ready ? m.sub : `⏳ ${ui.soon}`}</p>
                        </button>
                    ))}
                </div>

                <Link href="/teacher/psixolab/auditoriya"
                    className="block rounded-2xl p-4 border-2 border-violet-400/40 bg-violet-500/10 hover:bg-violet-500/20">
                    <p className="font-black">🎓 {lang === 'ru' ? 'Аудиторные занятия' : 'Auditoriya mashgʻulotlari'} →</p>
                    <p className="text-xs text-white/50 font-bold">{lang === 'ru' ? 'Лекции и практика: объяснение + задания по ссылке' : 'Leksiya va praktika: tushuntirish + havola orqali topshiriqlar'}</p>
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white/50 text-sm font-black mr-1">{ui.lang}:</span>
                    {(['uz', 'ru'] as const).map(l => (
                        <button key={l} onClick={() => { setLang(l); setSetId(''); }}
                            className={`px-4 py-2 rounded-xl text-sm font-black ${lang === l ? 'bg-violet-500/30 text-white' : 'bg-white/5 text-white/50'}`}>
                            {l === 'uz' ? 'Oʻzbekcha' : 'Русский'}
                        </button>
                    ))}
                </div>

                {mode === 'detective' ? <DetectiveSetup lang={lang} uiLang={locale === 'ru' ? 'ru' : 'uz'} /> : <>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(ui.kinds) as Kind[]).map(k => (
                        <button key={k} onClick={() => { setKind(k); setSetId(''); }}
                            className={`px-4 py-2 rounded-xl text-sm font-black ${kind === k ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50'}`}>
                            {ui.kinds[k]}
                        </button>
                    ))}
                </div>
                <p className="text-white/40 text-xs font-semibold -mt-3">💡 {ui.kindHint}</p>

                <div className="grid sm:grid-cols-2 gap-2">
                    {sets.map(s => (
                        <button key={s.id} onClick={() => { setSetId(s.id); setCustom(''); }}
                            className={`rounded-2xl p-3 text-left border-2 ${chosen?.id === s.id && !customItems.length ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                            <p className="text-xs text-white/40 font-black">{ui.items.replace('{n}', String(s.items.length))} · {'★'.repeat(s.level)}</p>
                            <p className="text-sm font-bold text-white/80 mt-1">{s.kind === 'sentence' ? s.items.join(' ') : s.items.join(', ')}</p>
                        </button>
                    ))}
                </div>

                <label className="block">
                    <span className="text-white/50 text-xs font-black">{ui.custom}</span>
                    <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={2} placeholder={ui.customPh} className={`${field} mt-1`} />
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-white/50 text-xs font-black">{ui.interval}</span>
                        <select value={intervalMs} onChange={e => setIntervalMs(Number(e.target.value))} className={`${field} mt-1`} style={{ colorScheme: 'dark' }}>
                            {[1500, 2000, 2500, 3000].map(v => <option key={v} value={v}>{v / 1000} {ui.sec}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-white/50 text-xs font-black">{ui.recall}</span>
                        <select value={recallSec} onChange={e => setRecallSec(Number(e.target.value))} className={`${field} mt-1`} style={{ colorScheme: 'dark' }}>
                            {[30, 45, 60, 90, 120].map(v => <option key={v} value={v}>{v} {ui.sec}</option>)}
                        </select>
                    </label>
                </div>

                {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}

                <button onClick={create} disabled={creating}
                    className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 10px 40px rgba(139,92,246,0.35)' }}>
                    {creating ? ui.creating : `${ui.create} · ${ui.items.replace('{n}', String(Math.min(items.length, 20)))}`}
                </button>
                </>}
            </div>
        </div>
    );
}
