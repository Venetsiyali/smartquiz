'use client';

import { useMemo } from 'react';

interface RateLimitMessage {
    icon: string;
    title: string;
    body: string;
}

const MESSAGES: RateLimitMessage[] = [
    {
        icon: '☕',
        title: 'Kichik tanaffus!',
        body: "AI hozirgina kofe ichishga chiqib ketdi. Birozdan keyin qaytadi, ungacha bir nafas dam oling!",
    },
    {
        icon: '🔥',
        title: 'Miyalar qizib ketdi!',
        body: "Zukkoo AI hozir yangi bilimlarni hazm qilyapti. 5-10 daqiqada yana xizmatingizda bo'ladi.",
    },
    {
        icon: '😊',
        title: "Zo'r savol!",
        body: "Sizning bilimga chanqoqligingiz AIni charchatib qo'ydi! U biroz kuch to'plab olsin, keyin davom etamiz.",
    },
    {
        icon: '💤',
        title: 'AI dam olyapti...',
        body: "AI hozir kichik tanaffusda. U uyg'onishi bilan sizga javob beradi. Sabringiz uchun rahmat!",
    },
];

function formatWait(seconds: number): string {
    if (seconds < 10) return "Bir necha soniyadan keyin qayta urining";
    if (seconds < 60) return `~${seconds} soniyadan keyin qayta urining`;
    const mins = Math.ceil(seconds / 60);
    return `Taxminan ${mins} daqiqadan keyin qayta urining`;
}

interface Props {
    retryAfter: number | null;
    onClose: () => void;
}

export default function RateLimitModal({ retryAfter, onClose }: Props) {
    const msg = useMemo(
        () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(14px)' }}
        >
            <div
                className="w-full max-w-[340px] rounded-3xl p-8 flex flex-col items-center gap-5 text-center"
                style={{
                    background: 'linear-gradient(160deg, #070f24 0%, #0a1535 100%)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    boxShadow: '0 0 80px rgba(59,130,246,0.12), 0 32px 64px rgba(0,0,0,0.5)',
                }}
            >
                {/* Animated icon */}
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                    style={{
                        background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.08) 100%)',
                        border: '2px solid rgba(59,130,246,0.28)',
                        boxShadow: '0 0 24px rgba(59,130,246,0.15)',
                    }}
                >
                    <span className="animate-bounce inline-block">{msg.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-white font-black text-xl tracking-tight">{msg.title}</h3>

                {/* Friendly message */}
                <p className="text-white/55 text-sm font-semibold leading-relaxed">{msg.body}</p>

                {/* Retry-after badge */}
                {retryAfter !== null && retryAfter > 0 && (
                    <div
                        className="px-5 py-2 rounded-2xl text-sm font-bold"
                        style={{
                            background: 'rgba(251,191,36,0.1)',
                            color: '#fbbf24',
                            border: '1px solid rgba(251,191,36,0.22)',
                        }}
                    >
                        ⏱ {formatWait(retryAfter)}
                    </div>
                )}

                {/* Subtle system info */}
                <p className="text-white/22 text-xs font-semibold px-2">
                    Tizim buzilmagan — bu vaqtinchalik cheklov. Biroz kutib, qayta urining.
                </p>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl font-black text-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.15))',
                        color: '#60a5fa',
                        border: '1px solid rgba(59,130,246,0.35)',
                    }}
                >
                    Tushunarli, kutaman 👍
                </button>
            </div>
        </div>
    );
}
