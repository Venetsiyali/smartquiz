'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

interface WeekDay {
    date: string;
    count: number;
}

interface CsvRow {
    id: string;
    title: string;
    description: string;
    isPublic: string;
    questionCount: number;
    createdAt: string;
}

interface AnalyticsData {
    weekly: WeekDay[];
    csvData: CsvRow[];
}

function BarChart({ data }: { data: WeekDay[] }) {
    const max = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="flex items-end gap-2 h-40 w-full">
            {data.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.count / max) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                        className="w-full rounded-t-lg min-h-[4px]"
                        style={{
                            background: day.count > 0
                                ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)'
                                : 'rgba(255,255,255,0.05)',
                        }}
                    />
                    <span className="text-white/30 text-xs font-bold" style={{ fontSize: '0.6rem' }}>
                        {day.count > 0 ? day.count : ''}
                    </span>
                    <span
                        className="text-white/20 font-semibold text-center"
                        style={{ fontSize: '0.55rem', maxWidth: 36, lineHeight: 1.2 }}
                    >
                        {day.date.split(' ').slice(0, 2).join('\n')}
                    </span>
                </div>
            ))}
        </div>
    );
}

function downloadCSV(rows: CsvRow[]) {
    const headers = ['ID', 'Nomi', "Ta'rif", 'Ochiq/Yopiq', 'Savollar soni', 'Yaratilgan sana'];
    const csvContent = [
        headers.join(','),
        ...rows.map(r =>
            [r.id, `"${r.title}"`, `"${r.description}"`, r.isPublic, r.questionCount, r.createdAt].join(',')
        ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zukkoo-quizlar-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
    const { status } = useSession();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) ?? 'uz';

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') router.replace(`/${locale}/login`);
    }, [status, locale, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetch('/api/dashboard/sessions')
            .then(r => r.json())
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [status]);

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-64 text-white/30 font-bold text-lg">
                Yuklanmoqda...
            </div>
        );
    }

    const totalThisWeek = data?.weekly.reduce((s, d) => s + d.count, 0) ?? 0;
    const activeDays = data?.weekly.filter(d => d.count > 0).length ?? 0;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                <div>
                    <p className="text-white/30 text-xs font-bold tracking-widest uppercase mb-1">Boshqaruv paneli</p>
                    <h1 className="text-3xl font-black text-white">📈 Tahlil</h1>
                </div>
                {data && data.csvData.length > 0 && (
                    <button
                        onClick={() => downloadCSV(data.csvData)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:scale-105 shrink-0"
                        style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}
                    >
                        ⬇️ CSV eksport
                    </button>
                )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5 flex flex-col gap-2"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
                >
                    <p className="text-white/30 text-xs font-black uppercase tracking-wider">Bu hafta yaratildi</p>
                    <p className="text-3xl font-black text-blue-400">{totalThisWeek}</p>
                    <p className="text-white/30 text-xs font-semibold">so'nggi 7 kun</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl p-5 flex flex-col gap-2"
                    style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)' }}
                >
                    <p className="text-white/30 text-xs font-black uppercase tracking-wider">Faol kunlar</p>
                    <p className="text-3xl font-black" style={{ color: '#00E676' }}>{activeDays}</p>
                    <p className="text-white/30 text-xs font-semibold">7 kundan</p>
                </motion.div>
            </div>

            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl p-6 mb-8"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
                <h2 className="text-white font-black text-lg mb-5">Haftalik faollik</h2>
                {data && data.weekly.length > 0 ? (
                    <BarChart data={data.weekly} />
                ) : (
                    <div className="flex items-center justify-center h-40 text-white/20 font-bold text-sm">
                        Ma'lumot yo'q
                    </div>
                )}
            </motion.div>

            {/* CSV preview table */}
            {data && data.csvData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <h2 className="text-white font-black text-base">Barcha quizlar ({data.csvData.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Nomi', 'Savollar', 'Holati', 'Sana'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-white/25 font-black text-xs uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.csvData.map((row, i) => (
                                    <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                                        <td className="px-5 py-3 text-white font-bold max-w-[200px] truncate">{row.title}</td>
                                        <td className="px-5 py-3 text-white/50 font-semibold">{row.questionCount}</td>
                                        <td className="px-5 py-3">
                                            <span
                                                className="px-2 py-0.5 rounded-lg text-xs font-black"
                                                style={row.isPublic === 'Ha'
                                                    ? { background: 'rgba(0,230,118,0.1)', color: '#00E676' }
                                                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                                                }
                                            >
                                                {row.isPublic}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-white/30 text-xs font-semibold">{row.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
