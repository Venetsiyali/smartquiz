'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─────────────────────────────────────────────────────────── */
export interface MatchPair {
    term: string;
    definition: string;
    termImage?: string;
    definitionImage?: string;
}

interface MatchCard {
    id: string;
    pairId: number;
    side: 'term' | 'def';
    text: string;
    imageUrl?: string;
    matched: boolean;
}

export interface MatchResult {
    totalPairs: number;
    completedMs: number;
    mistakes: number;
    cleanSweep: boolean;
    points: number;
}

interface MatchGameProps {
    pairs: MatchPair[];
    timeLimit: number;      // seconds (used for time-bonus calc)
    onComplete: (result: MatchResult) => void;
    result: MatchResult | null;   // null until submitted
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const PAIR_COLORS = [
    '#e11d48', '#1d4ed8', '#b45309', '#15803d',
    '#7c3aed', '#0891b2', '#be185d', '#d97706',
];

/* ─── Card Component ─────────────────────────────────────────────────── */
function MatchCardEl({
    card, selected, shake, onSelect, color,
}: {
    card: MatchCard;
    selected: boolean;
    shake: boolean;
    onSelect: (id: string) => void;
    color: string;
}) {
    return (
        <motion.button
            layout
            onClick={() => onSelect(card.id)}
            disabled={card.matched}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={
                card.matched
                    ? { scale: 0, opacity: 0, transition: { duration: 0.35, ease: 'backIn' } }
                    : shake
                        ? { x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.45 } }
                        : { scale: selected ? 1.06 : 1, opacity: 1 }
            }
            style={{
                pointerEvents: card.matched ? 'none' : 'auto',
                border: selected ? `2.5px solid ${color}` : '2px solid rgba(255,255,255,0.12)',
                boxShadow: selected
                    ? `0 0 0 4px ${color}44, 0 8px 32px ${color}66`
                    : '0 4px 16px rgba(0,0,0,0.3)',
                background: card.matched
                    ? 'transparent'
                    : selected
                        ? `linear-gradient(160deg, ${color}22, ${color}0a)`
                        : 'linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))',
                backdropFilter: 'blur(12px)',
                borderRadius: '1rem',
                padding: '0.75rem',
                cursor: card.matched ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                minHeight: '80px',
                textAlign: 'center',
                transition: 'border 0.15s, background 0.15s',
            }}
        >
            {/* Pulse ring when selected */}
            {selected && (
                <motion.div
                    style={{
                        position: 'absolute', inset: -6, borderRadius: '1.3rem',
                        border: `2px solid ${color}`,
                        pointerEvents: 'none',
                    }}
                    animate={{ opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            )}

            {/* Label: term vs def */}
            <span style={{
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                color: card.side === 'term' ? '#60a5fa' : '#a78bfa',
                textTransform: 'uppercase', opacity: 0.8,
            }}>
                {card.side === 'term' ? 'ATAMA' : 'TA\'RIF'}
            </span>

            {card.imageUrl && (
                <img src={card.imageUrl} alt="" draggable={false}
                    style={{ width: '100%', maxHeight: '60px', objectFit: 'cover', borderRadius: '0.6rem' }} />
            )}

            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                {card.text}
            </span>
        </motion.button>
    );
}

/* ─── Level Complete Modal ───────────────────────────────────────────── */
function LevelCompleteModal({ result, onClose }: { result: MatchResult; onClose: () => void }) {
    const accuracy = Math.round((result.totalPairs / (result.totalPairs + result.mistakes)) * 100);
    const elapsed = (result.completedMs / 1000).toFixed(1);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.6, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(160deg, rgba(30,30,60,0.97), rgba(10,10,30,0.98))',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: '1.75rem',
                    padding: '2.5rem 2rem',
                    maxWidth: 380, width: '90%',
                    textAlign: 'center',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                }}
            >
                {/* Trophy */}
                <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: 3, duration: 0.5 }}
                    style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '0.75rem' }}
                >
                    {result.cleanSweep ? '🏆' : '🎯'}
                </motion.div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', margin: '0 0 0.25rem' }}>
                    {result.cleanSweep ? 'Mukammal!' : 'Bajarildi!'}
                </h2>
                {result.cleanSweep && (
                    <p style={{ color: '#FFD700', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        ✨ Clean Sweep! +500 bonus
                    </p>
                )}

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', margin: '1.25rem 0' }}>
                    {[
                        { label: 'Vaqt', value: `${elapsed}s` },
                        { label: 'Aniqlik', value: `${accuracy}%` },
                        { label: 'Xato', value: String(result.mistakes) },
                    ].map(({ label, value }) => (
                        <div key={label} style={{
                            background: 'rgba(255,255,255,0.07)',
                            borderRadius: '0.9rem', padding: '0.75rem 0.5rem',
                        }}>
                            <p style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFD700', margin: 0 }}>{value}</p>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Points */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(0,86,179,0.3), rgba(0,86,179,0.15))',
                    border: '1px solid rgba(0,86,179,0.4)',
                    borderRadius: '1rem', padding: '1rem', marginBottom: '1.25rem',
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 800, margin: '0 0 0.2rem', textTransform: 'uppercase' }}>
                        QOZONILGAN BALL
                    </p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFD700', margin: 0 }}>
                        +{result.points.toLocaleString()}
                    </p>
                </div>

                <button onClick={onClose} style={{
                    width: '100%', padding: '0.9rem',
                    background: 'linear-gradient(135deg, #0056b3, #003d82)',
                    border: 'none', borderRadius: '1rem',
                    color: 'white', fontWeight: 800, fontSize: '1rem',
                    cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,86,179,0.4)',
                }}>
                    Davom etish ✅
                </button>
            </motion.div>
        </motion.div>
    );
}

