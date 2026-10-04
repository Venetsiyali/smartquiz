import { NextResponse } from 'next/server';
import { triggerAll, type PusherEvent } from '@/lib/pusher';
import { withRoom, getLeaderboard, computeBadges, resetTeamQuestion, getTeamLeaderboard, prepareCurrentQuestion, questionPayload } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    let result: { events: PusherEvent[]; ended: boolean } | null;
    try {
        result = await withRoom(pin, room => {
            if (!room) return null;

            room.currentQuestionIndex++;

            if (room.currentQuestionIndex >= room.questions.length) {
                room.status = 'ended';
                return {
                    ended: true,
                    events: [{
                        channel: `game-${pin}`,
                        name: 'game-end',
                        data: { leaderboard: getLeaderboard(room.players), badges: computeBadges(room.players) },
                    }],
                };
            }

            room.status = 'question';
            room.questionStartTime = Date.now();
            room.answeredPlayerIds = [];

            const events: PusherEvent[] = [];
            // Reset per-question team tracking; host race track re-syncs
            if (room.teamMode && room.teams) {
                resetTeamQuestion(room.teams);
                events.push({
                    channel: `game-${pin}`,
                    name: 'team-update',
                    data: { teams: getTeamLeaderboard(room.teams), triggeredBy: null, combo: null },
                });
            }

            prepareCurrentQuestion(room);
            events.push({ channel: `game-${pin}`, name: 'question-start', data: questionPayload(room) });
            return { ended: false, events };
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if (!result) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });
    await triggerAll(result.events);
    return NextResponse.json({ ok: true, ...(result.ended ? { ended: true } : {}) });
}
