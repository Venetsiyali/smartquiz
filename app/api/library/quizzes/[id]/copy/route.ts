import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// ─── Format converter ──────────────────────────────────────────────────────────
// Library quizzes may be saved in old format {question, correctAnswer, wrongAnswers}
// or new format {id, text, options:[{text, isCorrect}], timeLimit}.
// teacher/create page always needs the new format.
function normalizeQuestions(rawQuestions: any[]): any[] {
    if (!Array.isArray(rawQuestions)) return [];

    return rawQuestions.map((q: any) => {
        // Already new format
        if (q.options && Array.isArray(q.options) && q.options[0]?.hasOwnProperty?.('isCorrect')) {
            return {
                id: q.id || uuidv4(),
                text: q.text || q.question || '',
                options: q.options,
                timeLimit: q.timeLimit || 20,
                hint: q.hint || '',
                imageUrl: q.imageUrl || '',
            };
        }

        // Old format: {question, correctAnswer, wrongAnswers:[w1,w2,w3]}
        const correct: string = q.correctAnswer || '';
        const wrongs: string[] = Array.isArray(q.wrongAnswers) ? q.wrongAnswers : [];

        // Shuffle options so correct is not always first
        const options = [
            { text: correct, isCorrect: true },
            ...wrongs.slice(0, 3).map((w: string) => ({ text: w, isCorrect: false })),
        ];

        return {
            id: uuidv4(),
            text: q.question || q.text || '',
            options,
            timeLimit: q.timeLimit || 20,
            hint: q.hint || '',
            imageUrl: q.imageUrl || '',
        };
    });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Kirish talab etiladi' }, { status: 401 });
    }

    try {
        const libraryQuiz = await prisma.libraryQuiz.findUnique({ where: { id: params.id } });
        if (!libraryQuiz) {
            return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
        }

        // Normalize questions to new format before saving to quiz
        const normalizedQuestions = normalizeQuestions(libraryQuiz.questions as any[]);

        const quiz = await prisma.quiz.create({
            data: {
                userId: session.user.id,
                title: libraryQuiz.title,
                description: `Kutubxonadan nusxa: ${libraryQuiz.subject} · ${libraryQuiz.grade}`,
                questions: normalizedQuestions as any,
                isPublic: false,
            },
        });

        return NextResponse.json({ quizId: quiz.id, title: libraryQuiz.title, questions: normalizedQuestions });
    } catch {
        return NextResponse.json({ error: 'Nusxa olishda xatolik' }, { status: 500 });
    }
}

