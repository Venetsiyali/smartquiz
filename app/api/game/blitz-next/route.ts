import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, getLeaderboard, computeBadges } from '@/lib/gameState';

export async function POST(req: Request) {
    const { pin, fromIndex }: { pin: string; fromIndex?: number } = await req.json();

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });

    // Prevent double-advance: if room already moved past fromIndex, ignore
    if (fromIndex !== undefined && room.currentQuestionIndex !== fromIndex) {
        return NextResponse.json({ ok: true, skipped: true });
    }

    // Broadcast 1-second "between" countdown
    await pusherServer.trigger(`game-${pin}`, 'blitz-between', { countdown: 1 });

    // Wait 1 second then advance
    await new Promise(r => setTimeout(r, 1000));

    // Re-fetch room in case of concurrent update
    const freshRoom = await getRoom(pin);
    if (!freshRoom) return NextResponse.json({ ok: true });

    freshRoom.currentQuestionIndex += 1;

    if (freshRoom.currentQuestionIndex >= freshRoom.questions.length) {
        freshRoom.status = 'ended';
        await saveRoomData(freshRoom);
        const leaderboard = getLeaderboard(freshRoom.players);
        const badges = computeBadges(freshRoom.players);
        await pusherServer.trigger(`game-${pin}`, 'game-end', { leaderboard, badges });
        return NextResponse.json({ ok: true, ended: true });
    }

    freshRoom.status = 'question';
    freshRoom.questionStartTime = Date.now();
    freshRoom.answeredPlayerIds = [];
    await saveRoomData(freshRoom);

    const question = freshRoom.questions[freshRoom.currentQuestionIndex];

    await pusherServer.trigger(`game-${pin}`, 'question-start', {
        questionIndex: freshRoom.currentQuestionIndex,
        total: freshRoom.questions.length,
        type: question.type || 'blitz',
        text: question.text,
        options: question.options,
        optionImages: question.optionImages || null,
        pairs: question.pairs || null,
        timeLimit: question.timeLimit,
        imageUrl: question.imageUrl || null,
        questionStartTime: freshRoom.questionStartTime,
    });

    return NextResponse.json({ ok: true });
}
