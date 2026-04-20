import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Kirish talab etiladi' }, { status: 401 });
    }
    const quiz = await prisma.quiz.findFirst({
        where: { id: params.id, userId: session.user.id },
        select: { id: true, title: true, questions: true },
    });
    if (!quiz) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
    return NextResponse.json({ quiz });
}
