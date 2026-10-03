import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import builtinQuestions from '@/lib/questionBank/seed/builtin-uz.json';

// Built-in general questions always available (savollar ombori seed'i bilan umumiy manba)
const BUILTIN: { subject: string; text: string; options: string[]; correctIndex: number; explanation?: string }[] = builtinQuestions;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    // Try to fetch admin-added questions from LibraryQuiz
    let dbQuestions: { subject: string; text: string; options: string[]; correctIndex: number; explanation?: string }[] = [];
    try {
        const rows = await prisma.libraryQuiz.findMany({
            where: { game_type: 'Qishloq Bozori', is_active: true },
            select: { subject: true, questions: true },
        });
        for (const row of rows) {
            const qs = row.questions as any[];
            if (Array.isArray(qs)) {
                for (const q of qs) {
                    if (q.text && Array.isArray(q.options)) {
                        dbQuestions.push({
                            subject: row.subject,
                            text: q.text,
                            options: q.options,
                            correctIndex: q.correctIndex ?? 0,
                            explanation: q.explanation,
                        });
                    }
                }
            }
        }
    } catch { /* DB not available, use built-in only */ }

    const all = [...BUILTIN, ...dbQuestions];
    const filtered = subject && subject !== 'Barcha'
        ? all.filter(q => q.subject === subject)
        : all;

    // Group by subject
    const bySubject: Record<string, typeof all> = {};
    for (const q of filtered) {
        if (!bySubject[q.subject]) bySubject[q.subject] = [];
        bySubject[q.subject].push(q);
    }

    const subjects = [...new Set(all.map(q => q.subject))];

    return NextResponse.json({ questions: filtered, bySubject, subjects, total: filtered.length });
}
