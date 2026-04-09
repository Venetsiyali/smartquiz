'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Quiz {
    id: string;
    title: string;
    description?: string;
    questions: any[];
    createdAt: string;
}

export default function MyQuizzesPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/quiz/list')
            .then(res => res.json())
            .then(data => {
                if (data.success) setQuizzes(data.quizzes);
                else setError('Savollarni yuklashda xatolik');
            })
            .catch(() => setError('Server bilan aloqa uzildi'))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('uz-Latn-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const startFromSaved = async (quiz: Quiz) => {
        // Saqlangan savollarni sessionStorage ga joylash va o'yinni boshlash
        const res = await fetch('/api/game/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizTitle: quiz.title, questions: quiz.questions }),
        });
        const data = await res.json();
        if (res.ok) {
            sessionStorage.setItem('gamePin', data.pin);
            router.push('/teacher/lobby');
        } else {
            alert("O'yinni boshlashda xatolik: " + (data.error || ''));
        }
    };

    return (
        <div className="bg-host min-h-screen">
            <header className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <button onClick={() => router.push('/')} className="text-white/50 hover:text-white text-2xl transition-colors">←</button>
                <span className="text-xl font-black text-white">Mening <span className="text-blue-400">Savollarim</span></span>
                <span className="text-white/30">·</span>
                <span className="text-white/40 text-sm font-bold">{quizzes.length} ta saqlangan</span>
                <div className="ml-auto">
                    <button onClick={() => router.push('/teacher/create')}
                        className="btn-primary text-sm px-4 py-2.5">
                        + Yangi O'yin
                    </button>
                </div>
            </header>

            <div className="p-5 md:p-8 max-w-5xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-white/40 font-bold">Yuklanmoqda...</p>
                    </div>
                ) : error ? (
                    <div className="glass p-8 rounded-3xl text-center">
                        <div className="text-4xl mb-3">⚠️</div>
                        <p className="text-red-400 font-bold">{error}</p>
                        <p className="text-white/30 text-sm mt-2">Iltimos, avval tizimga kiring</p>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="glass p-16 rounded-3xl text-center">
                        <div className="text-7xl mb-5">📚</div>
                        <h2 className="text-white text-2xl font-black mb-2">Hali hech narsa saqlanmagan</h2>
                        <p className="text-white/40 font-bold mb-6">O'yin yaratib, "Savollarni Saqlash" tugmasini bosing</p>
                        <button onClick={() => router.push('/teacher/create')} className="btn-primary">
                            Birinchi O'yinni Yaratish
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quizzes.map((quiz) => {
                            const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
                            const types = Array.isArray(quiz.questions)
                                ? [...new Set(quiz.questions.map((q: any) => q.type || 'multiple'))]
                                : [];

                            return (
                                <div key={quiz.id} className="glass rounded-3xl p-5 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-200"
                                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {/* Sarlavha */}
                                    <div>
                                        <h3 className="text-white font-black text-lg leading-tight truncate">{quiz.title || "Nomsiz O'yin"}</h3>
                                        <p className="text-white/30 text-xs font-bold mt-0.5">{formatDate(quiz.createdAt)}</p>
                                    </div>

                                    {/* Savollar soni va tur belgilari */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white/60 text-sm font-bold">📋 {qCount} ta savol</span>
                                        {types.map(tp => (
                                            <span key={tp} className="px-2 py-0.5 rounded-lg text-xs font-bold"
                                                style={{
                                                    background: tp === 'order' ? 'rgba(255,215,0,0.12)' : tp === 'match' ? 'rgba(167,139,250,0.12)' : tp === 'blitz' ? 'rgba(239,68,68,0.12)' : tp === 'anagram' ? 'rgba(99,102,241,0.12)' : tp === 'truefalse' ? 'rgba(0,230,118,0.12)' : 'rgba(0,86,179,0.12)',
                                                    color: tp === 'order' ? '#FFD700' : tp === 'match' ? '#a78bfa' : tp === 'blitz' ? '#f87171' : tp === 'anagram' ? '#818cf8' : tp === 'truefalse' ? '#00E676' : '#60a5fa'
                                                }}>
                                                {tp === 'multiple' ? 'MCQ' : tp === 'truefalse' ? 'T/F' : tp === 'order' ? 'Tartib' : tp === 'match' ? 'Moslik' : tp === 'blitz' ? 'Blitz' : tp === 'anagram' ? 'Anagram' : tp}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Tugmalar */}
                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => startFromSaved(quiz)}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                                            style={{ background: 'linear-gradient(135deg,#0056b3,#0099ff)' }}>
                                            ▶ O'yinni Boshlash
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
