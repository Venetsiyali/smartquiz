import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
        }

        const quizzes = await db.quiz.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ success: true, quizzes });
    } catch (error) {
        console.error("FETCHING QUIZZES ERROR:", error);
        return NextResponse.json({ error: "O'yinlarni yuklashda xatolik yuz berdi" }, { status: 500 });
    }
}
