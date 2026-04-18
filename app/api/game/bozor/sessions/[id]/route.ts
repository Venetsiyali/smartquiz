import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const session = await prisma.bozorSession.findUnique({
        where: { id: params.id },
        include: { teams: { orderBy: { teamIndex: 'asc' } } },
    });
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(session);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = await req.json();
    const updated = await prisma.bozorSession.update({
        where: { id: params.id },
        data: { status: body.status ?? 'finished' },
    });
    return NextResponse.json(updated);
}
