import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shuffle } from '@/lib/shuffle';
import builtinQuestions from '@/lib/questionBank/seed/builtin-uz.json';

export const dynamic = 'force-dynamic';

type BozorQuestion = { subject: string; text: string; options: string[]; correctIndex: number; explanation?: string };

// Tizimga kirmaganlar uchun doim mavjud ichki savollar
const BUILTIN: BozorQuestion[] = builtinQuestions;
// Har ochilganda har fandan shuncha tasodifiy savol (ombor katta bo'lsa ham javob yengil qoladi)
const PER_SUBJECT = 80;

async function fromBank(subject: string | null): Promise<BozorQuestion[]> {
    const ids = await prisma.bankQuestion.findMany({
        where: { status: 'APPROVED', language: 'uz', ...(subject ? { subject } : {}) },
        select: { id: true, subject: true },
        take: 10_000,
    });
    const bySubject = new Map<string, string[]>();
    for (const r of ids) bySubject.set(r.subject, [...(bySubject.get(r.subject) ?? []), r.id]);
    const picked = Array.from(bySubject.values()).flatMap(list => shuffle(list).slice(0, PER_SUBJECT));

    const rows = await prisma.bankQuestion.findMany({ where: { id: { in: picked } } });
    return rows.map(r => {
        const options = r.options as string[];
        const correctText = options[r.correctIndex];
        const shuffled = shuffle(options);
        return {
            subject: r.subject,
            text: r.text,
            options: shuffled,
            correctIndex: shuffled.indexOf(correctText),
            explanation: r.explanation || undefined,
        };
    });
}

async function fromLibrary(): Promise<BozorQuestion[]> {
    const rows = await prisma.libraryQuiz.findMany({
        where: { game_type: 'Qishloq Bozori', is_active: true },
        select: { subject: true, questions: true },
    });
    return rows.flatMap(row => (Array.isArray(row.questions) ? (row.questions as any[]) : [])
        .filter(q => q.text && Array.isArray(q.options))
        .map(q => ({ subject: row.subject, text: q.text, options: q.options, correctIndex: q.correctIndex ?? 0, explanation: q.explanation })));
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subjectParam = searchParams.get('subject');
    const subject = subjectParam && subjectParam !== 'Barcha' ? subjectParam : null;

    let all: BozorQuestion[] = BUILTIN;
    try {
        const session = await getServerSession(authOptions);
        // Umumiy ombor faqat tizimga kirganlarga — ochiq internetga to'liq chiqmasin
        const bank = session?.user?.id ? await fromBank(subject) : [];
        all = [...(bank.length > 0 ? bank : BUILTIN), ...(await fromLibrary())];
    } catch { /* DB mavjud emas — ichki savollar */ }

    const filtered = subject ? all.filter(q => q.subject === subject) : all;
    const bySubject: Record<string, BozorQuestion[]> = {};
    for (const q of filtered) (bySubject[q.subject] ??= []).push(q);
    const subjects = Array.from(new Set(all.map(q => q.subject))).sort();

    return NextResponse.json({ questions: filtered, bySubject, subjects, total: filtered.length });
}
