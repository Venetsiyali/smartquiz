'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { missionByCode } from '@/lib/masofalab/missions';

interface Session { pin: string; mission: string; students: number; session_at: string }

export default function AdminMasofaPage() {
    const [list, setList] = useState<Session[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        fetch('/api/masofa/sessions', { cache: 'no-store' })
            .then(async r => { const d = await r.json(); if (r.ok) setList(d.sessions); else setError(d.error); })
            .catch(() => setError('Tarmoq xatosi'));
    }, []);
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">🌐 MasofaLab mashgʻulotlari</h1>
            {error && <p className="text-red-300 font-bold">⚠️ {error}</p>}
            {list && list.length === 0 && <p className="text-white/50">Hali mashgʻulot yoʻq</p>}
            <div className="space-y-2">
                {list?.map(s => (
                    <div key={s.pin} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white">
                        <span className="font-black text-teal-300">{s.mission}</span>
                        <span className="flex-1 min-w-[160px]">{missionByCode(s.mission)?.title}</span>
                        <span className="text-white/50">PIN {s.pin} · 👥 {s.students} · {new Date(s.session_at).toLocaleString()}</span>
                        <Link href={`/teacher/masofa/results?pin=${s.pin}`} className="px-3 py-1 rounded-lg bg-white/10 font-black">📊</Link>
                        <a href={`/api/masofa/export?pin=${s.pin}`} className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 font-black">📥 Excel</a>
                    </div>
                ))}
            </div>
        </div>
    );
}
