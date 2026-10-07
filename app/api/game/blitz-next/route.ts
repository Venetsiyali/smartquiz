import { NextResponse } from 'next/server';
import { awardGameXP, collectGameXP, type GameXPAward } from '@/lib/gamification/xp';
import { pusherServer, triggerAll, type PusherEvent } from '@/lib/pusher';
import { getRoom, withRoom, getLeaderboard, computeBadges, prepareCurrentQuestion, questionPayload } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, fromIndex }: { pin: string; fromIndex?: number } = await req.json();

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });

    // Prevent double-advance: if room already moved past fromIndex, ignore
    if (fromIndex !== undefined && room.currentQuestionIndex !== fromIndex) {
        return NextResponse.json({ ok: true, skipped: true });
    }

    // Broadcast 1-second "between" countdown, then advance (lock is NOT held during the wait)
    await pusherServer.trigger(`game-${pin}`, 'blitz-between', { countdown: 1 });
    await new Promise(r => setTimeout(r, 1000));

    let result: { events: PusherEvent[]; ended?: boolean; skipped?: boolean; xp?: GameXPAward[] } | null;
    try {
        result = await withRoom(pin, fresh => {
            if (!fresh) return null;
            // Shu orada boshqa so'rov allaqachon keyingi savolga o'tkazgan bo'lsa — ikki marta o'tkazmaymiz
            if (fromIndex !== undefined && fresh.currentQuestionIndex !== fromIndex) {
                return { events: [], skipped: true };
            }

            fresh.currentQuestionIndex += 1;
            if (fresh.currentQuestionIndex >= fresh.questions.length) {
                fresh.status = 'ended';
                return {
                    ended: true,
                    xp: collectGameXP(fresh),
                    events: [{
                        channel: `game-${pin}`,
                        name: 'game-end',
                        data: { leaderboard: getLeaderboard(fresh.players), badges: computeBadges(fresh.players) },
                    }],
                };
            }

            fresh.status = 'question';
            fresh.questionStartTime = Date.now();
            fresh.answeredPlayerIds = [];
            prepareCurrentQuestion(fresh);

            const q = fresh.questions[fresh.currentQuestionIndex];
            return {
                events: [{
                    channel: `game-${pin}`,
                    name: 'question-start',
                    data: { ...questionPayload(fresh), type: q.type || 'blitz' },
                }],
            };
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if (!result) return NextResponse.json({ ok: true });
    if (result.events.length > 0) await triggerAll(result.events);
    if (result.xp) await awardGameXP(result.xp);
    return NextResponse.json({ ok: true, ...(result.ended ? { ended: true } : {}), ...(result.skipped ? { skipped: true } : {}) });
}
