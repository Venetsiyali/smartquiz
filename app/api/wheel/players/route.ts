import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacherId, getOwnedWheelSession } from '@/lib/wheel/authz';
import { WheelPlayersBodySchema } from '@/lib/wheel/schema';

export async function POST(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const parsed = WheelPlayersBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: "Ism ro'yxati noto'g'ri formatda" }, { status: 400 });
    }
    const { sessionId, names } = parsed.data;

    const owned = await getOwnedWheelSession(sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 });
    }

    const uniqueNames = Array.from(new Set(names.map(n => n.trim()).filter(Boolean)));
    const players = await prisma.$transaction(
        uniqueNames.map(name => prisma.wheelPlayer.create({ data: { sessionId, name } }))
    );

    return NextResponse.json({ players });
}

export async function DELETE(req: Request) {
    const teacherId = await requireTeacherId();
    if (!teacherId) {
        return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('id');
    if (!playerId) {
        return NextResponse.json({ error: "O'quvchi id ko'rsatilmagan" }, { status: 400 });
    }

    const player = await prisma.wheelPlayer.findUnique({ where: { id: playerId } });
    if (!player) {
        return NextResponse.json({ error: "O'quvchi topilmadi" }, { status: 404 });
    }
    const owned = await getOwnedWheelSession(player.sessionId, teacherId);
    if (!owned) {
        return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    await prisma.wheelPlayer.delete({ where: { id: playerId } });
    return NextResponse.json({ success: true });
}