/* ─── Main MatchGame Component ───────────────────────────────────────── */
export default function MatchGame({ pairs, timeLimit, onComplete, result }: MatchGameProps) {
    const startTimeRef = useRef(Date.now());
    const [cards, setCards] = useState<MatchCard[]>([]);
    const [firstId, setFirstId] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [shakeIds, setShakeIds] = useState<Set<string>>(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [matchedCount, setMatchedCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [localResult, setLocalResult] = useState<MatchResult | null>(null);
    const beepCtxRef = useRef<AudioContext | null>(null);

    // Build shuffled card grid on mount
    useEffect(() => {
        const built: MatchCard[] = [];
        pairs.forEach((p, pairId) => {
            built.push({ id: `t-${pairId}`, pairId, side: 'term', text: p.term, imageUrl: p.termImage, matched: false });
            built.push({ id: `d-${pairId}`, pairId, side: 'def', text: p.definition, imageUrl: p.definitionImage, matched: false });
        });
        setCards(shuffle(built));
        startTimeRef.current = Date.now();
    }, [pairs]);

    const playBeep = (freq: number, vol = 0.12) => {
        try {
            if (!beepCtxRef.current) beepCtxRef.current = new AudioContext();
            const ctx = beepCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
        } catch { }
    };

    const handleSelect = useCallback((id: string) => {
        if (checking) return;
        const card = cards.find(c => c.id === id);
        if (!card || card.matched) return;

        if (!firstId) {
            setFirstId(id);
            playBeep(620);
            return;
        }

        if (firstId === id) {
            setFirstId(null);
            return;
        }

        // Second card selected — check match
        const first = cards.find(c => c.id === firstId)!;
        const second = card;
        setChecking(true);

        if (first.pairId === second.pairId) {
            // ✅ Match!
            playBeep(880);
            if (navigator.vibrate) navigator.vibrate([60, 30, 100]);
            setCards(prev => prev.map(c =>
                c.id === firstId || c.id === id ? { ...c, matched: true } : c
            ));
            const newMatched = matchedCount + 1;
            setMatchedCount(newMatched);
            setFirstId(null);
            setChecking(false);

            if (newMatched === pairs.length) {
                const completedMs = Date.now() - startTimeRef.current;
                const noMistakes = mistakes === 0;
                const timeFrac = Math.max(0.15, (timeLimit * 1000 - completedMs) / (timeLimit * 1000));
                const pts = Math.round(pairs.length * 100 * timeFrac) + (noMistakes ? 500 : 0);
                const res: MatchResult = {
                    totalPairs: pairs.length,
                    completedMs,
                    mistakes,
                    cleanSweep: noMistakes,
                    points: pts,
                };
                setLocalResult(res);
                setTimeout(() => setShowModal(true), 400);
                onComplete(res);
            }
        } else {
            // ❌ No match — shake + reset
            playBeep(220, 0.08);
            if (navigator.vibrate) navigator.vibrate(250);
            setShakeIds(new Set([firstId, id]));
            setMistakes(m => m + 1);
            setTimeout(() => {
                setShakeIds(new Set());
                setFirstId(null);
                setChecking(false);
            }, 480);
        }
    }, [firstId, cards, checking, matchedCount, mistakes, pairs.length, timeLimit, onComplete]);

    const firstCard = firstId ? cards.find(c => c.id === firstId) : null;
    const pairColor = (pairId: number) => PAIR_COLORS[pairId % PAIR_COLORS.length];

    // Dynamic grid: 2 cols on mobile, up to 4 cols for larger pair counts
    const cols = pairs.length <= 3 ? 2 : pairs.length <= 6 ? 3 : 4;

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 800 }}>
                    🎯 {matchedCount}/{pairs.length} juft
                </span>
                <span style={{ color: mistakes === 0 ? '#00E676' : '#FF6B6B', fontSize: '0.75rem', fontWeight: 800 }}>
                    {mistakes === 0 ? '✨ Perfect run!' : `❌ ${mistakes} xato`}
                </span>
            </div>
            <div style={{
                height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: '1rem', overflow: 'hidden',
            }}>
                <motion.div
                    animate={{ width: `${(matchedCount / pairs.length) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #0056b3, #00E676)', borderRadius: 4 }}
                />
            </div>

            {/* Card grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '0.65rem',
            }}>
                <AnimatePresence>
                    {cards.map(card => (
                        <MatchCardEl
                            key={card.id}
                            card={card}
                            selected={card.id === firstId}
                            shake={shakeIds.has(card.id)}
                            onSelect={handleSelect}
                            color={pairColor(card.pairId)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* First-pick hint */}
            <AnimatePresence>
                {firstCard && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            marginTop: '1rem', padding: '0.6rem 1rem',
                            borderRadius: '0.85rem',
                            background: `linear-gradient(135deg, ${pairColor(firstCard.pairId)}22, ${pairColor(firstCard.pairId)}11)`,
                            border: `1.5px solid ${pairColor(firstCard.pairId)}55`,
                            textAlign: 'center',
                        }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>
                            ☝️ &quot;{firstCard.text}&quot; — mos juftini toping
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Level Complete Modal */}
            <AnimatePresence>
                {showModal && localResult && (
                    <LevelCompleteModal
                        result={localResult}
                        onClose={() => setShowModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
