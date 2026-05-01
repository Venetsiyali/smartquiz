'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { getPusherClient } from '@/lib/pusherClient';
import { useTranslations } from 'next-intl';

interface Player { id: string; nickname: string; avatar: string; streak: number; teamId?: string; }
interface Team { id: string; name: string; emoji: string; color: string; }
interface PlayerTeam { id: string; teamId?: string; }

export default function TeacherLobbyPage() {
    const router = useRouter();
    const t = useTranslations('Lobby');
    const [pin, setPin] = useState<string | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [teamMode, setTeamMode] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(true);
    const [gameMode, setGameMode] = useState<'classic' | 'tezkor'>('classic');
    const channelRef = useRef<any>(null);
    const [copied, setCopied] = useState(false);
    const joinUrl = typeof window !== 'undefined' && pin ? `${window.location.origin}/play?pin=${pin}` : '';

    useEffect(() => {
        // The game has already been created in /teacher/create, so just grab the pin
        const existingPin = sessionStorage.getItem('gamePin');
        if (!existingPin) {
            router.push('/teacher/create');
            return;
        }

        setPin(existingPin);
        setIsCreating(false);

        // Fetch existing players if continuing a game
        fetch(`/api/game/state?pin=${existingPin}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.players) setPlayers(data.players);
                if (data?.teamMode && data?.teams) {
                    setTeamMode(true);
                    setTeams(data.teams);
                }
                if (data?.gameMode) {
                    setGameMode(data.gameMode);
                }
            })
            .catch(err => console.error("Holatni olishda xatolik:", err));

        const pusher = getPusherClient();
        channelRef.current = pusher.subscribe(`game-${existingPin}`);
        channelRef.current.bind('player-joined', ({ players: updated }: { players: Player[] }) => {
            setPlayers(updated);
        });
        channelRef.current.bind('team-updated', ({ playerTeams }: { playerTeams: PlayerTeam[] }) => {
            setPlayers(prev => prev.map(p => {
                const upd = playerTeams.find(pt => pt.id === p.id);
                return upd ? { ...p, teamId: upd.teamId } : p;
            }));
        });
    }, [router]);

    useEffect(() => {
        return () => { if (pin) getPusherClient().unsubscribe(`game-${pin}`); };
    }, [pin]);

    const handleStart = () => {
        if (!pin) return;
        if (players.length === 0) { setError(t('minOnePlayers')); setTimeout(() => setError(''), 3000); return; }
        setLoading(true);
        if (gameMode === 'tezkor') {
            router.push('/teacher/tezkor');
        } else {
            router.push('/teacher/game');
        }
    };

    return (
        <div className="bg-host min-h-screen flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/teacher/create')} className="text-white/50 hover:text-white text-2xl">←</button>
                    <span className="text-xl font-black text-white">Zukk<span className="logo-z">oo</span></span>
                    <span className="text-white/30">·</span>
                    <span className="text-white/50 font-bold text-sm">Lobby</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-bold ${!isCreating ? 'text-green-400' : 'text-yellow-400'}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${!isCreating ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    {isCreating ? t('creating') : t('ready')}
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row gap-6 p-5 md:p-8">
                {/* Left */}
                <div className="md:w-80 flex flex-col gap-5">
                    <div className="glass p-6 flex flex-col items-center gap-4">
                        <p className="text-white/50 font-bold text-xs tracking-widest">{t('qrCode')}</p>
                        {pin && joinUrl ? (
                            <div className="bg-white p-4 rounded-2xl shadow-2xl">
                                <QRCodeSVG value={joinUrl} size={176} bgColor="#ffffff" fgColor="#0a0f1e" level="H" />
                            </div>
                        ) : (
                            <div className="w-48 h-48 rounded-2xl animate-pulse flex items-center justify-center" style={{ background: 'rgba(0,86,179,0.1)' }}>
                                <span className="text-4xl opacity-30">⚡</span>
                            </div>
                        )}
                        <p className="text-white/30 text-xs font-semibold">{typeof window !== 'undefined' ? window.location.host : ''}/play</p>
                    </div>

                    <div className="glass-blue p-6 flex flex-col items-center gap-1">
                        <p className="text-white/50 font-bold text-xs tracking-widest mb-2">{t('pinCode')}</p>
                        <div className="text-6xl font-black tracking-widest" style={{ color: '#FFD600', textShadow: '0 0 40px rgba(255,214,0,0.5)' }}>
                            {pin || <span className="text-white/15">——————</span>}
                        </div>
                        {/* Link nusxalash tugmasi */}
                        {pin && joinUrl && (
                            <button
                                onClick={() => { navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300"
                                style={{
                                    background: copied ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.08)',
                                    border: `1px solid ${copied ? 'rgba(0,230,118,0.5)' : 'rgba(255,255,255,0.15)'}`,
                                    color: copied ? '#00E676' : 'rgba(255,255,255,0.7)'
                                }}>
                                {copied ? t('copied') : t('copyLink')}
                            </button>
                        )}
                    </div>

                    <button onClick={handleStart} disabled={!pin || players.length === 0 || loading}
                        className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
                        {loading ? t('starting') : `${t('start')} (${players.length})`}
                    </button>
                    {error && <p className="text-red-400 font-bold text-sm text-center">⚠️ {error}</p>}
                </div>

                {/* Players grid */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-extrabold text-lg">
                            {t('joinedPlayers')} <span className="text-white/40 ml-1 text-base">({players.length})</span>
                            {teamMode && (
                                <span className="ml-2 px-2 py-0.5 rounded-lg text-xs font-black tracking-widest"
                                    style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)' }}>
                                    {t('teamBadge')}
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                        </div>
                    </div>

                    {players.length === 0 ? (
                        <div className="glass p-16 rounded-3xl text-center">
                            <div className="text-6xl mb-4 animate-pulse-slow">🕐</div>
                            <p className="text-white/40 font-bold text-xl">{t('waitingPlayers')}</p>
                            <p className="text-white/25 text-sm mt-1">{t('waitingHint')}</p>
                        </div>
                    ) : teamMode && teams.length > 0 ? (
                        <div className="space-y-5">
                            {teams.map(team => {
                                const members = players.filter(p => p.teamId === team.id);
                                return (
                                    <div key={team.id} className="rounded-2xl p-4"
                                        style={{ background: `${team.color}14`, border: `1px solid ${team.color}40` }}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">{team.emoji}</span>
                                            <h3 className="text-white font-black text-base">{team.name}</h3>
                                            <span className="text-white/50 text-sm font-bold">{members.length} {t('members')}</span>
                                        </div>
                                        {members.length === 0 ? (
                                            <p className="text-white/30 text-sm font-semibold italic">{t('noOneChosen')}</p>
                                        ) : (
                                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                                {members.map(p => (
                                                    <div key={p.id} className="glass p-2 rounded-xl text-center">
                                                        <div className="text-2xl">{p.avatar || '🤖'}</div>
                                                        <p className="text-white font-bold text-xs truncate">{p.nickname}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {/* Unassigned */}
                            {(() => {
                                const unassigned = players.filter(p => !p.teamId);
                                if (unassigned.length === 0) return null;
                                return (
                                    <div className="rounded-2xl p-4"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl">⏳</span>
                                            <h3 className="text-white/60 font-black text-sm">{t('unassigned')}</h3>
                                            <span className="text-white/40 text-xs font-bold">({unassigned.length})</span>
                                        </div>
                                        <p className="text-white/40 text-xs font-semibold mb-2">{t('autoAssign')}</p>
                                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {unassigned.map(p => (
                                                <div key={p.id} className="glass p-2 rounded-xl text-center opacity-70">
                                                    <div className="text-2xl">{p.avatar || '🤖'}</div>
                                                    <p className="text-white font-bold text-xs truncate">{p.nickname}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {players.map((p, i) => (
                                <div key={p.id} className="glass p-4 rounded-2xl text-center animate-bounce-in"
                                    style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="text-4xl mb-2">{p.avatar || '🤖'}</div>
                                    <p className="text-white font-bold text-sm truncate">{p.nickname}</p>
                                    {p.streak >= 3 && (
                                        <div className="mt-1.5 flex items-center justify-center gap-0.5">
                                            <span className="text-base animate-bounce">🔥</span>
                                            <span className="text-orange-400 font-black text-xs">{p.streak}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
