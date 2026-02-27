import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email va parol kiritilishi shart" }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            // Check password
            if (!user.password) {
                return NextResponse.json({ error: "Bu pochta orqali faqat Google orqali ro'yxatdan o'tilgan." }, { status: 400 });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Noto'g'ri parol" }, { status: 400 });
            }
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Expire any existing OTPs for this identifier to prevent spam/abuse
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        });

        // Save new OTP
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: otp,
                expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });

        // Send Email
        const mailResult = await sendOTPEmail(email, otp);
        if (!mailResult?.success) {
            return NextResponse.json({ error: "Kodni yuborishda xatolik yuz berdi. Pochtani tekshiring." }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Kod yuborildi" });
    } catch (error) {
        console.error("Send OTP Error:", error);
        return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
    }
}
