'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Row {
    id: string; code: string; title: string; status: string; opensAt: string | null; closesAt: string | null;
    createdAt: string; questionCount: number; submittedCount: number; url: string;
}

const fmt = (s: string) => new Date(s).toLocaleDateString('uz-Latn-UZ', { day: '2-digit', month: 'short', year: 'numeric' });

function statusOf(r: Row): { label: string; color: string } {
    const now = Date.now();
    if (r.status !== 'ACTIVE') return { label: 'Yopilgan', color: '#f87171' };
    if (r.closesAt && new Date(r.closesAt).getTime() < now) return { label: 'Muddati tugagan', color: '#f87171' };
    if (r.opensAt && new Date(r.opensAt).getTime() > now) return { label: 'Kutilmoqda', color: '#FFD600' };
    return { label: 'Ochiq', color: '#00E676' };
}

export default function AssignmentsPage() {
    const router = useRouter();
    const [rows, setRows] = useState<Row[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/assignments', { cache: 'no-store' })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Xatolik');
                setRows(data.assignments);
            })
            .catch(err => setError(err.message || 'Server bilan aloqa uzildi'));
    }, []);

    return (
        <div className="bg-host min-h-screen">
            <header className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <button onClick={() => router.push('/dashboard')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
                <span className="text-xl font-black text-white">📅 Topshiriqlar</span>
                <div className="ml-auto">
                    <button onClick={() => router.push('/teacher/assignments/new')} className="btn-primary text-sm px-4 py-2.5">+ Yangi topshiriq</button>
                </div>
            </header>

            <div className="p-5 md:p-8 max-w-5xl mx-auto">
                <p className="text-white/50 font-semibold mb-6 max-w-2xl">
                    Topshiriq — oʻquvchilar QR kod yoki havola orqali <b className="text-white/80">istalgan vaqtda</b> oʻzi yechadigan test.
                    Jonli oʻyin shart emas: natijalar shu yerda yigʻiladi.
                </p>
                {error ? (
                    <div className="glass p-8 rounded-3xl text-center">
                        <div className="text-4xl mb-3">⚠️</div>
                        <p className="text-red-400 font-bold">{error}</p>
                    </div>
                ) : rows === null ? (
                    <p className="text-white/40 font-bold text-center py-20">Yuklanmoqda...</p>
                ) : rows.length === 0 ? (
                    <div className="glass p-10 rounded-3xl text-center">
                        <div className="text-5xl mb-3">📅</div>
                        <p className="text-white font-black text-xl mb-2">Hali topshiriq yoʻq</p>
                        <p className="text-white/40 mb-5">Savollarni fayldan yuklang yoki muharrirda tuzib, topshiriqqa aylantiring.</p>
                        <button onClick={() => router.push('/teacher/assignments/new')} className="btn-primary px-6 py-3">+ Birinchi topshiriq</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map(r => {
                            const st = statusOf(r);
                            return (
                                <button key={r.id} onClick={() => router.push(`/teacher/assignments/${r.id}`)}
                                    className="glass w-full rounded-2xl p-5 text-left flex items-center gap-4 hover:bg-white/10 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-black text-lg truncate">{r.title}</p>
                                        <p className="text-white/40 text-sm font-semibold mt-0.5">
                                            {r.questionCount} ta savol · kod <span className="font-mono text-white/60">{r.code}</span> · {fmt(r.createdAt)}
                                            {r.closesAt && <> · {fmt(r.closesAt)} gacha</>}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-white font-black text-2xl">{r.submittedCount}</p>
                                        <p className="text-white/40 text-xs font-bold">topshirgan</p>
                                    </div>
                                    <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black" style={{ color: st.color, background: `${st.color}22` }}>{st.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
