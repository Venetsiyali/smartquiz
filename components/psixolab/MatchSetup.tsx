'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MATCH_KIND_NAMES, matchSetsFor } from '@/lib/psixolab/match';
import type { PsixoLang } from '@/lib/psixolab/questions';

const UI = {
    uz: {
        sets: 'Raundlar (toʻplamlar)', all: 'Hammasi', pairs: '{n} ta juftlik',
        penalty: 'Xato uchun jarima', none: 'Jarimasiz', time: 'Vaqt', min: 'daqiqa', sec: 'soniya',
        hint: 'Har toʻplam — bitta raund. Talaba chapdagi elementni, soʻng mos javobni bosadi; javoblar har talabada boshqa tartibda. Xato — jarima soniyasi. Hammasini birinchi va kam xato bilan moslashtirgan — gʻolib.',
        need: 'Kamida 1 ta toʻplam tanlang',
        create: '🚀 Oʻyinni yaratish', creating: '⏳ Yaratilmoqda...', title: 'Moslashtir',
    },
    ru: {
        sets: 'Раунды (наборы)', all: 'Все', pairs: '{n} пар',
        penalty: 'Штраф за ошибку', none: 'Без штрафа', time: 'Время', min: 'мин', sec: 'сек',
        hint: 'Каждый набор — один раунд. Студент нажимает элемент слева, затем подходящий ответ; у каждого свой порядок ответов. Ошибка — штрафные секунды. Побеждает тот, кто первым и с меньшим числом ошибок всё сопоставит.',
        need: 'Выберите хотя бы 1 набор',
        create: '🚀 Создать игру', creating: '⏳ Создаётся...', title: 'Сопоставь',
    },
};

const field = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-semibold outline-none focus:border-violet-400/60';

export default function MatchSetup({ lang, uiLang }: { lang: PsixoLang; uiLang: PsixoLang }) {
    const router = useRouter();
    const ui = UI[uiLang];
    const sets = useMemo(() => matchSetsFor(lang), [lang]);
    const [chosen, setChosen] = useState<string[]>([]);   // boʻsh — hammasi
    const [penaltySec, setPenaltySec] = useState(5);
    const [minutes, setMinutes] = useState(7);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const picked = chosen.length ? sets.filter(s => chosen.includes(s.id)) : sets;
    const pairCount = picked.reduce((n, s) => n + s.pairs.length, 0);

    const create = async () => {
        if (!picked.length) { setError(ui.need); return; }
        setError(null); setCreating(true);
        try {
            const res = await fetch('/api/code-race/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kind: 'match', uiLang: lang, title: `🧩 ${UI[lang].title}`, penaltySec, durationSec: minutes * 60,
                    rounds: picked.map(s => ({
                        title: (lang === 'ru' ? s.title.ru : s.title.uz)!,
                        pairs: s.pairs.map(x => ({ left: (lang === 'ru' ? x.left.ru : x.left.uz)!, right: (lang === 'ru' ? x.right.ru : x.right.uz)! })),
                    })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            try { localStorage.setItem(`cr-host-${data.pin}`, data.hostKey); } catch { /* ignore */ }
            router.push(`/teacher/code-race/${data.pin}`);
        } catch (err: any) { setError(err.message); setCreating(false); }
    };

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <p className="text-white/50 text-xs font-black">{ui.sets}</p>
                    <button onClick={() => setChosen([])} className={`px-3 py-1 rounded-lg text-xs font-black ${chosen.length === 0 ? 'bg-violet-500/30' : 'bg-white/5 text-white/50'}`}>{ui.all}</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                    {sets.map(s => {
                        const on = chosen.length === 0 || chosen.includes(s.id);
                        return (
                            <button key={s.id} onClick={() => setChosen(c => c.includes(s.id) ? c.filter(x => x !== s.id) : [...c, s.id])}
                                className={`rounded-2xl p-3 text-left border-2 ${on ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 bg-white/[0.03] opacity-60'}`}>
                                <p className="text-xs text-white/40 font-black">{MATCH_KIND_NAMES[s.kind][uiLang]} · {ui.pairs.replace('{n}', String(s.pairs.length))} · {'★'.repeat(s.level)}</p>
                                <p className="text-sm font-black mt-0.5">{lang === 'ru' ? s.title.ru : s.title.uz}</p>
                                <p className="text-xs text-white/50 font-semibold mt-1">{s.pairs.map(x => lang === 'ru' ? x.left.ru : x.left.uz).join(', ')}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-white/50 text-xs font-black">{ui.penalty}</span>
                    <select value={penaltySec} onChange={e => setPenaltySec(Number(e.target.value))} className={`${field} mt-1`} style={{ colorScheme: 'dark' }}>
                        {[0, 3, 5, 10].map(v => <option key={v} value={v}>{v ? `+${v} ${ui.sec}` : ui.none}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className="text-white/50 text-xs font-black">{ui.time}</span>
                    <select value={minutes} onChange={e => setMinutes(Number(e.target.value))} className={`${field} mt-1`} style={{ colorScheme: 'dark' }}>
                        {[3, 5, 7, 10, 15].map(v => <option key={v} value={v}>{v} {ui.min}</option>)}
                    </select>
                </label>
            </div>
            <p className="text-white/40 text-xs font-semibold">💡 {ui.hint}</p>

            {error && <p className="rounded-xl px-4 py-3 text-sm font-bold text-red-300 bg-red-500/10">⚠️ {error}</p>}
            <button onClick={create} disabled={creating}
                className="w-full py-4 rounded-2xl text-lg font-black disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 10px 40px rgba(139,92,246,0.35)' }}>
                {creating ? ui.creating : `${ui.create} · ${picked.length} × 🧩 · ${pairCount}`}
            </button>
        </div>
    );
}
