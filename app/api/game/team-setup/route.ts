import { NextResponse } from 'next/server';
import { withRoom } from '@/lib/gameState';

const TEAM_PRESETS = [
    { id: 'team_a', name: 'Koderlar', emoji: '🚀', color: '#6366f1' },
    { id: 'team_b', name: 'Hakerlar', emoji: '⚡', color: '#f59e0b' },
    { id: 'team_c', name: 'Analitiklar', emoji: '🔬', color: '#10b981' },
    { id: 'team_d', name: 'Dizaynerlar', emoji: '🎨', color: '#ec4899' },
    { id: 'team_e', name: 'Menejerlar', emoji: '🏆', color: '#0ea5e9' },
    { id: 'team_f', name: 'Tadqiqotchilar', emoji: '🌟', color: '#ef4444' },
];

export async function POST(req: Request) {
    const {
        pin,
        teamCount,
        teamNames, // Pro: optional custom names array
    }: { pin: string; teamCount: number; teamNames?: string[] } = await req.json();

    let teams;
    try {
        teams = await withRoom(pin, room => {
            if (!room || room.status !== 'lobby') return null;

            const count = Math.min(6, Math.max(2, teamCount));
            room.teamMode = true;
            room.teamCount = count;
            room.customTeamNames = teamNames || [];

            room.teams = TEAM_PRESETS.slice(0, count).map((preset, i) => ({
                id: preset.id,
                name: (teamNames && teamNames[i]) ? teamNames[i] : preset.name,
                emoji: preset.emoji,
                color: preset.color,
                score: 0,
                health: 100,
                comboCount: 0,
                shieldActiveUntil: 0,
                shieldUsed: false,
                answeredCorrectly: [],
                answeredTotal: [],
            }));

            return room.teams;
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if (!teams) {
        return NextResponse.json({ error: "O'yin topilmadi yoki allaqachon boshlangan" }, { status: 400 });
    }

    return NextResponse.json({
        ok: true,
        teams: teams.map(t => ({ id: t.id, name: t.name, emoji: t.emoji, color: t.color })),
    });
}
