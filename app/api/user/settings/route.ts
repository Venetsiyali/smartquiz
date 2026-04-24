import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const settingsLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10 }); // 15 daqiqada max 10 marta (Brute force himoyasi)

export async function PATCH(req: Request) {
    const ip = getClientIp(req);
    const limitCheck = settingsLimiter(ip);
    if (!limitCheck.success) {
        return NextResponse.json({ error: `Juda ko'p so'rov. ${Math.ceil(limitCheck.retryAfter / 60)} daqiqadan so'ng urinib ko'ring.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Ruxsat etilmagan" }, { status: 401 });
    }

    try {
        const { name, currentPassword, newPassword } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
        }

        const updateData: { name?: string; password?: string } = {};

        // Update name if provided
        if (name && name.trim().length > 0) {
            let cleanName = name.trim();
            if (cleanName.length > 50) cleanName = cleanName.substring(0, 50); // Maksimal uzunlik himoyasi
            cleanName = cleanName.replace(/[<>]/g, ""); // XSS himoyasi (HTML teglarni olib tashlash)
            updateData.name = cleanName;
        }

        // Handle password change
        if (newPassword) {
            if (newPassword.length < 6) {
                return NextResponse.json({ error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" }, { status: 400 });
            }

            // If user already has a password, verify the current one
            if (user.password) {
                if (!currentPassword) {
                    return NextResponse.json({ error: "Eski parolni kiriting" }, { status: 400 });
                }
                const isValid = await bcrypt.compare(currentPassword, user.password);
                if (!isValid) {
                    return NextResponse.json({ error: "Eski parol noto'g'ri" }, { status: 400 });
                }
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "O'zgartirish uchun biror ma'lumot kiriting" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: { id: true, name: true, email: true },
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Settings update error:", error);
        return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
    }
}
