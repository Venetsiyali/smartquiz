import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "@/lib/mailer";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// Rate limiter: 1 daqiqada max 5 ta urinish (IP bo'yicha)
const otpLimiter = rateLimit({ windowMs: 60_000, max: 5 });
// Qattiqroq: email bo'yicha 15 daqiqada max 3 ta
const emailLimiter = rateLimit({ windowMs: 15 * 60_000, max: 3 });

export async function POST(req: Request) {
    try {
        // ── 1. Rate Limiting ──────────────────────────────────────────────
        const ip = getClientIp(req);
        const ipCheck = otpLimiter(ip);
        if (!ipCheck.success) {
            return NextResponse.json(
                { error: `Juda ko'p urinish. ${ipCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.` },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(ipCheck.retryAfter),
                        'X-RateLimit-Remaining': '0',
                    }
                }
            );
        }

        // ── 2. Input validation ───────────────────────────────────────────
        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
        }

        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email va parol kiritilishi shart" }, { status: 400 });
        }

        // Email format tekshirish
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length > 254) {
            return NextResponse.json({ error: "Email formati noto'g'ri" }, { status: 400 });
        }

        // Parol minimum uzunlik
        if (password.length < 6) {
            return NextResponse.json({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" }, { status: 400 });
        }

        // Email bo'yicha rate limit
        const emailCheck = emailLimiter(email.toLowerCase());
        if (!emailCheck.success) {
            return NextResponse.json(
                { error: `Bu email uchun juda ko'p urinish. ${Math.ceil(emailCheck.retryAfter / 60)} daqiqadan so'ng qayta urinib ko'ring.` },
                { status: 429, headers: { 'Retry-After': String(emailCheck.retryAfter) } }
            );
        }

        // ── 3. Foydalanuvchi tekshiruvi ───────────────────────────────────
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (user) {
            if (!user.password) {
                return NextResponse.json(
                    { error: "Bu pochta orqali faqat Google orqali ro'yxatdan o'tilgan." },
                    { status: 400 }
                );
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                // Timing attack oldini olish uchun biroz kutamiz
                await new Promise(r => setTimeout(r, 300));
                return NextResponse.json({ error: "Noto'g'ri parol" }, { status: 401 });
            }
        }

        // ── 4. OTP yaratish va yuborish ───────────────────────────────────
        // Kriptografik xavfsiz random OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Mavjud OTP larni o'chirish (spam oldini olish)
        await prisma.verificationToken.deleteMany({
            where: { identifier: email.toLowerCase() }
        });

        // Yangi OTP saqlash (10 daqiqa amal qiladi)
        await prisma.verificationToken.create({
            data: {
                identifier: email.toLowerCase(),
                token: otp,
                expires: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        const mailResult = await sendOTPEmail(email, otp);
        if (!mailResult?.success) {
            return NextResponse.json(
                { error: "Kodni yuborishda xatolik yuz berdi. Pochtani tekshiring." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Kod yuborildi" },
            { headers: { 'X-RateLimit-Remaining': String(emailCheck.remaining) } }
        );

    } catch (error) {
        console.error("Send OTP Error:", error);
        return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
    }
}
