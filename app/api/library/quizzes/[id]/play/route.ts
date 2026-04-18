import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const quiz = await prisma.libraryQuiz.update({
            where: { id: params.id },
            data: { play_count: { increment: 1 } },
            select: { play_count: true },
        });
        return NextResponse.json({ play_count: quiz.play_count });
    } catch {
        return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
    }
}
