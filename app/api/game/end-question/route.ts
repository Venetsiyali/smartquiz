import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { withRoom, getLeaderboard } from '@/lib/gameState';
import { recordAnswerStats } from '@/lib/questionBank/stats';

export async function POST(req: Request) {
    const { pin }: { pin: string } = await req.json();

    let result;
    try {
        result = await withRoom(pin, room => {
            if (!room) return null;

            const question = room.questions[room.currentQuestionIndex];
            // Birinchi yakunlashdagina statistika yoziladi (keyingi chaqiruvlar — faqat qayta e'lon)
            const firstEnd = room.status === 'question';
            room.status = 'leaderboard';

            const correct = room.questionStats?.index === room.currentQuestionIndex ? room.questionStats.correct : 0;
            return {
                question,
                firstEnd,
                answered: room.answeredPlayerIds.length,
                correct,
                payload: {
                    correctOptions: question.correctOptions,
                    explanation: question.explanation || null,
                    options: question.options,
                    leaderboard: getLeaderboard(room.players),
                    isLastQuestion: room.currentQuestionIndex >= room.questions.length - 1,
                },
            };
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Server band' }, { status: 503 });
    }

    if (!result) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 400 });

    await pusherServer.trigger(`game-${pin}`, 'question-end', result.payload);

    // Ombordagi ko'p tanlovli savol bo'lsa — natijani statistikaga yozamiz
    if (result.firstEnd && (result.question.type ?? 'multiple') === 'multiple') {
        await recordAnswerStats(result.question.text, result.answered, result.correct);
    }

    return NextResponse.json({ ok: true });
}
