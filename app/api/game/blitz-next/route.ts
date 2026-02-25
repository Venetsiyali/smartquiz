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

    // Shuffle for order questions; scramble for anagram
    let broadcastOptions = question.options;
    let broadcastOptionImages = question.optionImages;
    let anagramScrambled: string | null = null;
    if (question.type === 'order') {
        const indices = question.options.map((_, i) => i);
        const shuffledIndices = shuffle(indices);
        broadcastOptions = shuffledIndices.map(i => question.options[i]);
        if (question.optionImages) {
            broadcastOptionImages = shuffledIndices.map(i => question.optionImages![i]);
        }
    } else if (question.type === 'anagram') {
        const word = question.options[0] || '';
        anagramScrambled = shuffle(word.split('')).join('');
        // Ensure scrambled word is different from original if possible
        if (word.length > 1 && anagramScrambled === word) {
            anagramScrambled = shuffle(word.split('')).join('');
        }
        broadcastOptions = []; // don't reveal the answer
    }

    await pusherServer.trigger(`game-${pin}`, 'question-start', {
        questionIndex: freshRoom.currentQuestionIndex,
        total: freshRoom.questions.length,
        type: question.type || 'blitz',
        text: question.text,
        options: broadcastOptions, // Use broadcastOptions
        optionImages: broadcastOptionImages || null, // Use broadcastOptionImages
        pairs: question.pairs || null,
        timeLimit: question.timeLimit,
        imageUrl: question.imageUrl || null,
        questionStartTime: freshRoom.questionStartTime,
        anagramScrambled: anagramScrambled, // Add anagramScrambled
    });

    return NextResponse.json({ ok: true });
}
