import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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

        const quiz = await prisma.quiz.create({
            data: {
                userId: session.user.id,
                title: libraryQuiz.title,
                description: `Kutubxonadan nusxa: ${libraryQuiz.subject} · ${libraryQuiz.grade}`,
                questions: libraryQuiz.questions as any,
                isPublic: false,
            },
        });

        return NextResponse.json({ quizId: quiz.id });
    } catch {
        return NextResponse.json({ error: 'Nusxa olishda xatolik' }, { status: 500 });
    }
}
