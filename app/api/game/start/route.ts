import { NextResponse } from 'next/server';
import { triggerAll, type PusherEvent } from '@/lib/pusher';
import { withRoom, resetTeamQuestion, prepareCurrentQuestion, questionPayload, type Player, type Team } from '@/lib/gameState';

// Fisher-Yates shuffle (returns new array, original untouched)
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Fill in any player without a teamId, picking the smallest team to keep balance. */
function assignStragglers(players: Player[], teams: Team[]): void {
    const stragglers = shuffle(players.filter(p => !p.teamId));
    for (const p of stragglers) {
        const counts = teams.map(t => players.filter(pl => pl.teamId === t.id).length);
        const minIdx = counts.indexOf(Math.min(...counts));
        p.teamId = teams[minIdx].id;
    }
}

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    let events: PusherEvent[] | null;
    try {
        events = await withRoom(pin, room => {
            if (!room || room.status !== 'lobby') return null;

            room.status = 'question';
            room.currentQuestionIndex = 0;
            room.questionStartTime = Date.now();
            room.answeredPlayerIds = [];

            // Team mode: keep player-chosen teams; only auto-assign stragglers
            if (room.teamMode && room.teams && room.teams.length > 0) {
                assignStragglers(room.players, room.teams);
                resetTeamQuestion(room.teams);
            }

            prepareCurrentQuestion(room);

            const out: PusherEvent[] = [];
            // Jamoalar savoldan oldin e'lon qilinadi
            if (room.teamMode && room.teams) {
                out.push({
                    channel: `game-${pin}`,
                    name: 'team-assigned',
                    data: { teams: room.teams, playerTeams: room.players.map(p => ({ id: p.id, teamId: p.teamId })) },
                });
            }
            out.push({ channel: `game-${pin}`, name: 'question-start', data: questionPayload(room) });
            return out;
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if (!events) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });
    await triggerAll(events);
    return NextResponse.json({ ok: true });
}
