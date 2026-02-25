import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { getRoom, saveRoomData, assignTeams, resetTeamQuestion } from '@/lib/gameState';


// Fisher-Yates shuffle (returns new array, original untouched)
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
    if (!room || room.status !== 'lobby') {
        return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });
    }

    room.status = 'question';
    room.currentQuestionIndex = 0;
    room.questionStartTime = Date.now();
    room.answeredPlayerIds = [];

    // Team mode: assign players to teams and broadcast
    if (room.teamMode && room.teams && room.teams.length > 0) {
        assignTeams(room.players, room.teams);
        resetTeamQuestion(room.teams);
    }

    await saveRoomData(room);

    // Broadcast team assignments before question-start
    if (room.teamMode && room.teams) {
        await pusherServer.trigger(`game-${pin}`, 'team-assigned', {
            teams: room.teams,
            playerTeams: room.players.map(p => ({ id: p.id, teamId: p.teamId })),
        });
    }

    const question = room.questions[0];

    // For order questions — shuffle options before broadcasting
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
        // Make sure scrambled != original (shuffle again if needed)
        if (word.length > 1 && anagramScrambled === word) {
            anagramScrambled = shuffle(word.split('')).join('');
        }
        broadcastOptions = []; // don't send the answer
    }

    await pusherServer.trigger(`game-${pin}`, 'question-start', {
        questionIndex: 0,
        total: room.questions.length,
        type: question.type || 'multiple',
        text: question.text,
        options: broadcastOptions,
        optionImages: broadcastOptionImages || null,
        pairs: question.pairs || null,
        anagramScrambled,                      // scrambled string or null
        anagramWordLength: question.type === 'anagram' ? (question.options[0] || '').length : null,
        timeLimit: question.timeLimit,
        imageUrl: question.imageUrl,
        questionStartTime: room.questionStartTime,
    });

    return NextResponse.json({ ok: true });
}
