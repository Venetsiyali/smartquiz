import { NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'crypto';
import { redis } from '@/lib/gameState';
import { requireModerator } from '@/lib/adminAuth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { audTopic, CASE_MAX } from '@/lib/psixolab/auditoriya';
import {
    countSubmissions, getSubmission, getSubmissions, getTask, gradeAuto, maxTotal, publicTask,
    saveSubmission, saveTask, totalOf, type Submission, type Task,
} from '@/lib/psixolab/tasks';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
const createLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const submitLimiter = rateLimit({ windowMs: 60_000, max: 30 });

/** Oʻqituvchi (topshiriq kaliti bilan) yoki admin/moderator. */
async function canManage(task: Task, key: string | null) {
    if (key && key === task.teacherKey) return true;
    return !!(await requireModerator().catch(() => null));
}

export async function GET(req: Request, { params }: { params: { action: string } }) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') ?? '';
    const key = url.searchParams.get('key');

    if (params.action === 'list') {
        if (!(await requireModerator().catch(() => null))) return json({ error: 'Ruxsat yoʻq' }, 403);
        const ids = (await redis.zrange<string[]>('task:index', 0, 499, { rev: true })) ?? [];
        const tasks = (await Promise.all(ids.map(getTask))).filter(Boolean) as Task[];
        const counts = await Promise.all(tasks.map(t => countSubmissions(t.id)));
        return json({ tasks: tasks.map(({ teacherKey, ...t }, i) => ({ ...t, submissions: counts[i] })) });
    }

    const task = await getTask(id);
    if (!task) return json({ error: 'Topshiriq topilmadi' }, 404);

    if (params.action === 'get') return json({ task: publicTask(task) });

    if (!(await canManage(task, key))) return json({ error: 'Ruxsat yoʻq' }, 403);
    const subs = await getSubmissions(id);

    if (params.action === 'results') {
        const { teacherKey, ...t } = task;
        return json({ task: { ...t, max: maxTotal(task.topicId), caseMax: CASE_MAX }, topic: publicTask(task), submissions: subs });
    }

    if (params.action === 'export') {
        const ExcelJS = (await import('exceljs')).default;
        const wb = new ExcelJS.Workbook();
        const ru = task.lang === 'ru';
        const ws = wb.addWorksheet(task.topicId);
        const topic = audTopic(task.topicId)!;
        ws.columns = [
            { header: '№', key: 'n', width: 5 },
            { header: ru ? 'ФИО' : 'Ism-familiya', key: 'name', width: 28 },
            { header: ru ? 'Группа' : 'Guruh', key: 'group', width: 12 },
            { header: ru ? `Тест (из ${topic.tests.length})` : `Test (${topic.tests.length} dan)`, key: 'test', width: 12 },
            { header: ru ? `Сопоставление (из ${topic.pairs.length})` : `Moslashtirish (${topic.pairs.length} dan)`, key: 'match', width: 16 },
            { header: ru ? `Кейс (из ${CASE_MAX})` : `Keys (${CASE_MAX} dan)`, key: 'case', width: 12 },
            { header: ru ? `Итого (из ${maxTotal(task.topicId)})` : `Jami (${maxTotal(task.topicId)} dan)`, key: 'total', width: 14 },
            { header: ru ? 'Сдано' : 'Topshirilgan vaqt', key: 'at', width: 18 },
            { header: ru ? 'Ответ на кейс' : 'Keys javobi', key: 'text', width: 80 },
        ];
        ws.getRow(1).font = { bold: true };
        subs.forEach((s, i) => ws.addRow({
            n: i + 1, name: s.name, group: s.group, test: s.test.correct, match: s.match.score,
            case: s.caseGrade ?? '', total: s.total ?? '', at: new Date(s.submittedAt).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' }),
            text: s.caseText,
        }));
        ws.getColumn('text').alignment = { wrapText: true, vertical: 'top' };
        const buf = await wb.xlsx.writeBuffer();
        return new NextResponse(buf as ArrayBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${task.topicId}-${task.id}.xlsx"`,
            },
        });
    }
    return json({ error: 'Topilmadi' }, 404);
}

export async function POST(req: Request, { params }: { params: { action: string } }) {
    const body = await req.json().catch(() => ({}));

    if (params.action === 'create') {
        if (!createLimiter(getClientIp(req)).success) return json({ error: 'Juda koʻp urinish' }, 429);
        const topic = audTopic(String(body.topicId ?? ''));
        if (!topic) return json({ error: 'Mavzu topilmadi' }, 400);
        const task: Task = {
            id: randomBytes(5).toString('hex'),
            topicId: topic.id,
            lang: body.lang === 'ru' ? 'ru' : 'uz',
            title: topic.title[body.lang === 'ru' ? 'ru' : 'uz'],
            teacherKey: randomUUID(),
            createdAt: Date.now(),
        };
        await saveTask(task);
        return json({ id: task.id, teacherKey: task.teacherKey });
    }

    const task = await getTask(String(body.id ?? ''));
    if (!task) return json({ error: 'Topshiriq topilmadi' }, 404);

    if (params.action === 'submit') {
        if (!submitLimiter(getClientIp(req)).success) return json({ error: 'Juda koʻp urinish' }, 429);
        const name = String(body.name ?? '').trim().slice(0, 80);
        const group = String(body.group ?? '').trim().slice(0, 30);
        if (name.length < 3 || !group) return json({ error: 'Ism-familiya va guruhni kiriting' }, 400);
        const auto = gradeAuto(task.topicId, body.testAnswers, body.matchAttempts);
        const sub: Submission = {
            id: randomBytes(6).toString('hex'),
            name, group,
            submittedAt: Date.now(),
            durationSec: Math.max(0, Math.round((Date.now() - Number(body.startedAt || Date.now())) / 1000)),
            test: auto.test,
            match: { ...auto.match, timeSec: Math.max(0, Math.round(Number(body.matchTimeSec) || 0)) },
            caseText: String(body.caseText ?? '').slice(0, 5000),
            caseGrade: null,
            total: null,
        };
        await saveSubmission(task.id, sub);
        return json({ subId: sub.id, test: sub.test, match: sub.match, correctAnswers: auto.correctAnswers });
    }

    if (params.action === 'grade') {
        if (!(await canManage(task, body.key ?? null))) return json({ error: 'Ruxsat yoʻq' }, 403);
        const sub = await getSubmission(task.id, String(body.subId ?? ''));
        if (!sub) return json({ error: 'Topilmadi' }, 404);
        const g = body.grade === null || body.grade === '' ? null : Math.round(Number(body.grade));
        if (g !== null && (!Number.isFinite(g) || g < 0 || g > CASE_MAX)) return json({ error: `0–${CASE_MAX}` }, 400);
        sub.caseGrade = g;
        sub.total = totalOf(sub);
        await saveSubmission(task.id, sub);
        return json({ ok: true, submission: sub });
    }

    return json({ error: 'Topilmadi' }, 404);
}
