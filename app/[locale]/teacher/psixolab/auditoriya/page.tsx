'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { AUD_TOPICS, type AudLang, type AudTopic } from '@/lib/psixolab/auditoriya';
import Blocks from '@/components/psixolab/Blocks';
import { audUi, fillN, type AudUi } from '@/components/psixolab/audI18n';

/** Tabdagi tartib. */
const PLAN = { lecture: ['L3', 'L6', 'L7'], practice: ['P1', 'P4', 'P9'] };

interface MyTask { id: string; key: string; topicId: string; lang: AudLang; createdAt: number }
const STORE = 'aud-tasks';

export default function AuditoriyaPage() {
    const { locale } = useParams<{ locale: string }>();
    const uiLang: AudLang = locale === 'ru' ? 'ru' : 'uz';
    const ui = audUi(uiLang);
    const [tab, setTab] = useState<'lecture' | 'practice'>('lecture');
    const [mine, setMine] = useState<MyTask[]>([]);
    useEffect(() => { try { setMine(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch { /* ignore */ } }, []);

    const addTask = (t: MyTask) => {
        const list = [t, ...mine].slice(0, 100);
        setMine(list);
        try { localStorage.setItem(STORE, JSON.stringify(list)); } catch { /* ignore */ }
    };

    return (
        <div className="min-h-screen bg-[#0b0a1f] text-white px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/teacher/psixolab" className="text-violet-300 text-sm font-black">{ui.back}</Link>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black">🎓 {ui.section}</h1>
                    <p className="text-white/50 mt-2 text-sm">{ui.sectionSub}</p>
                </div>

                <div className="flex gap-2">
                    {(['lecture', 'practice'] as const).map(k => (
                        <button key={k} onClick={() => setTab(k)}
                            className={`px-5 py-2.5 rounded-xl font-black ${tab === k ? 'bg-violet-500/30 text-white' : 'bg-white/5 text-white/50'}`}>
                            {k === 'lecture' ? ui.lectures : ui.practice}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {PLAN[tab].map(id => AUD_TOPICS.find(t => t.id === id)).filter((t): t is AudTopic => !!t).map(topic => (
                        <TopicCard key={topic.id} topic={topic} uiLang={uiLang} ui={ui} onCreated={addTask} mine={mine.filter(m => m.topicId === topic.id)} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function TopicCard({ topic, uiLang, ui, onCreated, mine }: {
    topic: AudTopic; uiLang: AudLang; ui: AudUi; onCreated: (t: MyTask) => void; mine: MyTask[];
}) {
    const [open, setOpen] = useState<'explain' | 'tasks' | null>('explain');
    const [lang, setLang] = useState<AudLang>(uiLang);
    const [busy, setBusy] = useState(false);
    const [link, setLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const create = async () => {
        setBusy(true);
        try {
            const res = await fetch('/api/task/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicId: topic.id, lang }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setLink(`${window.location.origin}/${lang}/task/${data.id}`);
            onCreated({ id: data.id, key: data.teacherKey, topicId: topic.id, lang, createdAt: Date.now() });
        } catch { /* xato — tugma qayta bosiladi */ } finally { setBusy(false); }
    };

    return (
        <div className="rounded-3xl bg-white/[0.04] border border-violet-400/30 p-5 space-y-4">
            <h2 className="text-xl font-black"><span className="text-violet-300 mr-2">{topic.id}</span>{topic.title[uiLang]}</h2>

            <div className="flex gap-2">
                {(['explain', 'tasks'] as const).map(k => (
                    <button key={k} onClick={() => setOpen(open === k ? null : k)}
                        className={`px-4 py-2 rounded-xl text-sm font-black ${open === k ? 'bg-white/15' : 'bg-white/5 text-white/60'}`}>
                        {k === 'explain' ? `📖 ${ui.explain}` : `📝 ${ui.tasks}`}
                    </button>
                ))}
            </div>

            {open === 'explain' && (
                <div className="space-y-4">
                    <Blocks blocks={topic.explain[uiLang]} />
                    <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-white/40 font-black mr-1 self-center">{ui.concepts}:</span>
                        {topic.concepts[uiLang].map(c => <span key={c} className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-200 text-xs font-bold">{c}</span>)}
                    </div>
                </div>
            )}

            {open === 'tasks' && (
                <div className="space-y-4">
                    <ul className="text-sm text-white/70 font-semibold space-y-1">
                        <li>✅ {fillN(ui.testN, topic.tests.length)}</li>
                        <li>🧩 {fillN(ui.matchN, topic.pairs.length)}</li>
                        <li>✍️ {ui.caseT}</li>
                    </ul>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white/50 text-xs font-black">{ui.taskLang}:</span>
                        {(['uz', 'ru'] as const).map(l => (
                            <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 rounded-lg text-xs font-black ${lang === l ? 'bg-violet-500/30' : 'bg-white/5 text-white/50'}`}>
                                {l === 'uz' ? 'Oʻzbekcha' : 'Русский'}
                            </button>
                        ))}
                        <button onClick={create} disabled={busy} className="ml-auto px-4 py-2.5 rounded-xl font-black disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                            {busy ? ui.making : ui.makeLink}
                        </button>
                    </div>
                    {link && (
                        <div className="rounded-2xl bg-black/30 p-4 flex flex-col sm:flex-row gap-4 items-center">
                            <div className="bg-white p-2 rounded-xl"><QRCodeSVG value={link} size={120} /></div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <p className="text-white/60 text-sm font-bold">{ui.linkReady}</p>
                                <p className="font-mono text-sm break-all text-violet-200">{link}</p>
                                <button onClick={() => navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {})}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-black">{copied ? ui.copied : ui.copy}</button>
                            </div>
                        </div>
                    )}
                    {mine.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-white/40 text-xs font-black">{ui.myTasks}</p>
                            {mine.map(m => (
                                <div key={m.id} className="flex items-center gap-3 text-sm">
                                    <span className="font-mono text-white/50">{m.id}</span>
                                    <span className="text-white/40">{m.lang.toUpperCase()} · {new Date(m.createdAt).toLocaleDateString()}</span>
                                    <Link href={`/teacher/task/${m.id}?key=${m.key}`} className="ml-auto px-3 py-1 rounded-lg bg-white/10 font-black">{ui.results}</Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
