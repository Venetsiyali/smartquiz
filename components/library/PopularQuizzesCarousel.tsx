'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

const SUBJECTS = ['Barchasi', 'Matematika', 'Tarix', 'Biologiya', 'Fizika', 'DTM'];

const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'Trendda':           { label: '🔥 Trendda',           color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    'Moderator tanlovi': { label: '⭐ Moderator tanlovi', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
    "Yangi qo'shildi":  { label: "✨ Yangi",              color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    'DTM tayyorlov':     { label: '🎯 DTM',               color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
};

interface LibraryQuiz {
    id: string;
    title: string;
    subject: string;
    grade: string;
    game_type: string;
    badge_type: string;
    play_count: number;
    rating: number;
    questions: unknown[];
}

const CARD_WIDTH = 292; // px (280 + 12 gap approximation for dot tracking)

export default function PopularQuizzesCarousel() {
    const [activeSubject, setActiveSubject] = useState('Barchasi');
    const [quizzes, setQuizzes] = useState<LibraryQuiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [copyState, setCopyState] = useState<Record<string, 'copying' | 'done'>>({});
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) ?? 'uz';
    const { data: session } = useSession();

    useEffect(() => {
        setLoading(true);
        setActiveIndex(0);
        const sub = activeSubject === 'Barchasi' ? '' : activeSubject;
        fetch(`/api/library/quizzes${sub ? `?subject=${encodeURIComponent(sub)}` : ''}`)
            .then(r => r.json())
            .then(d => setQuizzes(d.quizzes ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [activeSubject]);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current || quizzes.length <= 1) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        if (maxScroll <= 0) return;
        const ratio = scrollLeft / maxScroll;
        const idx = Math.round(ratio * (quizzes.length - 1));
        setActiveIndex(Math.max(0, Math.min(idx, quizzes.length - 1)));
    }, [quizzes.length]);

    const scrollToIndex = (i: number) => {
        if (!scrollRef.current || quizzes.length <= 1) return;
        const { scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const ratio = i / Math.max(quizzes.length - 1, 1);
        scrollRef.current.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
    };

    const handlePlay = (quiz: LibraryQuiz) => {
        fetch(`/api/library/quizzes/${quiz.id}/play`, { method: 'POST' }).catch(() => {});
        router.push(`/${locale}/play`);
    };

    const handleCopy = async (quiz: LibraryQuiz) => {
        if (!session?.user) { router.push(`/${locale}/login`); return; }
        setCopyState(s => ({ ...s, [quiz.id]: 'copying' }));
        try {
            const res = await fetch(`/api/library/quizzes/${quiz.id}/copy`, { method: 'POST' });
            if (res.ok) {
                setCopyState(s => ({ ...s, [quiz.id]: 'done' }));
                setTimeout(() => setCopyState(s => { const n = { ...s }; delete n[quiz.id]; return n; }), 2500);
            } else {
                setCopyState(s => { const n = { ...s }; delete n[quiz.id]; return n; });
            }
        } catch {
            setCopyState(s => { const n = { ...s }; delete n[quiz.id]; return n; });
        }
    };

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-black text-xl flex items-center gap-2">
                    🔥 Mashhur quizlar
                </h2>
                <button
                    onClick={() => router.push(`/${locale}/play`)}
                    className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                    Barchasini ko&apos;r <span>→</span>
                </button>
            </div>

            {/* Subject filter tabs */}
            <div
                className="flex gap-2 mb-4 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
                {SUBJECTS.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setActiveSubject(sub)}
                        className="shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-200"
                        style={{
                            background: activeSubject === sub ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                            color: activeSubject === sub ? '#60a5fa' : 'rgba(255,255,255,0.45)',
                            border: activeSubject === sub
                                ? '1px solid rgba(59,130,246,0.4)'
                                : '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            {/* Carousel body */}
            {loading ? (
                <div
                    className="h-[220px] rounded-3xl flex items-center justify-center animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <span className="text-white/20 font-bold text-sm">Yuklanmoqda...</span>
                </div>
            ) : quizzes.length === 0 ? (
                <div
                    className="h-[220px] rounded-3xl flex flex-col items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <span className="text-3xl opacity-30">📭</span>
                    <span className="text-white/25 font-bold text-sm">Bu bo&apos;limda quizlar yo&apos;q</span>
                </div>
            ) : (
                <>
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex gap-4 overflow-x-auto pb-2"
                        style={{
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                        } as React.CSSProperties}
                    >
                        {quizzes.map(quiz => {
                            const badge = BADGE_CONFIG[quiz.badge_type];
                            const cs = copyState[quiz.id];
                            const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;

                            return (
                                <div
                                    key={quiz.id}
                                    className="shrink-0 w-[280px] sm:w-[300px] rounded-2xl p-5 flex flex-col gap-3"
                                    style={{
                                        scrollSnapAlign: 'start',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    {/* Badge */}
                                    {badge && (
                                        <span
                                            className="self-start text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
                                            style={{
                                                background: badge.bg,
                                                color: badge.color,
                                                border: `1px solid ${badge.color}55`,
                                            }}
                                        >
                                            {badge.label}
                                        </span>
                                    )}

                                    {/* Title */}
                                    <h3 className="text-white font-black text-base leading-snug line-clamp-2 flex-1">
                                        {quiz.title}
                                    </h3>

                                    {/* Meta tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {[quiz.grade, quiz.subject, `${qCount} savol`].map(tag => (
                                            <span
                                                key={tag}
                                                className="text-[11px] text-white/40 font-semibold px-2 py-0.5 rounded-md"
                                                style={{ background: 'rgba(255,255,255,0.05)' }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-xs text-white/35 font-bold">
                                        <span>▶ {quiz.play_count.toLocaleString()} marta</span>
                                        <span>⭐ {quiz.rating > 0 ? quiz.rating.toFixed(1) : '—'}</span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => handlePlay(quiz)}
                                            className="flex-1 py-2 rounded-xl font-black text-xs transition-all hover:scale-105 active:scale-95"
                                            style={{
                                                background: 'linear-gradient(135deg, #00E676, #00b894)',
                                                color: '#0a0e1e',
                                            }}
                                        >
                                            ▶ O&apos;ynash
                                        </button>
                                        <button
                                            onClick={() => handleCopy(quiz)}
                                            disabled={cs === 'copying'}
                                            className="px-3 py-2 rounded-xl font-black text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                                            style={{
                                                background: cs === 'done'
                                                    ? 'rgba(0,230,118,0.15)'
                                                    : 'rgba(255,255,255,0.06)',
                                                color: cs === 'done' ? '#00E676' : 'rgba(255,255,255,0.65)',
                                                border: cs === 'done'
                                                    ? '1px solid rgba(0,230,118,0.3)'
                                                    : '1px solid rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            {cs === 'copying' ? '⏳' : cs === 'done' ? '✓ Saqlandi' : '📋 Nusxa'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation dots */}
                    {quizzes.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-3">
                            {quizzes.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => scrollToIndex(i)}
                                    className="h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                        width: activeIndex === i ? 24 : 6,
                                        background: activeIndex === i
                                            ? '#3b82f6'
                                            : 'rgba(255,255,255,0.18)',
                                    }}
                                    aria-label={`Karta ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
