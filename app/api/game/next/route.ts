import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, getLeaderboard, computeBadges } from '@/lib/gameState';

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    const room = await getRoom(pin);
    if (!room) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });

    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
        room.status = 'ended';
        await saveRoomData(room);
        const leaderboard = getLeaderboard(room.players);
        const badges = computeBadges(room.players);
        await pusherServer.trigger(`game-${pin}`, 'game-end', { leaderboard, badges });
        return NextResponse.json({ ok: true, ended: true });
    }

    room.status = 'question';
    room.questionStartTime = Date.now();
    room.answeredPlayerIds = [];
    await saveRoomData(room);

    const question = room.questions[room.currentQuestionIndex];

    // Shuffle for order questions
    let broadcastOptions = question.options;
    let broadcastOptionImages = question.optionImages;
    if (question.type === 'order') {
        const indices = question.options.map((_, i) => i);
        const shuffledIndices = shuffle(indices);
        broadcastOptions = shuffledIndices.map(i => question.options[i]);
        if (question.optionImages) {
            broadcastOptionImages = shuffledIndices.map(i => question.optionImages![i]);
        }
    }

    await pusherServer.trigger(`game-${pin}`, 'question-start', {
        questionIndex: room.currentQuestionIndex,
        total: room.questions.length,
        type: question.type || 'multiple',
        text: question.text,
        options: broadcastOptions,
        optionImages: broadcastOptionImages || null,
        pairs: question.pairs || null,
        timeLimit: question.timeLimit,
        imageUrl: question.imageUrl,
        questionStartTime: room.questionStartTime,
    });

    return NextResponse.json({ ok: true });
}
