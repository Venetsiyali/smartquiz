import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Telefon soati noto'g'ri bo'lsa ham savol taymeri to'g'ri ishlashi uchun — server vaqti
export function GET() {
    return NextResponse.json({ now: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
