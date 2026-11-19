import { NextResponse } from 'next/server';
import { z } from 'zod';
import { attemptState, loadAttempt, submitAnswer, tokenMatches } from '@/lib/assignments';

const BodySchema = z.object({
    position: z.number().int().min(0),
    selected: z.number().int().min(0).max(3),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const attempt = await loadAttempt(params.id);
    if (!attempt || !tokenMatches(attempt.token, req.headers.get('x-attempt-token'))) {
        return NextResponse.json({ error: 'Urinish topilmadi' }, { status: 404 });
    }
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Maʼlumot notoʻgʻri" }, { status: 400 });

    const result = await submitAnswer(attempt, parsed.data.position, parsed.data.selected);
    // Har holda navbatdagi holatni qaytaramiz — ekran serverga mos ravishda yangilanadi
    const state = await attemptState((await loadAttempt(attempt.id))!);
    return NextResponse.json({ ...state, late: result.late ?? false, notice: result.error ?? null }, { status: 200 });
}
