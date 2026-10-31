// MasofaLab — "Qadam-baqadam missiya": poyga dvigatelining saqlash, PIN va oʻyinchilar tizimidan foydalanadi (kind = 'mission').
// Oʻqituvchi qadamlarni boshqaradi; talaba "Bajardim" / "Yordam" bosadi; oxirida test. Natijalar — Neon'da.

import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { requireModerator } from '@/lib/adminAuth';
import { generateRacePin, getRace, getRacer, getRacers, saveRace, saveRacer, type CodeRace, type CodeRacer } from '@/lib/codeRace';
import { missionByCode } from '@/lib/masofalab/missions';
import { resultsFor, saveResult, sessionsList } from '@/lib/masofalab/store';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
const createLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const hostChannel = (pin: string) => `host-ms-${pin}`;
const playChannel = (pin: string) => `ms-${pin}`;
// Pusher ishlamasa ham (hatto sinxron xato boʻlsa ham) mashgʻulot toʻxtamasin — mijozlar holatni soʻrov orqali oladi
const notify = (channel: string, event: string, data: unknown) =>
    Promise.resolve().then(() => pusherServer.trigger(channel, event, data)).catch(err => console.error(`masofa ${event}:`, err));

const isAdmin = async () => !!(await requireModerator().catch(() => null));

const publicStudent = (r: CodeRacer) => ({
    id: r.id, name: r.nickname, group: r.group ?? '', steps: r.msteps ?? {}, help: r.help ?? null,
    helpCount: r.helpCount ?? 0, test: r.test ? { correct: r.test.correct, max: r.test.max } : null, joinedAt: r.joinedAt,
});

const cleanLink = (v: unknown) => {
    const s = String(v ?? '').trim().slice(0, 500);
    if (!s) return undefined;
    return /^https?:\/\/\S+$/i.test(s) ? s : null;     // null — notoʻgʻri havola
};

