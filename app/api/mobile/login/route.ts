import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'ZukkoMobileSuperSecretKey2026';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Elektron pochta va parol kiritilishi shart" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
            return NextResponse.json({ error: "Foydalanuvchi topilmadi yoki parol noto'g'ri" }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json({ error: "Parol noto'g'ri" }, { status: 401 });
        }

        // Generate a token for the mobile device
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            message: "Muvaffaqiyatli kirdi",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.image
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Mobile Login Error:", error);
        return NextResponse.json({ error: "Ichki server xatosi" }, { status: 500 });
    }
}
