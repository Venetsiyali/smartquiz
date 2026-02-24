'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    DndContext, DragEndEvent, DragOverlay, DragStartEvent,
    PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext, verticalListSortingStrategy,
    useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

interface SortItem {
    id: string;      // unique per item
    text: string;
    imageUrl?: string;
}

interface SortGameProps {
    question: string;
    items: SortItem[];           // shuffled items received from server
    timeLeft: number;
    timeLimit: number;
    onSubmit: (orderedIds: string[]) => void;
    result: SortResult | null;   // null until submitted
    disabled: boolean;
}

interface SortResult {
    correct: boolean;
    points: number;
    streak: number;
    streakFire: boolean;
    correctOrder: string[];      // correct item IDs in order
    submittedOrder: string[];
    explanation: string | null;
}

/* ── Sortable Card ─────────────────────────────────────────────────── */
function SortCard({ item, index, result, correctOrder, isDragging }:
    { item: SortItem; index: number; result: SortResult | null; correctOrder: string[]; isDragging: boolean }) {

    const { attributes, listeners, setNodeRef, transform, transition, active } = useSortable({ id: item.id });

    const isActive = active?.id === item.id;
    let borderColor = 'rgba(255,255,255,0.15)';
    if (result) {
        borderColor = result.correctOrder[index] === item.id ? '#00E676' : '#FF1744';
    }

    return (
        <div ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isActive ? 0.35 : 1,
            }}
            {...attributes} {...listeners}
            className="touch-none">
            <motion.div
                initial={false}
                animate={{
                    boxShadow: isActive
                        ? '0 0 0 2px #0056b3, 0 20px 50px rgba(0,86,179,0.6)'
                        : result
                            ? result.correctOrder[index] === item.id
                                ? '0 0 0 2px #00E676, 0 8px 24px rgba(0,230,118,0.3)'
                                : '0 0 0 2px #FF1744, 0 8px 24px rgba(255,23,68,0.3)'
                            : '0 0 0 1px rgba(255,255,255,0.15)',
                }}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-grab active:cursor-grabbing select-none"
                style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))',
                    backdropFilter: 'blur(12px)',
                    border: `2px solid ${borderColor}`,
                    userSelect: 'none',
                }}>
                {/* Rank number */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                    style={{
                        background: result
                            ? result.correctOrder[index] === item.id ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'
                            : 'rgba(255,255,255,0.08)',
                        color: result
                            ? result.correctOrder[index] === item.id ? '#00E676' : '#FF1744'
                            : 'rgba(255,255,255,0.5)',
                    }}>
                    {index + 1}
                </div>

                {/* Optional image */}
                {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0"
                        draggable={false} />
                )}

                {/* Text */}
                <span className="flex-1 text-white font-bold text-base leading-snug">{item.text}</span>

                {/* Result icon */}
                {result && (
                    <span className="text-xl shrink-0">
                        {result.correctOrder[index] === item.id ? '✅' : '❌'}
                    </span>
                )}

                {/* Drag handle hint */}
                {!result && (
                    <div className="flex flex-col gap-1 shrink-0 opacity-30">
                        {[0, 1, 2].map(i => <div key={i} className="w-5 h-0.5 rounded bg-white" />)}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

/* ── Main SortGame Component ───────────────────────────────────────── */
export default function SortGame({
    question, items: initialItems, timeLeft, timeLimit, onSubmit, result, disabled
}: SortGameProps) {
    const [items, setItems] = useState<SortItem[]>(initialItems);
    const [hasDragged, setHasDragged] = useState(false);
    const [activeItem, setActiveItem] = useState<SortItem | null>(null);
    const [streakVisible, setStreakVisible] = useState(false);
    const beepRef = useRef<AudioContext | null>(null);
    const hasBeepedRef = useRef<Set<number>>(new Set());

    // 🔥 Fire streak animation when result arrives
    useEffect(() => {
        if (result?.streakFire) {
            setStreakVisible(true);
            // Haptic feedback
            if (typeof window !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([80, 40, 80, 40, 120]);
            }
            setTimeout(() => setStreakVisible(false), 3000);
        }
    }, [result]);

    // 🔊 Last 5s countdown beep using Web Audio API
    useEffect(() => {
        if (result || disabled) return;
        if (timeLeft <= 5 && timeLeft > 0 && !hasBeepedRef.current.has(timeLeft)) {
            hasBeepedRef.current.add(timeLeft);
            try {
                if (!beepRef.current) beepRef.current = new AudioContext();
                const ctx = beepRef.current;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = timeLeft === 1 ? 880 : 440;
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } catch { /* ignore AudioContext errors */ }
        }
    }, [timeLeft, result, disabled]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    );

    const handleDragStart = useCallback((e: DragStartEvent) => {
        setActiveItem(items.find(i => i.id === e.active.id) || null);
    }, [items]);

    const handleDragEnd = useCallback((e: DragEndEvent) => {
        const { active, over } = e;
        setActiveItem(null);
        if (!over || active.id === over.id) return;
        setItems(prev => {
            const oldIdx = prev.findIndex(i => i.id === active.id);
            const newIdx = prev.findIndex(i => i.id === over.id);
            return arrayMove(prev, oldIdx, newIdx);
        });
        setHasDragged(true);
    }, []);

    const handleSubmit = () => {
        onSubmit(items.map(i => i.id));
    };

    const correctOrder = result?.correctOrder || [];

    return (
        <div className="w-full max-w-lg mx-auto space-y-4">
            {/* 🔥 Streak fire overlay */}
            <AnimatePresence>
                {streakVisible && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 400 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <div className="text-center space-y-2">
                            <div className="text-9xl animate-bounce">🔥</div>
                            <p className="text-4xl font-black text-yellow-400" style={{ textShadow: '0 0 30px rgba(255,215,0,0.8)' }}>
                                10 soniyadan tez!
                            </p>
                            <p className="text-white/60 font-bold text-xl">Ajoyib tezlik!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result banner */}
            <AnimatePresence>
                {result && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="glass p-4 rounded-2xl text-center space-y-1"
                        style={{ border: `2px solid ${result.correct ? '#00E676' : 'rgba(255,255,255,0.15)'}` }}>
                        <p className="text-2xl font-black text-white">
                            {result.correct ? '🎯 Mukammal!' : `📊 ${Math.round((result.correctOrder.filter((id, i) => id === result.submittedOrder[i]).length / result.correctOrder.length) * 100)}% To'g'ri`}
                        </p>
                        <p className="text-yellow-400 font-extrabold text-xl">+{result.points} ball</p>
                        {result.explanation && (
                            <p className="text-white/50 font-bold text-sm mt-2 pt-2 border-t border-white/10">
                                💡 {result.explanation}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Instruction */}
            {!result && (
                <p className="text-white/40 font-bold text-sm text-center">
                    {hasDragged ? "✅ Tayyor bo'lsangiz, yuborish tugmasini bosing" : "☝️ Bloklarni to'g'ri tartibga torting"}
                </p>
            )}

            {/* Sortable list */}
            <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <SortCard key={item.id} item={item} index={idx}
                                result={result} correctOrder={correctOrder} isDragging={activeItem?.id === item.id} />
                        ))}
                    </div>
                </SortableContext>

                {/* Smooth drag overlay */}
                <DragOverlay>
                    {activeItem && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl"
                            style={{
                                background: 'linear-gradient(160deg, rgba(0,86,179,0.3), rgba(0,86,179,0.15))',
                                border: '2px solid #0056b3',
                                boxShadow: '0 20px 60px rgba(0,86,179,0.5)',
                                backdropFilter: 'blur(20px)',
                                cursor: 'grabbing',
                            }}>
                            {activeItem.imageUrl && (
                                <img src={activeItem.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                            )}
                            <span className="text-white font-bold text-base">{activeItem.text}</span>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Submit button — appears after first drag */}
            <AnimatePresence>
                {hasDragged && !result && !disabled && (
                    <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        onClick={handleSubmit}
                        className="w-full py-5 rounded-2xl font-extrabold text-xl transition-all hover:scale-105 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #0056b3, #003d82)',
                            boxShadow: '0 12px 40px rgba(0,86,179,0.5)',
                            color: 'white',
                        }}>
                        ✅ Tartibni Yuborish
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
