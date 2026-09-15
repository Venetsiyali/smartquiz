'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

function fireConfetti() {
    const colors = ['#0056b3', '#FFD600', '#00E676', '#FF1744', '#ffffff'];
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });
}

export default function AnswerFeedback({
    isCorrect,
    options,
    correctIndex,
    selectedIndex,
    explanation,
    onContinue,
}: {
    isCorrect: boolean;
    options: string[];
    correctIndex: number;
    selectedIndex: number;
    explanation: string;
    onContinue: () => void;
}) {
    useEffect(() => {
        if (isCorrect) fireConfetti();
    }, [isCorrect]);

    return (
        <div className="min-h-screen bg-zukkoo-dark flex flex-col items-center justify-center p-6">
            <div className="text-center mb-6">
                {isCorrect ? (
                    <>
                        <div className="text-7xl mb-2 animate-bounce-in">🎉</div>
                        <p className="text-emerald-400 font-black text-4xl">Barakalla!</p>
                    </>
                ) : (
                    <>
                        <div className="text-7xl mb-2 animate-bounce-in">😔</div>
                        <p className="text-red-400 font-black text-4xl">Noto&apos;g&apos;ri javob</p>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-6">
                {options.map((opt, idx) => {
                    const isRight = idx === correctIndex;
                    const isPicked = idx === selectedIndex;
                    return (
                        <div
                            key={idx}
                            className={`rounded-2xl p-5 font-black text-lg border-2 ${
                                isRight
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                    : isPicked
                                        ? 'bg-red-500/20 border-red-400 text-red-300'
                                        : 'bg-white/5 border-white/10 text-white/40'
                            }`}
                        >
                            {isRight ? '✓ ' : isPicked ? '✕ ' : ''}{opt}
                        </div>
                    );
                })}
            </div>

            {explanation && (
                <div className="glass max-w-3xl w-full rounded-2xl p-5 mb-8">
                    <p className="text-white/50 font-bold text-sm mb-1">💡 Nega bu javob to&apos;g&apos;ri:</p>
                    <p className="text-white font-semibold text-lg">{explanation}</p>
                </div>
            )}

            <button onClick={onContinue} className="btn-primary px-10 py-4 text-lg">
                Davom etish →
            </button>
        </div>
    );
}
