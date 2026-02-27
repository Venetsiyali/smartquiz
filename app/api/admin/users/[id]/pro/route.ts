import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendProUpgradeEmail } from "@/lib/mailer";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Ruxsat etilmagan" }, { status: 403 });
    }

    try {
        const userId = params.id;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { plan: "PRO" },
        });

        // Send PRO upgrade email using Resend + React Email
        if (user.email && user.name) {
            await sendProUpgradeEmail(user.email, user.name);
        }

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("PRO Upgrade Error:", error);
        return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
    }
}
