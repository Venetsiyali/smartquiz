import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const ALLOWED_ROLES = ['MODERATOR', 'ADMIN'];

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const quiz = await prisma.libraryQuiz.update({
            where: { id: params.id },
            data: body,
        });
        return NextResponse.json({ quiz });
    } catch {
        return NextResponse.json({ error: 'Topilmadi yoki xatolik' }, { status: 404 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ROLES.includes(session.user.role as string)) {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    try {
        await prisma.libraryQuiz.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
    }
}
