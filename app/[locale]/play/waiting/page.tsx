'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusherClient';
import { useTranslations } from 'next-intl';

interface Team { id: string; name: string; emoji: string; color: string; }
interface PlayerTeam { id: string; teamId?: string; }

export default function WaitingPage() {
    const t = useTranslations('WaitingRoom');
    const router = useRouter();
    const [nickname, setNickname] = useState('');
    const [pin, setPin] = useState('');
    const [avatar, setAvatar] = useState('🤖');
    const [dots, setDots] = useState('');

    // Team mode state
    const [teamMode, setTeamMode] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeamId, setMyTeamId] = useState<string | undefined>(undefined);
    const [playerTeams, setPlayerTeams] = useState<PlayerTeam[]>([]);
    const [choosing, setChoosing] = useState(false);
    const [chooseError, setChooseError] = useState('');
    const [playerId, setPlayerId] = useState('');

    useEffect(() => {
        const storedPin = sessionStorage.getItem('playerPin');
        const storedNick = sessionStorage.getItem('playerNickname');
        const storedAvatar = sessionStorage.getItem('playerAvatar') || '🤖';
        const pid = sessionStorage.getItem('playerId') || '';
        if (!storedPin || !storedNick) { router.push('/play'); return; }
        setPin(storedPin); setNickname(storedNick); setAvatar(storedAvatar); setPlayerId(pid);

        // Fetch initial room state — detect team mode + existing assignments
        fetch(`/api/game/state?pin=${storedPin}`)
            .then(r => r.json())
            .then(data => {
                if (data.teamMode && data.teams) {
                    setTeamMode(true);
                    setTeams(data.teams);
                    const me = data.players?.find((p: { id: string; teamId?: string }) => p.id === pid);
                    if (me?.teamId) setMyTeamId(me.teamId);
                    setPlayerTeams(data.players?.map((p: { id: string; teamId?: string }) => ({ id: p.id, teamId: p.teamId })) ?? []);
                }
            })
            .catch(() => {});

        const pusher = getPusherClient();
        const ch = pusher.subscribe(`game-${storedPin}`);
        let left = false;

        const goToGame = (payload?: unknown) => {
            if (left) return;
            left = true;
            // Store Q1 payload so game page loads it instantly (no network roundtrip)
            if (payload) sessionStorage.setItem('pendingQuestion', JSON.stringify(payload));
            router.push('/play/game');
        };
        const onStart = (payload: unknown) => goToGame(payload);

        // "O'yin boshlandi" xabari o'tkazib yuborilgan bo'lsa (telefon ekrani o'chgan, internet uzilgan) —
        // serverdan tekshirib, o'yinga o'tkazamiz
        const resync = async () => {
            try {
                const res = await fetch(`/api/game/state?pin=${storedPin}&playerId=${pid}`, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (data.status === 'question' && !data.answered && data.currentQuestion) goToGame(data.currentQuestion);
                else if (data.status === 'question' || data.status === 'leaderboard' || data.status === 'ended') goToGame();
            } catch { /* keyingi urinishda */ }
        };
        const onVisible = () => { if (document.visibilityState === 'visible') resync(); };
        pusher.connection.bind('connected', resync);
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('online', resync);
        const poll = setInterval(resync, 5000);

        const onTeamUpdated = (payload: { playerTeams: PlayerTeam[] }) => {
            if (payload?.playerTeams) {
                setPlayerTeams(payload.playerTeams);
                const mine = payload.playerTeams.find(p => p.id === pid);
                if (mine) setMyTeamId(mine.teamId);
            }
        };
        // team-assigned: fired when teacher starts the game and stragglers are auto-assigned
        ch.bind('question-start', onStart);
        ch.bind('team-updated', onTeamUpdated);
        ch.bind('team-assigned', onTeamUpdated);
        ch.bind('pusher:subscription_succeeded', resync);

        // Only unbind OUR handlers — don't unsubscribe the channel (the game page may need it during
        // navigation) and don't remove handlers the game page has bound for the same events.
        return () => {
            ch.unbind('question-start', onStart);
            ch.unbind('team-updated', onTeamUpdated);
            ch.unbind('team-assigned', onTeamUpdated);
            ch.unbind('pusher:subscription_succeeded', resync);
            pusher.connection.unbind('connected', resync);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('online', resync);
            clearInterval(poll);
        };
    }, [router]);

    useEffect(() => {
        const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
        return () => clearInterval(t);
    }, []);

    async function chooseTeam(teamId: string) {
        if (choosing) return;
        setChoosing(true);
        setChooseError('');
        try {
            const res = await fetch('/api/game/choose-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, playerId, teamId }),
            });
            const data = await res.json();
            if (!res.ok) {
                setChooseError(data.error || 'Jamoani tanlashda xatolik');
            } else {
                setMyTeamId(data.teamId);
            }
        } catch {
            setChooseError('Tarmoq xatosi');
        } finally {
            setChoosing(false);
        }
    }

    const teamCounts = new Map<string, number>();
    playerTeams.forEach(p => {
        if (p.teamId) teamCounts.set(p.teamId, (teamCounts.get(p.teamId) ?? 0) + 1);
    });

    return (
        <div className="bg-player min-h-screen flex flex-col items-center justify-center p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full opacity-10 animate-pulse-slow"
                    style={{ background: 'radial-gradient(circle, #0056b3, transparent)', top: '20%', left: '15%' }} />
            </div>

            <div className="text-center space-y-6 relative z-10 w-full max-w-md">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-6xl mx-auto pulse-ring"
                    style={{ background: 'linear-gradient(135deg, #0056b3, #003d82)', boxShadow: '0 8px 40px rgba(0,86,179,0.5)' }}>
                    {avatar}
                </div>

                <div>
                    <p className="text-white/40 font-bold text-xs tracking-widest mb-1">{t('welcome')}</p>
                    <h1 className="text-3xl font-black text-white">{nickname}</h1>
                </div>

                <div className="glass-blue p-4 rounded-2xl">
                    <p className="text-white/40 font-bold text-xs tracking-widest mb-1">{t('pinCode')}</p>
                    <p className="text-3xl font-black tracking-widest" style={{ color: '#FFD600', textShadow: '0 0 20px rgba(255,214,0,0.5)' }}>{pin}</p>
                </div>

                {/* Team selector — shown only in team mode */}
                {teamMode && teams.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-white font-black text-lg">
                            {myTeamId ? t('teamSelected') : t('selectTeam')}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {teams.map(team => {
                                const count = teamCounts.get(team.id) ?? 0;
                                const selected = myTeamId === team.id;
                                return (
                                    <button
                                        key={team.id}
                                        onClick={() => chooseTeam(team.id)}
                                        disabled={choosing}
                                        className="p-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all hover:scale-[1.03] disabled:opacity-60"
                                        style={{
                                            background: selected ? `${team.color}33` : 'rgba(255,255,255,0.05)',
                                            border: selected ? `2px solid ${team.color}` : '2px solid rgba(255,255,255,0.1)',
                                            boxShadow: selected ? `0 0 24px ${team.color}66` : 'none',
                                        }}
                                    >
                                        <span className="text-3xl">{team.emoji}</span>
                                        <span className="text-white font-black text-sm">{team.name}</span>
                                        <span className="text-white/50 text-xs font-bold">{count} {t('members')}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {chooseError && (
                            <p className="text-red-400 font-bold text-sm bg-red-500/10 rounded-xl py-2">⚠️ {chooseError}</p>
                        )}
                        {myTeamId && (
                            <p className="text-white/50 text-xs font-semibold">{t('changeTeam')}</p>
                        )}
                    </div>
                )}

                {/* Classic waiting indicator */}
                {!teamMode && (
                    <div className="flex justify-center gap-3 my-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-4 h-4 rounded-full animate-bounce"
                                style={{ background: ['#0056b3', '#FFD600', '#00E676'][i], animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>
                )}
                <p className="text-white/50 font-bold text-sm">{t('waitingTeacher')}{dots}</p>
            </div>
        </div>
    );
}
