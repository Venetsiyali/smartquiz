'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Row { id: string; topicId: string; lang: string; title: string; createdAt: number; submissions: number }

/** Admin: barcha "Topshiriq"lar va ularning natijalari (PsixoLab · Auditoriya mashgʻulotlari). */
export default function AdminTasksPage() {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        fetch('/api/task/list', { cache: 'no-store' }).then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error); setRows(d.tasks);
        }).catch(e => setError(e.message));
    }, []);
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">🎓 Topshiriqlar (PsixoLab)</h1>
            {error && <p className="text-red-300 font-bold">⚠️ {error}</p>}
            {rows && rows.length === 0 && <p className="text-white/50">Hali topshiriq yaratilmagan</p>}
            {rows && rows.length > 0 && (
                <div className="rounded-2xl border border-white/10 overflow-x-auto">
                    <table className="w-full text-sm text-white">
                        <thead className="bg-white/5 text-white/50 text-xs">
                            <tr><th className="p-3 text-left">Mavzu</th><th className="p-3 text-left">Nomi</th><th className="p-3">Til</th><th className="p-3">Yaratilgan</th><th className="p-3">Topshirganlar</th><th className="p-3" /></tr>
                        </thead>
                        <tbody>
                            {rows.map(r => (
                                <tr key={r.id} className="border-t border-white/5">
                                    <td className="p-3 font-black text-violet-300">{r.topicId}</td>
                                    <td className="p-3">{r.title}</td>
                                    <td className="p-3 text-center">{r.lang.toUpperCase()}</td>
                                    <td className="p-3 text-center text-white/60">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3 text-center font-black">{r.submissions}</td>
                                    <td className="p-3 text-right"><Link href={`/teacher/task/${r.id}`} className="px-3 py-1 rounded-lg bg-white/10 font-black">📊 Natijalar</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
