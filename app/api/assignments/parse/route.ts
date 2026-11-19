import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { readImportFile } from '@/lib/questionBank/importFile';
import { parseTable, parseTextFormat } from '@/lib/questionBank/importParser';
import { qualityIssues } from '@/lib/questionQuality';
import { ASSIGNMENT_QUESTION_LIMIT } from '@/lib/assignments';

export const maxDuration = 60;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Fayl (DOCX/PDF/TXT/CSV/XLSX) → topshiriq savollari. AI ishlatilmaydi: savollar ombori importidagi qoidalar bilan.
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Tizimga kiring' }, { status: 401 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Fayl hajmi 5MB dan oshmasligi kerak' }, { status: 400 });

    let parsed;
    try {
        const content = await readImportFile(file.name, Buffer.from(await file.arrayBuffer()));
        // Fan majburiy emas — topshiriqda faqat savollar kerak
        const defaults = { subject: 'Umumiy bilim', lenientSubject: true };
        parsed = content.kind === 'text' ? parseTextFormat(content.text, defaults) : parseTable(content.rows, defaults);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Faylni oʻqib boʻlmadi" }, { status: 400 });
    }

    const errors = [...parsed.errors];
    const warnings: { ref: string; issues: string[] }[] = [];
    for (const q of parsed.questions) {
        const issues = qualityIssues({ question: q.text, options: q.options, correctIndex: q.correctIndex });
        if (issues.length) warnings.push({ ref: q.ref, issues });
    }
    if (parsed.questions.length > ASSIGNMENT_QUESTION_LIMIT) {
        return NextResponse.json({ error: `Bitta topshiriqda koʻpi bilan ${ASSIGNMENT_QUESTION_LIMIT} ta savol boʻlishi mumkin` }, { status: 400 });
    }

    return NextResponse.json({
        questions: parsed.questions.map(q => ({ text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })),
        errors: errors.slice(0, 100),
        errorCount: errors.length,
        warnings: warnings.slice(0, 100),
    });
}
