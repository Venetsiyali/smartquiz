import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/superAdmin";

const ALLOWED_ROLES = ['STUDENT', 'TEACHER', 'MODERATOR', 'ADMIN'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Ruxsat etilmagan" }, { status: 403 });
    }

    try {
        const { role, plan } = await req.json();

        const target = await prisma.user.findUnique({ where: { id: params.id }, select: { email: true, role: true } });
        if (!target) {
            return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
        }

        const updateData: { role?: any; plan?: any } = {};
        if (role && ALLOWED_ROLES.includes(role) && role !== target.role) {
            const actorIsSuper = isSuperAdmin(session.user.email);
            if (isSuperAdmin(target.email)) {
                return NextResponse.json({ error: "Asosiy adminning rolini o'zgartirib bo'lmaydi" }, { status: 403 });
            }
            if (params.id === session.user.id) {
                return NextResponse.json({ error: "O'z rolingizni o'zgartira olmaysiz" }, { status: 403 });
            }
            if ((role === 'ADMIN' || target.role === 'ADMIN') && !actorIsSuper) {
                return NextResponse.json({ error: "ADMIN rolini faqat asosiy admin bera oladi yoki olib qo'ya oladi" }, { status: 403 });
            }
            updateData.role = role;
        }
        if (plan && ['FREE', 'PRO'].includes(plan)) updateData.plan = plan;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Hech narsa yangilanmadi" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            select: { id: true, email: true, name: true, role: true, plan: true }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("User update error:", error);
        return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
    }
}
