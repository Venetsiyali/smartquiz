import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/adminAuth';
import { contentHash } from '@/lib/questionBank/bank';
import { parseTable, parseTextFormat, resolveSubject, type ImportDefaults, type ImportedQuestion } from '@/lib/questionBank/importParser';
import { readImportFile } from '@/lib/questionBank/importFile';
import { parseDifficulty, parseGrade } from '@/lib/questionBank/subjects';
import { qualityIssues } from '@/lib/questionQuality';

export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_QUESTIONS = 2000;
// Bu nuqsonlar bilan savol baribir qabul qilinadi, lekin admin ko'rib chiqishiga tushadi
const WARNING_ISSUES = new Set(['taqiqlangan variant', 'variant harf bilan boshlangan', "to'g'ri javob uzunligi bilan ajralib turadi"]);

export async function POST(req: Request) {
    const session = await requireModerator();
    if (!session) {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const mode = form.get('mode') === 'import' ? 'import' : 'preview';
    const targetStatus = form.get('status') === 'PENDING' ? 'PENDING' : 'APPROVED';
    if (!file) return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Fayl hajmi 5MB dan oshmasligi kerak' }, { status: 400 });

    const subjectRaw = String(form.get('subject') ?? '').trim();
    const defaults: ImportDefaults = {
        subject: subjectRaw ? resolveSubject(subjectRaw) ?? undefined : undefined,
        topic: String(form.get('topic') ?? '').trim() || undefined,
        grade: parseGrade(String(form.get('grade') ?? '')),
        difficulty: form.get('difficulty') ? parseDifficulty(String(form.get('difficulty'))) : 2,
    };

    let parsed;
    try {
        const content = await readImportFile(file.name, Buffer.from(await file.arrayBuffer()));
        parsed = content.kind === 'text' ? parseTextFormat(content.text, defaults) : parseTable(content.rows, defaults);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Faylni o'qib bo'lmadi" }, { status: 400 });
    }

    if (parsed.questions.length > MAX_QUESTIONS) {
        return NextResponse.json({ error: `Bitta faylda ko'pi bilan ${MAX_QUESTIONS} ta savol bo'lishi mumkin (${parsed.questions.length} ta topildi). Faylni bo'lib yuklang.` }, { status: 400 });
    }

    // Sifat tekshiruvi: jiddiy nuqson → xato, kichik nuqson → ogohlantirish
    const errors = [...parsed.errors];
    const accepted: (ImportedQuestion & { warnings: string[]; hash: string })[] = [];
    for (const q of parsed.questions) {
        const issues = qualityIssues({ question: q.text, options: q.options, correctIndex: q.correctIndex });
        const fatal = issues.filter(i => !WARNING_ISSUES.has(i));
        if (fatal.length > 0) {
            errors.push({ ref: q.ref, reason: `Nuqson: ${fatal.join(', ')}` });
            continue;
        }
        accepted.push({ ...q, warnings: issues, hash: contentHash(q.text) });
    }

    // Dublikatlar: fayl ichida va omborda
    const seen = new Set<string>();
    const unique = accepted.filter(q => (seen.has(q.hash) ? false : (seen.add(q.hash), true)));
    const inFile = accepted.length - unique.length;
    const existing = new Set((await prisma.bankQuestion.findMany({
        where: { contentHash: { in: unique.map(q => q.hash) } },
        select: { contentHash: true },
    })).map(r => r.contentHash));
    const fresh = unique.filter(q => !existing.has(q.hash));

    const summary = {
        found: parsed.questions.length + parsed.errors.length,
        ready: fresh.length,
        withWarnings: fresh.filter(q => q.warnings.length > 0).length,
        duplicates: { inFile, inBank: unique.length - fresh.length },
        errors: errors.slice(0, 200),
        errorCount: errors.length,
        warnings: fresh.filter(q => q.warnings.length > 0).slice(0, 100).map(q => ({ ref: q.ref, issues: q.warnings })),
        sample: fresh.slice(0, 15).map(({ hash, warnings, ...q }) => q),
    };

    if (mode === 'preview') return NextResponse.json(summary);

    const who = session.user.name || session.user.email || 'admin';
    const today = new Date().toISOString().slice(0, 10);
    const result = await prisma.bankQuestion.createMany({
        data: fresh.map(q => {
            const needsReview = q.warnings.length > 0;
            const status = needsReview ? 'PENDING' : targetStatus;
            return {
                subject: q.subject,
                topic: q.topic,
                grade: q.grade,
                difficulty: q.difficulty,
                language: 'uz',
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                hint: q.hint,
                status: status as 'PENDING' | 'APPROVED',
                source: 'IMPORT' as const,
                contentHash: q.hash,
                generatedBy: 'import',
                // Ogohlantirishli savollar admin navbatiga; "AI tekshiruvi" tanlansa — bank:verify kutadi
                verifiedAt: status === 'APPROVED' || needsReview ? new Date() : null,
                reviewNote: `Import: ${file.name} — ${who} (${today})${needsReview ? `; tekshiring: ${q.warnings.join(', ')}` : ''}`.slice(0, 500),
            };
        }),
        skipDuplicates: true,
    });

    return NextResponse.json({ ...summary, imported: result.count });
}
