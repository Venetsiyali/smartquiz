import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { availability, buildOrder, newToken, normalizeCode, type AssignmentQuestion } from '@/lib/assignments';

// Sinfdagi o'quvchilar bitta Wi-Fi (bitta IP) orqali kirishi mumkin — limit shunga yetarli katta
const limiter = rateLimit({ windowMs: 10 * 60_000, max: 200 });

const BodySchema = z.object({
    name: z.string().trim().min(2, 'Ismingizni kiriting').max(60),
    group: z.string().trim().max(40).default(''),
    deviceId: z.string().trim().min(8).max(100),
});

export async function POST(req: Request, { params }: { params: { code: string } }) {
    const code = normalizeCode(params.code);
    const limit = limiter(`assign:${code}:${getClientIp(req)}`);
    if (!limit.success) return NextResponse.json({ error: "Juda koʻp soʻrov, birozdan soʻng urinib koʻring" }, { status: 429 });

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Maʼlumot notoʻgʻri" }, { status: 400 });
    const { name, group, deviceId } = parsed.data;

    const a = await prisma.assignment.findUnique({ where: { code } });
    if (!a) return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 });
    const { open, reason } = availability(a);
    if (!open) return NextResponse.json({ error: reason }, { status: 403 });

    // Shu qurilmada tugallanmagan urinish bo'lsa — yangisini ochmay, o'shani davom ettiramiz
    const unfinished = await prisma.assignmentAttempt.findFirst({
        where: { assignmentId: a.id, deviceId, submittedAt: null },
        select: { id: true, token: true },
    });
    if (unfinished) return NextResponse.json({ attemptId: unfinished.id, token: unfinished.token, resumed: true });

    if (a.maxAttempts > 0) {
        const used = await prisma.assignmentAttempt.count({ where: { assignmentId: a.id, deviceId } });
        if (used >= a.maxAttempts) {
            return NextResponse.json({ error: `Bu topshiriqni ${a.maxAttempts} marta yechish mumkin — urinishlaringiz tugagan` }, { status: 403 });
        }
    }

    const session = await getServerSession(authOptions);
    const questions = a.questions as AssignmentQuestion[];
    const token = newToken();
    const attempt = await prisma.assignmentAttempt.create({
        data: {
            assignmentId: a.id,
            token,
            studentName: name,
            groupName: group,
            deviceId,
            userId: session?.user?.id ?? null,
            order: buildOrder(questions.length, a.shuffle) as any,
            total: questions.length,
        },
        select: { id: true },
    });
    return NextResponse.json({ attemptId: attempt.id, token });
}
