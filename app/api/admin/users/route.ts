import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/superAdmin";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Ruxsat etilmagan" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                plan: true,
                lastLogin: true,
                totalGamesPlayed: true,
            }
        });
        return NextResponse.json({
            users: users.map(u => ({ ...u, isSuperAdmin: isSuperAdmin(u.email) })),
            viewer: { id: session.user.id, isSuperAdmin: isSuperAdmin(session.user.email) },
        });
    } catch (error) {
        return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
    }
}