export async function GET(req: Request, { params }: { params: { action: string } }) {
    const url = new URL(req.url);
    const pin = url.searchParams.get('pin') ?? '';
    const key = url.searchParams.get('key') ?? url.searchParams.get('hostKey');

    if (params.action === 'sessions') {
        if (!(await isAdmin())) return json({ error: 'Ruxsat yoʻq' }, 403);
        return json({ sessions: await sessionsList() });
    }

    if (params.action === 'state') {
        const race = await getRace(pin);
        if (!race || race.kind !== 'mission' || !race.mission) return json({ error: "Mashgʻulot topilmadi (PIN notoʻgʻri)" }, 404);
        const isHost = !!key && key === race.hostKey;
        const playerId = url.searchParams.get('playerId');
        const racers = await getRacers(pin);
        const me = playerId ? racers.find(r => r.id === playerId) : undefined;
        return json({
            pin, code: race.mission.code, step: race.mission.step, status: race.status, playerCount: racers.length,
            players: isHost ? racers.sort((a, b) => a.joinedAt - b.joinedAt).map(publicStudent) : undefined,
            me: me ? publicStudent(me) : null,
        });
    }

    if (params.action === 'results' || params.action === 'export') {
        const admin = await isAdmin();
        const race = await getRace(pin);
        if (!admin && race && race.hostKey !== key) return json({ error: 'Ruxsat yoʻq' }, 403);
        const rows = await resultsFor(pin, key, admin);
        if (!admin && rows.length === 0 && !race) return json({ error: 'Ruxsat yoʻq yoki natija yoʻq' }, 403);
        const code = rows[0]?.mission ?? race?.mission?.code ?? '';
        const mission = missionByCode(code);
        if (params.action === 'results') return json({ pin, code, title: mission?.title ?? '', stepCount: mission?.steps.length ?? 0, rows });

        const ExcelJS = (await import('exceljs')).default;
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(code || 'MasofaLab');
        const steps = mission?.steps ?? [];
        ws.columns = [
            { header: '№', key: 'n', width: 5 },
            { header: 'Ism-familiya', key: 'name', width: 28 },
            { header: 'Guruh', key: 'grp', width: 12 },
            ...steps.map((s, i) => ({ header: `${i + 1}-qadam${s.evidence !== 'none' ? ' (dalil)' : ''}`, key: `s${i}`, width: s.evidence !== 'none' ? 40 : 10 })),
            { header: `Bajarilgan qadamlar (${steps.length} dan)`, key: 'done', width: 14 },
            { header: 'Yordam soʻragan', key: 'help', width: 10 },
            { header: 'Test', key: 'test', width: 10 },
        ];
        ws.getRow(1).font = { bold: true };
        rows.forEach((r, i) => {
            const row: Record<string, unknown> = {
                n: i + 1, name: r.name, grp: r.grp, done: Object.keys(r.steps ?? {}).length, help: r.help_count,
                test: r.test_max ? `${r.test_correct}/${r.test_max}` : '—',
            };
            steps.forEach((s, si) => {
                const st = r.steps?.[si];
                row[`s${si}`] = st ? (st.link ?? '✓') : '';
            });
            ws.addRow(row);
        });
        const buf = await wb.xlsx.writeBuffer();
        return new NextResponse(buf as ArrayBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="MasofaLab-${code}-${pin}.xlsx"`,
            },
        });
    }
    return json({ error: 'Topilmadi' }, 404);
}

export async function POST(req: Request, { params }: { params: { action: string } }) {
    const body = await req.json().catch(() => ({}));
    const pin = String(body.pin ?? '');

    if (params.action === 'create') {
        if (!createLimiter(getClientIp(req)).success) return json({ error: 'Juda koʻp urinish' }, 429);
        const mission = missionByCode(String(body.code ?? ''));
        if (!mission) return json({ error: 'Missiya topilmadi' }, 400);
        const race: CodeRace = {
            pin: await generateRacePin(), title: `${mission.code}. ${mission.title}`.slice(0, 80),
            hostKey: crypto.randomUUID(), tasks: [], kind: 'mission', mission: { code: mission.code, step: 0 },
            durationSec: 3 * 60 * 60, status: 'lobby',
        };
        await saveRace(race);
        return json({ pin: race.pin, hostKey: race.hostKey });
    }

    const race = await getRace(pin);
    if (!race || race.kind !== 'mission' || !race.mission) return json({ error: "Mashgʻulot topilmadi (PIN notoʻgʻri)" }, 404);
    const mission = missionByCode(race.mission.code)!;

    // ── Oʻqituvchi ──
    if (['step', 'resolve', 'end'].includes(params.action)) {
        if (body.hostKey !== race.hostKey) return json({ error: 'Ruxsat yoʻq' }, 403);
        if (params.action === 'step') {
            const step = Math.max(0, Math.min(Number(body.step) || 0, mission.steps.length));   // steps.length — test
            race.mission.step = step;
            if (race.status === 'lobby') { race.status = 'running'; race.startedAt = Date.now(); }
            await saveRace(race);
            await notify(playChannel(pin), 'ms-step', { step, status: race.status });
            return json({ ok: true, step });
        }
        if (params.action === 'resolve') {
            const r = await getRacer(pin, String(body.playerId ?? ''));
            if (r) { r.help = null; await saveRacer(pin, r); await notify(playChannel(pin), 'ms-step', { step: race.mission.step, status: race.status }); }
            return json({ ok: true });
        }
        // end
        race.status = 'ended'; race.endedAt = Date.now();
        await saveRace(race);
        const racers = await getRacers(pin);
        for (let i = 0; i < racers.length; i += 10) await Promise.all(racers.slice(i, i + 10).map(r => saveResult(race, r)));
        await notify(playChannel(pin), 'ms-step', { step: race.mission.step, status: 'ended' });
        return json({ ok: true, saved: racers.length });
    }

    if (params.action === 'join') {
        if (race.status === 'ended') return json({ error: 'Mashgʻulot tugagan' }, 400);
        const playerId = String(body.playerId ?? '');
        const name = String(body.name ?? '').trim().slice(0, 60);
        const group = String(body.group ?? '').trim().slice(0, 30);
        if (!playerId || name.length < 3 || !group) return json({ error: 'Ism-familiya va guruhni kiriting' }, 400);
        const existing = await getRacer(pin, playerId);
        const racer: CodeRacer = existing ?? { id: playerId, nickname: name, avatar: '🎓', solved: 0, solvedAt: [], attempts: 0, joinedAt: Date.now() };
        racer.nickname = name; racer.group = group;
        await saveRacer(pin, racer);
        await notify(hostChannel(pin), 'ms-update', { player: publicStudent(racer) });
        return json({ ok: true });
    }

    // ── Talaba ──
    const racer = await getRacer(pin, String(body.playerId ?? ''));
    if (!racer) return json({ error: 'Avval mashgʻulotga qoʻshiling' }, 400);
    if (race.status === 'ended') return json({ error: 'Mashgʻulot tugagan', ended: true }, 400);
    const step = Number(body.step);
    if (params.action === 'done' || params.action === 'help') {
        if (!Number.isInteger(step) || step < 0 || step >= mission.steps.length || step > race.mission.step) return json({ error: 'Bu qadam hali ochilmagan' }, 400);
    }

    if (params.action === 'done') {
        const link = cleanLink(body.link);
        if (link === null) return json({ error: 'Havola https:// bilan boshlanishi kerak' }, 400);
        racer.msteps = { ...(racer.msteps ?? {}), [step]: { at: Date.now(), ...(link ? { link } : {}) } };
        racer.solved = Object.keys(racer.msteps).length;
        if (racer.help === step) racer.help = null;
        await saveRacer(pin, racer);
        await saveResult(race, racer);
        await notify(hostChannel(pin), 'ms-update', { player: publicStudent(racer) });
        return json({ ok: true, me: publicStudent(racer) });
    }

    if (params.action === 'help') {
        const on = body.on !== false;
        if (on && racer.help !== step) racer.helpCount = (racer.helpCount ?? 0) + 1;
        racer.help = on ? step : null;
        await saveRacer(pin, racer);
        await notify(hostChannel(pin), 'ms-update', { player: publicStudent(racer), help: on });
        return json({ ok: true, me: publicStudent(racer) });
    }

    if (params.action === 'test') {
        if (race.mission.step < mission.steps.length) return json({ error: 'Test hali ochilmagan' }, 400);
        if (racer.test) return json({ ok: true, me: publicStudent(racer), answers: mission.test.map(t => t.answer) });
        const given: unknown[] = Array.isArray(body.answers) ? body.answers : [];
        const answers = mission.test.map((_, i) => Number.isInteger(given[i]) ? Number(given[i]) : -1);
        const correct = answers.filter((a, i) => a === mission.test[i].answer).length;
        racer.test = { answers, correct, max: mission.test.length };
        await saveRacer(pin, racer);
        await saveResult(race, racer);
        await notify(hostChannel(pin), 'ms-update', { player: publicStudent(racer) });
        return json({ ok: true, me: publicStudent(racer), answers: mission.test.map(t => t.answer) });
    }

    return json({ error: 'Topilmadi' }, 404);
}
