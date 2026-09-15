'use client';

import type { WheelPlayerData } from './types';

function exportCsv(players: WheelPlayerData[]) {
    const header = 'Ism,Ball,To\'g\'ri,Noto\'g\'ri\n';
    const rows = players
        .map(p => `${p.name},${p.score},${p.correctCount},${p.wrongCount}`)
        .join('\n');
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bilimlar-gildiragi-natijalari.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];

export default function ResultsScreen({ players, onFinish }: { players: WheelPlayerData[]; onFinish: () => void }) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const podium = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    // Vizual tartib: 2-o'rin, 1-o'rin, 3-o'rin
    const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);
    const podiumHeights = ['h-28', 'h-36', 'h-20'];

    return (
        <div className="min-h-screen bg-zukkoo-dark flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl font-black text-white mb-1">🏆 Yakuniy natijalar</h1>
            <p className="text-white/40 font-bold mb-10">O&apos;yin yakunlandi</p>

            {podium.length > 0 && (
                <div className="flex items-end gap-4 mb-10">
                    {podiumOrder.map((p, i) => {
                        const medalIdx = podiumOrder === podium ? i : [1, 0, 2][i];
                        return (
                            <div key={p.id} className="flex flex-col items-center">
                                <div className="text-4xl mb-1">{PODIUM_MEDALS[medalIdx] ?? ''}</div>
                                <div
                                    className={`w-28 md:w-36 ${podiumHeights[i]} rounded-t-2xl flex flex-col items-center justify-center px-2`}
                                    style={{ background: i === 1 ? 'rgba(255,214,0,0.25)' : 'rgba(255,255,255,0.1)', border: `2px solid ${i === 1 ? 'rgba(255,214,0,0.5)' : 'rgba(255,255,255,0.15)'}` }}
                                >
                                    <span className="text-white font-black text-center truncate w-full">{p.name}</span>
                                    <span className="text-emerald-300 font-black text-lg">{p.score.toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="glass w-full max-w-2xl rounded-3xl p-6">
                <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 text-white/40 font-bold text-sm mb-2 px-2">
                    <span>#</span>
                    <span>Ism</span>
                    <span className="text-center">To&apos;g'/Not</span>
                    <span className="text-right">Ball</span>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {sorted.map((p, idx) => (
                        <div key={p.id} className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 items-center bg-white/5 rounded-xl px-2 py-2">
                            <span className="text-white/50 font-bold">{idx + 1}</span>
                            <span className="text-white font-bold truncate">{p.name}</span>
                            <span className="text-center text-sm">
                                <span className="text-emerald-400 font-bold">{p.correctCount}</span>
                                <span className="text-white/30"> / </span>
                                <span className="text-red-400 font-bold">{p.wrongCount}</span>
                            </span>
                            <span className="text-right text-emerald-300 font-black">{p.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl mt-8">
                <button onClick={() => exportCsv(sorted)} className="btn-primary flex-1 py-3.5 bg-gray-600 hover:bg-gray-500 shadow-none">
                    📊 CSV eksport
                </button>
                <button onClick={onFinish} className="btn-primary flex-1 py-3.5">
                    🏠 Yangi o&apos;yin
                </button>
            </div>
        </div>
    );
}
