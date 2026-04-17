'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { getLevelFromXP } from '@/lib/gamification/xp';
import { MascotSprite } from '@/components/gamification/MascotSprite';

interface Stats {
    totalQuizzes: number;
    publicQuizzes: number;
    privateQuizzes: number;
    totalGamesPlayed: number;
    xp: number;
    streak: number;
    memberSince: string | null;
    recentQuizzes: {
        id: string;
        title: string;
        isPublic: boolean;
        createdAt: string;
        questionCount: number;
    }[];
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: number | string; sub?: string; color?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <span className="text-2xl">{icon}</span>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-black" style={{ color: color ?? 'white' }}>{value}</p>
            {sub && <p className="text-white/30 text-xs font-semibold">{sub}</p>}
        </motion.div>
    );
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) ?? 'uz';
    const t = useTranslations('Dashboard');

    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace(`/${locale}/login`);
        }
    }, [status, locale, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetch('/api/dashboard/stats')
            .then(r => r.json())
            .then(setStats)
            .catch(() => {});
    }, [status]);

    if (status === 'loading' || stats === null) {
        return (
            <div className="flex items-center justify-center min-h-64 text-white/30 font-bold text-lg">
                {t('loading')}
            </div>
        );
    }

    const level = getLevelFromXP(stats.xp);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header with Mascots */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-center justify-between rounded-3xl p-6 sm:p-8 relative overflow-hidden"
                style={{ 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                }}
            >
                {/* Left Mascot (Boy) */}
                <div className="hidden md:flex transform transition-transform hover:scale-110 hover:-rotate-3 duration-300 z-10 w-32 justify-center">
                    <MascotSprite state="idle_boy" size={130} />
                </div>
                
                {/* Center Content */}
                <div className="text-center flex-1 z-20 flex flex-col items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                        <span className="text-amber-400 text-xs font-black tracking-widest uppercase">{t('platform')}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-3 drop-shadow-sm">
                        {`Salom, ${session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'do\'st'}!`} 👋
                    </h1>
                    <p className="text-white/60 text-sm font-semibold flex items-center gap-2 bg-black/20 px-5 py-2 rounded-2xl border border-black/20 backdrop-blur-sm" style={{ color: level.color ?? '#facc15' }}>
                        <span className="text-lg">{level.icon}</span> 
                        {level.name} <span className="text-white/20">|</span> <span className="text-white">{stats.xp.toLocaleString()} XP</span>
                    </p>
                </div>

                {/* Right Mascot (Girl) */}
                <div className="hidden md:flex transform transition-transform hover:scale-110 hover:rotate-3 duration-300 z-10 w-32 justify-center">
                    <MascotSprite state="idle_girl" size={130} />
                </div>
                
                {/* Decorative Background Accents */}
                <div className="absolute top-[-50%] left-[-10%] w-[40%] h-[200%] bg-blue-500/10 blur-[100px] z-0 pointer-events-none rounded-full rotate-12"></div>
                <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[200%] bg-purple-500/10 blur-[100px] z-0 pointer-events-none rounded-full -rotate-12"></div>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon="🧩" label={t('totalQuizzes')} value={stats.totalQuizzes} />
                <StatCard icon="🌐" label={t('publicQuizzes')} value={stats.publicQuizzes} color="#3b82f6" />
                <StatCard icon="🎮" label={t('gamesPlayed')} value={stats.totalGamesPlayed} color="#00E676" />
                <StatCard icon="🔥" label="Streak" value={stats.streak} sub={t('streakDays')} color="#f97316" />
            </div>

            {/* Recent quizzes */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-black text-xl">{t('recentQuizzes')}</h2>
                    <Link
                        href={`/${locale}/dashboard/quizzes`}
                        className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors"
                    >
                        {t('viewAll')}
                    </Link>
                </div>

                {stats.recentQuizzes.length === 0 ? (
                    <div
                        className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        <span className="text-4xl">🧩</span>
                        <p className="text-white/50 font-bold">{t('noQuizzes')}</p>
                        <Link
                            href={`/${locale}/quiz/create`}
                            className="px-5 py-2 rounded-xl font-black text-sm transition-all hover:scale-105"
                            style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.25)' }}
                        >
                            {t('createFirst')}
                        </Link>
                    </div>
                ) : (
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        {stats.recentQuizzes.map((quiz, i) => (
                            <motion.div
                                key={quiz.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                            >
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                                    style={{ background: 'rgba(59,130,246,0.15)' }}
                                >
                                    🧩
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{quiz.title}</p>
                                    <p className="text-white/30 text-xs font-semibold">
                                        {quiz.questionCount} {t('questions')} · {new Date(quiz.createdAt).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                                    </p>
                                </div>
                                <span
                                    className="shrink-0 px-2 py-0.5 rounded-lg text-xs font-black"
                                    style={quiz.isPublic
                                        ? { background: 'rgba(0,230,118,0.1)', color: '#00E676' }
                                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                                    }
                                >
                                    {quiz.isPublic ? t('public') : t('private')}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { href: `/${locale}/quiz/create`, icon: '➕', label: t('createQuizAction'), color: '#00E676' },
                    { href: `/${locale}/play`, icon: '🎮', label: t('startGameAction'), color: '#3b82f6' },
                    { href: `/${locale}/dashboard/analytics`, icon: '📈', label: t('analyticsAction'), color: '#8b5cf6' },
                ].map(action => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                        style={{
                            background: `${action.color}12`,
                            border: `1px solid ${action.color}25`,
                            color: action.color,
                        }}
                    >
                        <span className="text-xl">{action.icon}</span>
                        <span>{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
