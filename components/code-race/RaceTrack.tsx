'use client';

import { motion } from 'framer-motion';
import type { RacerView } from './utils';

const LANES = 10;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

/**
 * Proyektor uchun poyga yo'lagi (Grammar Race). Eng oldingi 10 o'yinchi — alohida yo'lakda,
 * qolganlar pastdagi "peloton" chizig'ida kichik nuqtalar bo'lib yuradi (100 kishida ham tartibli ko'rinadi).
 * `racers` reyting tartibida keladi.
 */
export default function RaceTrack({ racers, goal, leaders }: { racers: RacerView[]; goal: number; leaders: Set<string> }) {
    const pack = racers.slice(LANES);
    const x = (solved: number) => 2 + Math.min(solved / Math.max(goal, 1), 1) * 86; // % (start 2% → finish 88%)

    return (
        <div className="relative w-full h-full overflow-hidden rounded-3xl flex flex-col"
            style={{ background: 'linear-gradient(180deg,#0f1b3d 0%,#1e3a6e 38%,#14532d 38.2%,#166534 100%)' }}>
            {/* London siluyeti */}
            <svg className="absolute left-0 right-0 top-0 w-full" style={{ height: '38%' }} viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
                <g fill="#0b1430" opacity="0.9">
                    <rect x="10" y="70" width="40" height="30" /><rect x="55" y="60" width="25" height="40" />
                    <rect x="85" y="25" width="16" height="75" /><polygon points="85,25 93,8 101,25" /><rect x="89" y="32" width="8" height="8" fill="#fde68a" />
                    <rect x="105" y="55" width="60" height="45" /><rect x="170" y="65" width="30" height="35" />
                    <circle cx="250" cy="62" r="30" fill="none" stroke="#0b1430" strokeWidth="3" />
                    <line x1="250" y1="62" x2="235" y2="100" stroke="#0b1430" strokeWidth="3" /><line x1="250" y1="62" x2="265" y2="100" stroke="#0b1430" strokeWidth="3" />
                    <rect x="290" y="50" width="22" height="50" /><rect x="318" y="68" width="45" height="32" /><rect x="368" y="58" width="32" height="42" />
                </g>
                {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 47) % 400} cy={(i * 13) % 45} r="0.6" fill="#fff" opacity="0.6" />)}
            </svg>
            <div className="absolute right-4 top-3 text-3xl" aria-hidden>🇬🇧</div>

            {/* Trek */}
            <div className="relative mt-auto mb-3 mx-3 rounded-2xl overflow-hidden" style={{ height: '58%', background: '#2b2f3a' }}>
                {/* Start va finish chiziqlari */}
                <div className="absolute top-0 bottom-0 w-1 bg-white/70" style={{ left: '4%' }} />
                <div className="absolute top-0 bottom-0 w-4" style={{
                    left: '90%',
                    backgroundImage: 'repeating-conic-gradient(#fff 0 25%, #111 0 50%)', backgroundSize: '8px 8px',
                }} />
                <div className="absolute -top-0.5 text-xl" style={{ left: '89.5%' }}>🏁</div>

                {(() => {
                    const laneH = 100 / (LANES + (pack.length > 0 ? 0.8 : 0));
                    return (
                        <>
                            {Array.from({ length: LANES }, (_, i) => (
                                <div key={i} className="absolute left-0 right-0 border-b border-dashed border-white/15" style={{ top: `${i * laneH}%`, height: `${laneH}%` }}>
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30">{i + 1}</span>
                                </div>
                            ))}
                            {pack.length > 0 && (
                                <div className="absolute left-0 right-0 bottom-0 bg-black/30" style={{ height: `${laneH * 0.8}%` }}>
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/40">+{pack.length}</span>
                                </div>
                            )}
                            {/* O'yinchilar bitta qatlamda (key = id): quvib o'tganda yo'lak almashishi ham silliq animatsiya */}
                            {racers.map((r, i) => {
                                const inLane = i < LANES;
                                const top = inLane ? (i + 0.5) * laneH : LANES * laneH + laneH * 0.4;
                                return inLane ? (
                                    <motion.div key={r.id} className="absolute flex items-center gap-1.5" style={{ y: '-50%', zIndex: 10 }}
                                        initial={{ left: `${x(0)}%`, top: `${top}%` }}
                                        animate={{ left: `${x(r.solved)}%`, top: `${top}%` }}
                                        transition={{ type: 'spring', stiffness: 90, damping: 15 }}>
                                        <motion.div key={r.solved} initial={{ scale: 1.35 }} animate={{ scale: 1 }}
                                            className="flex items-center justify-center rounded-full text-lg shrink-0"
                                            style={{
                                                width: 30, height: 30, background: COLORS[i],
                                                boxShadow: leaders.has(r.id) ? `0 0 14px ${COLORS[i]}` : 'none',
                                                border: '2px solid rgba(255,255,255,0.8)',
                                            }}>
                                            {r.avatar}
                                        </motion.div>
                                        <span className="text-xs font-black text-white whitespace-nowrap bg-black/40 rounded px-1.5 max-w-[110px] truncate">
                                            {r.nickname} <span className="text-yellow-300">{r.solved}</span>
                                        </span>
                                    </motion.div>
                                ) : (
                                    <motion.div key={r.id} className="absolute rounded-full bg-white/70" style={{ width: 8, height: 8, y: '-50%' }}
                                        initial={{ left: `${x(0)}%`, top: `${top}%` }}
                                        animate={{ left: `${x(r.solved)}%`, top: `${top}%` }}
                                        transition={{ type: 'spring', stiffness: 90, damping: 15 }} title={r.nickname} />
                                );
                            })}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
