'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    questionCount: number;
}

interface ApiResponse {
    quizzes: Quiz[];
    total: number;
    pages: number;
    page: number;
}

export default function QuizzesPage() {
    const { status } = useSession();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) ?? 'uz';

    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
    const [page, setPage] = useState(1);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const t = useTranslations('Quizzes');

    useEffect(() => {
        if (status === 'unauthenticated') router.replace(`/${locale}/login`);
    }, [status, locale, router]);

    // Debounce search input — reset to page 1 and delay API call
    useEffect(() => {
        setPage(1);
        const id = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(id);
    }, [search]);

    useEffect(() => { setPage(1); }, [filter]);

    const loadQuizzes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search: debouncedSearch, filter, page: String(page) });
            const res = await fetch(`/api/dashboard/quizzes?${params}`);
            const json = await res.json();
            setData(json);
        } catch { /* noop */ } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filter, page]);

    useEffect(() => {
        if (status === 'authenticated') loadQuizzes();
    }, [status, loadQuizzes]);

    async function handleDelete(id: string) {
        setDeleting(id);
        try {
            await fetch(`/api/dashboard/quizzes?id=${id}`, { method: 'DELETE' });
            await loadQuizzes();
        } finally {
            setDeleting(null);
            setConfirmDelete(null);
        }
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                <div>
                    <p className="text-white/30 text-xs font-bold tracking-widest uppercase mb-1">{t('breadcrumb')}</p>
                    <h1 className="text-3xl font-black text-white">{t('title')}</h1>
                </div>
                <Link
                    href={`/${locale}/quiz/create`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:scale-105 shrink-0"
                    style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.25)' }}
                >
                    {t('newQuiz')}
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white placeholder-white/30 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <div className="flex gap-2">
                    {(['all', 'public', 'private'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className="px-4 py-2.5 rounded-xl text-sm font-black transition-all"
                            style={filter === f
                                ? { background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }
                                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }
                            }
                        >
                            {f === 'all' ? t('filterAll') : f === 'public' ? t('filterPublic') : t('filterPrivate')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-white/30 font-bold">{t('loading')}</div>
                ) : !data || data.quizzes.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <span className="text-4xl">🧩</span>
                        <p className="text-white/40 font-bold">{t('notFound')}</p>
                        {search && (
                            <button onClick={() => setSearch('')} className="text-blue-400 text-sm font-bold hover:underline">
                                {t('clearSearch')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table header */}
                        <div className="hidden md:grid grid-cols-[1fr_80px_90px_100px_120px] px-5 py-3 border-b border-white/5">
                            {[t('colName'), t('colQuestions'), t('colStatus'), t('colCreated'), t('colActions')].map(h => (
                                <span key={h} className="text-white/25 text-xs font-black uppercase tracking-wider">{h}</span>
                            ))}
                        </div>

                        {data.quizzes.map((quiz, i) => (
                            <motion.div
                                key={quiz.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex flex-col md:grid md:grid-cols-[1fr_80px_90px_100px_120px] items-start md:items-center gap-2 md:gap-0 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                            >
                                <div className="min-w-0 w-full">
                                    <p className="text-white font-bold text-sm truncate">{quiz.title}</p>
                                    {quiz.description && (
                                        <p className="text-white/30 text-xs truncate">{quiz.description}</p>
                                    )}
                                </div>
                                <span className="text-white/50 text-sm font-bold">{quiz.questionCount}</span>
                                <span
                                    className="px-2 py-0.5 rounded-lg text-xs font-black w-fit"
                                    style={quiz.isPublic
                                        ? { background: 'rgba(0,230,118,0.1)', color: '#00E676' }
                                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                                    }
                                >
                                    {quiz.isPublic ? t('filterPublic') : t('filterPrivate')}
                                </span>
                                <span className="text-white/30 text-xs font-semibold">
                                    {new Date(quiz.createdAt).toLocaleDateString('uz-UZ')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/${locale}/quiz/create?edit=${quiz.id}`}
                                        className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105"
                                        style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
                                    >
                                        {t('edit')}
                                    </Link>
                                    <button
                                        onClick={() => setConfirmDelete(quiz.id)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                                    >
                                        {t('delete')}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </>
                )}
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-30 transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
                    >
                        {t('prev')}
                    </button>
                    <span className="text-white/40 text-sm font-bold px-2">{page} / {data.pages}</span>
                    <button
                        disabled={page === data.pages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 rounded-xl text-sm font-black disabled:opacity-30 transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
                    >
                        {t('next')}
                    </button>
                </div>
            )}

            {/* Delete confirm modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setConfirmDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="rounded-2xl p-7 max-w-sm w-full flex flex-col gap-4 text-center"
                            style={{ background: 'rgba(10,14,30,0.98)', border: '1px solid rgba(239,68,68,0.3)' }}
                        >
                            <span className="text-4xl">🗑️</span>
                            <h3 className="text-white font-black text-xl">{t('deleteTitle')}</h3>
                            <p className="text-white/50 text-sm">{t('deleteConfirm')}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl font-black text-sm text-white/50 transition-all hover:text-white"
                                    style={{ background: 'rgba(255,255,255,0.06)' }}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={() => handleDelete(confirmDelete)}
                                    disabled={deleting === confirmDelete}
                                    className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all hover:scale-105 disabled:opacity-60"
                                    style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                >
                                    {deleting === confirmDelete ? t('deleting') : t('delete')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
