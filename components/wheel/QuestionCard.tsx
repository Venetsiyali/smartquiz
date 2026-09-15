'use client';

const OPTION_STYLES = [
    { bg: 'bg-red-600', icon: '🔴' },
    { bg: 'bg-blue-600', icon: '🔵' },
    { bg: 'bg-yellow-500', icon: '🟡' },
    { bg: 'bg-green-600', icon: '🟢' },
];

export default function QuestionCard({
    playerName,
    question,
    options,
    onSubmit,
    submitting,
}: {
    playerName: string;
    question: string;
    options: string[];
    onSubmit: (selectedIndex: number) => void;
    submitting: boolean;
}) {
    return (
        <div className="min-h-screen bg-zukkoo-dark flex flex-col items-center justify-center p-6">
            <div className="bg-zukkoo-blueLight/20 border border-zukkoo-blueLight/40 px-5 py-1.5 rounded-xl mb-5">
                <span className="text-white font-black text-lg">{playerName}</span>
            </div>

            <div className="glass max-w-3xl w-full rounded-3xl p-8 text-center mb-8">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{question}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {options.map((opt, idx) => (
                    <button
                        key={idx}
                        disabled={submitting}
                        onClick={() => onSubmit(idx)}
                        className={`${OPTION_STYLES[idx % 4].bg} disabled:opacity-50 text-white font-black text-lg md:text-xl rounded-2xl p-5 shadow-lg hover:scale-[1.02] active:scale-95 transition-transform text-left flex items-center gap-3`}
                    >
                        <span>{OPTION_STYLES[idx % 4].icon}</span>
                        <span>{opt}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
