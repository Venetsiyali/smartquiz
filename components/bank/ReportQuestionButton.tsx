'use client';

import { useState } from 'react';

const REASONS = [
    "To'g'ri javob noto'g'ri belgilangan",
    "Bir nechta to'g'ri javob bor",
    'Faktik xato',
    'Savol tushunarsiz',
    'Til yoki imlo xatosi',
];

type State = 'idle' | 'choosing' | 'sending' | 'done';

/** O'qituvchi ekranlarida: ombordagi savolda xato topilsa admin ko'rib chiqishiga yuboradi. */
export default function ReportQuestionButton({ questionText }: { questionText: string }) {
    const [state, setState] = useState<State>('idle');
    const [message, setMessage] = useState('');

    const send = async (reason: string) => {
        setState('sending');
        try {
            const res = await fetch('/api/bank/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: questionText, reason }),
            });
            const data = await res.json();
            if (res.status === 401) setMessage('Xabar berish uchun tizimga kiring');
            else if (!res.ok) setMessage(data.error || 'Yuborilmadi');
            else if (!data.found) setMessage("Rahmat! Bu savol tayyor savollar omboridan emas — uni o'zingiz tahrirlashingiz mumkin.");
            else if (data.alreadyReported) setMessage('Siz bu savol haqida allaqachon xabar bergansiz.');
            else if (data.hidden) setMessage("Rahmat! Savol admin ko'rib chiqquncha o'yinlardan olindi.");
            else setMessage("Rahmat! Xabaringiz admin ko'rib chiqishiga yuborildi.");
        } catch {
            setMessage('Server bilan aloqa yo\'q');
        }
        setState('done');
    };

    if (state === 'done') {
        return <p className="text-white/50 text-sm font-semibold">{message}</p>;
    }

    if (state === 'idle') {
        return (
            <button onClick={() => setState('choosing')} className="text-white/35 hover:text-white/70 text-sm font-bold transition-colors">
                ⚠️ Savolda xato bormi?
            </button>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            {REASONS.map(r => (
                <button key={r} onClick={() => send(r)} disabled={state === 'sending'}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-50 transition-colors">
                    {r}
                </button>
            ))}
            <button onClick={() => setState('idle')} disabled={state === 'sending'} className="px-2 text-white/30 hover:text-white/60 text-xs font-bold">
                Bekor
            </button>
        </div>
    );
}
