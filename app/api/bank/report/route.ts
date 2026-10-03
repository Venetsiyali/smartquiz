import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contentHash } from '@/lib/questionBank/bank';

// Shuncha turli o'qituvchi shikoyat qilsa, savol o'yinlardan vaqtincha olinadi (admin ko'rib chiqadi)
const HIDE_THRESHOLD = 2;

const BodySchema = z.object({
    text: z.string().min(3).max(1000),
    reason: z.string().max(300).default(''),
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Xabar berish uchun tizimga kiring' }, { status: 401 });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
    }
    const { text, reason } = parsed.data;

    const question = await prisma.bankQuestion.findUnique({ where: { contentHash: contentHash(text) } });
    if (!question) {
        // O'qituvchining o'zi yozgan yoki ombordan tashqari savol — omborga ta'siri yo'q
        return NextResponse.json({ found: false });
    }

    const existing = await prisma.bankReport.findUnique({
        where: { questionId_userId: { questionId: question.id, userId: session.user.id } },
    });
    if (existing) {
        return NextResponse.json({ found: true, alreadyReported: true });
    }

    await prisma.bankReport.create({ data: { questionId: question.id, userId: session.user.id, reason } });
    const openReports = await prisma.bankReport.count({ where: { questionId: question.id, resolved: false } });

    const hide = question.status === 'APPROVED' && openReports >= HIDE_THRESHOLD;
    await prisma.bankQuestion.update({
        where: { id: question.id },
        data: {
            reportCount: { increment: 1 },
            ...(hide ? {
                status: 'PENDING',
                verifiedAt: question.verifiedAt ?? new Date(), // avtomatik tekshiruv qayta tasdiqlab yubormasin

                reviewNote: `${openReports} ta o'qituvchi xato deb belgiladi — o'yinlardan olindi`.slice(0, 500),
            } : {}),
        },
    });

    return NextResponse.json({ found: true, hidden: hide });
}
