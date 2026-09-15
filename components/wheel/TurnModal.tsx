'use client';

import { useEffect } from 'react';

export default function TurnModal({ name, onDone }: { name: string; onDone: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onDone, 1800);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={onDone}>
            <div className="animate-bounce-in text-center">
                <p className="text-white/60 font-bold text-2xl mb-2">Navbat:</p>
                <p className="text-white font-black text-6xl md:text-7xl drop-shadow-lg">{name}</p>
                <p className="text-white/30 font-semibold mt-6">Davom etish uchun bosing</p>
            </div>
        </div>
    );
}
