'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// QR ishlamasa: o'quvchi kitobdagi yoki o'qituvchi bergan kodni qo'lda kiritadi
export default function AssignmentCodePage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

    return (
        <div className="min-h-screen bg-zukkoo-dark text-white flex items-center justify-center px-4">
            <form className="glass rounded-3xl p-8 w-full max-w-sm space-y-4 text-center"
                onSubmit={e => { e.preventDefault(); if (clean.length >= 4) router.push(`/v/${clean}`); }}>
                <div className="text-5xl">📅</div>
                <h1 className="text-2xl font-black">Topshiriq kodi</h1>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="K7M2QX" maxLength={12} autoFocus
                    className="w-full text-center tracking-[0.3em] text-2xl font-black rounded-xl bg-white/10 border border-white/10 px-4 py-3 uppercase outline-none focus:border-blue-400" />
                <button type="submit" disabled={clean.length < 4} className="btn-primary w-full py-3.5 disabled:opacity-40">Ochish</button>
            </form>
        </div>
    );
}
