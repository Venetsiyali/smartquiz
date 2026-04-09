import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Siz ro'yxatdan o'tmagansiz!" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, questions } = body;

        if (!title || !questions || questions.length === 0) {
            return NextResponse.json({ error: "Savollar va o'yin nomi kiritilishi shart." }, { status: 400 });
        }

        const newQuiz = await db.quiz.create({
            data: {
                userId: session.user.id,
                title,
                description: description || "AI yordamida yaratilgan yoki qo'lda terilgan o'yin.",
                questions, // JSON object sifatida bazaga to'g'ridan-to'g'ri tushadi
                isPublic: true,
            }
        });

        return NextResponse.json({ success: true, quiz: newQuiz });
    } catch (error) {
        console.error("SAVING QUIZ ERROR:", error);
        return NextResponse.json({ error: "O'yinni saqlashda server xatolikka yuz tutdi." }, { status: 500 });
    }
}
