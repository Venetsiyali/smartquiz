import { NextResponse } from 'next/server';
import { attemptState, loadAttempt, tokenMatches } from '@/lib/assignments';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const attempt = await loadAttempt(params.id);
    if (!attempt || !tokenMatches(attempt.token, req.headers.get('x-attempt-token'))) {
        return NextResponse.json({ error: 'Urinish topilmadi' }, { status: 404 });
    }
    return NextResponse.json(await attemptState(attempt), { headers: { 'Cache-Control': 'no-store' } });
}
