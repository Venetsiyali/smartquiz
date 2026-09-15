import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacherId, getOwnedWheelSession } from '@/lib/wheel/authz';

export async function POST(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : "Bilimlar g'ildiragi";

    const wheelSession = await prisma.wheelSession.create({
        data: { teacherId, title },
    });

    return NextResponse.json({ session: wheelSession });
}

export async function GET(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
        return NextResponse.json({ error: 'sessionId ko\'rsatilmagan' }, { status: 400 });
    }

    const owned = await getOwnedWheelSession(sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 });
    }

    const players = await prisma.wheelPlayer.findMany({
        where: { sessionId },
        orderBy: { score: 'desc' },
    });

    return NextResponse.json({ session: owned, players });
}

export async function PATCH(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId, status } = body;
    if (!sessionId || status !== 'ended') {
        return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
    }

    const owned = await getOwnedWheelSession(sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 });
    }

    const updated = await prisma.wheelSession.update({
        where: { id: sessionId },
        data: { status: 'ended', endedAt: new Date() },
    });

    return NextResponse.json({ session: updated });
}
