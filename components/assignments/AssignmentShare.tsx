'use client';

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/** Topshiriq havolasi: QR (PNG yuklab olish), nusxa olish, kod. */
export default function AssignmentShare({ url, code, title }: { url: string; code: string; title: string }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            prompt('Havolani nusxalang:', url);
        }
    };

    const download = () => {
        const canvas = wrapRef.current?.querySelector('canvas');
        if (!canvas) return;
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `topshiriq_${code}_${title.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40)}.png`;
        a.click();
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <div ref={wrapRef} className="bg-white p-3 rounded-2xl shrink-0">
                {/* Ekranda kichik, yuklab olinganda 600px — chop etish uchun yetarli */}
                <QRCodeCanvas value={url} size={600} level="Q" includeMargin style={{ width: 180, height: 180 }} />
            </div>
            <div className="flex-1 w-full space-y-3 min-w-0">
                <div>
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Havola</p>
                    <p className="font-mono text-sm text-blue-300 break-all">{url}</p>
                </div>
                <div>
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Kod (QR ishlamasa: zukkoo.uz/v)</p>
                    <p className="font-black text-3xl tracking-[0.25em]">{code}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={copy} className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 transition-colors">
                        {copied ? '✓ Nusxalandi' : '🔗 Havolani nusxalash'}
                    </button>
                    <button onClick={download} className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 transition-colors">
                        ⬇️ QR (PNG)
                    </button>
                    <a href={url} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 transition-colors">
                        👁 Oʻquvchi koʻrinishi
                    </a>
                </div>
            </div>
        </div>
    );
}
