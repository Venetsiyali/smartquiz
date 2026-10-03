import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/adminAuth';
import { contentHash } from '@/lib/questionBank/bank';
import { SUBJECTS } from '@/lib/questionBank/subjects';

const EditSchema = z.object({
    text: z.string().trim().min(5).max(1000),
    options: z.array(z.string().trim().min(1).max(300)).length(4)
        .refine(o => new Set(o.map(x => x.toLowerCase())).size === 4, 'Variantlar takrorlanmasin'),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().trim().max(1000).default(''),
    hint: z.string().trim().max(500).default(''),
    subject: z.string().refine(s => SUBJECTS.includes(s), "Noma'lum fan"),
    topic: z.string().trim().max(200).default(''),
    grade: z.number().int().min(1).max(12).nullable(),
    difficulty: z.number().int().min(1).max(3),
});

const BodySchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('approve') }),
    z.object({ action: z.literal('reject'), note: z.string().max(300).optional() }),
    z.object({ action: z.literal('save'), data: EditSchema, approve: z.boolean().default(false) }),
]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await requireModerator();
    if (!session) {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Noto'g'ri so'rov" }, { status: 400 });
    }
    const body = parsed.data;

    const question = await prisma.bankQuestion.findUnique({ where: { id: params.id } });
    if (!question) {
        return NextResponse.json({ error: 'Savol topilmadi' }, { status: 404 });
    }

    const who = session.user.name || session.user.email || 'admin';
    const today = new Date().toISOString().slice(0, 10);
    const resolveReports = prisma.bankReport.updateMany({ where: { questionId: question.id, resolved: false }, data: { resolved: true } });

    let data: Prisma.BankQuestionUpdateInput;
    if (body.action === 'approve') {
        data = { status: 'APPROVED', verifiedAt: question.verifiedAt ?? new Date(), reviewNote: `${who} tasdiqladi (${today})` };
    } else if (body.action === 'reject') {
        data = { status: 'REJECTED', reviewNote: `${who} rad etdi (${today})${body.note ? `: ${body.note}` : ''}`.slice(0, 500) };
    } else {
        const d = body.data;
        data = {
            ...d,
            contentHash: contentHash(d.text, question.language),
            ...(body.approve
                ? { status: 'APPROVED', verifiedAt: question.verifiedAt ?? new Date(), reviewNote: `${who} tahrirlab tasdiqladi (${today})` }
                : { reviewNote: `${who} tahrirladi (${today})` }),
        };
    }

    try {
        const [updated] = await prisma.$transaction([
            prisma.bankQuestion.update({ where: { id: question.id }, data }),
            ...(body.action === 'save' && !body.approve ? [] : [resolveReports]),
        ]);
        return NextResponse.json({ question: updated });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            return NextResponse.json({ error: 'Bunday matnli savol omborda allaqachon bor' }, { status: 409 });
        }
        throw err;
    }
}
