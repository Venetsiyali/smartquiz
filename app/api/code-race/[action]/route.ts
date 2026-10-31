import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { matchRecall, memoryDurationSec, memoryPhase, SUBMIT_GRACE_MS, type MemoryConfig } from '@/lib/psixolab/memory';
import { publicRound, sanitizeMatch } from '@/lib/psixolab/match';
import { currentQuestion, isCorrect, publicQuestion, sanitizeQuestions } from '@/lib/engRace';
import { redis } from '@/lib/gameState';
import { awardGameXP, XP_REWARDS } from '@/lib/gamification/xp';
import {
    CR_TTL, generateRacePin, raceSteps, getRace, getRacer, getRacers, publicRacer, publicTasks, rankRacers,
    sanitizeTasks, saveRace, saveRacer, saveSolution, type CodeRace, type CodeRacer,
} from '@/lib/codeRace';

export const dynamic = 'force-dynamic';

const createLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
const hostChannel = (pin: string) => `host-cr-${pin}`;
const playChannel = (pin: string) => `cr-${pin}`;

// Pusher vaqtincha ishlamasa ham o'yin to'xtamasin — mijozlar holatni /state orqali qayta oladi
const notify = (channel: string, event: string, data: unknown) =>
    pusherServer.trigger(channel, event, data).catch(err => console.error(`code-race ${event}:`, err));

const timeIsUp = (race: CodeRace) =>
    race.status === 'running' && !!race.startedAt && Date.now() > race.startedAt + race.durationSec * 1000 + 5_000;

async function finish(race: CodeRace) {
    if (race.status === 'ended') return;
    race.status = 'ended';
    race.endedAt = Date.now();
    const racers = rankRacers(await getRacers(race.pin));
    // Bir nechta so'rov bir vaqtda tugatsa ham XP faqat bir marta beriladi (Redis NX — atomar)
    const first = await redis.set(`cr:${race.pin}:xp`, '1', { nx: true, ex: CR_TTL });
    if (first) {
        race.xpAwarded = true;
        const awards = new Map<string, number>();
        for (const r of racers) {
            if (!r.userId) continue;
            const amount = XP_REWARDS.QUIZ_PARTICIPATION + r.solved * 10
                + (r.solved >= raceSteps(race) ? XP_REWARDS.PERFECT_SCORE_BONUS : 0);
            awards.set(r.userId, Math.max(awards.get(r.userId) ?? 0, amount));
        }
        await awardGameXP(Array.from(awards, ([userId, amount]) => ({ userId, amount })));
    }
    await saveRace(race);
    // Natija 60 kun saqlanadi — oʻqituvchi keyin ham Excel yuklab olishi uchun
    await redis.set(`cr:${race.pin}:final`, JSON.stringify({ race: { ...race, tasks: [], questions: undefined }, racers }), { ex: 60 * 24 * 3600 })
        .catch(err => console.error('code-race final:', err));
    await notify(playChannel(race.pin), 'cr-end', { podium: racers.slice(0, 3).map(publicRacer) });
}

export async function GET(req: Request, { params }: { params: { action: string } }) {
    if (params.action === 'export') return exportXlsx(req);
    if (params.action !== 'state') return json({ error: 'Topilmadi' }, 404);
    const url = new URL(req.url);
    const pin = url.searchParams.get('pin') ?? '';
    const playerId = url.searchParams.get('playerId');
    const hostKey = url.searchParams.get('hostKey');

    const race = await getRace(pin);
    if (!race) return json({ error: "O'yin topilmadi" }, 404);
    if (timeIsUp(race)) await finish(race);

    const isHost = !!hostKey && hostKey === race.hostKey;
    const ranked = rankRacers(await getRacers(pin));
    const me = playerId ? ranked.find(r => r.id === playerId) : undefined;

    return json({
        pin, title: race.title, status: race.status,
        startedAt: race.startedAt ?? null, durationSec: race.durationSec,
        kind: race.kind ?? 'code',
        theme: race.theme ?? null,
        uiLang: race.uiLang ?? 'uz',
        taskCount: raceSteps(race),
        questionCount: race.questions?.length ?? 0,
        // Ingliz tili: o'quvchiga faqat navbatdagi savol (javobsiz) yuboriladi
        // Xotira sinovi: soʻzlar talabaga faqat oʻyin tugagach koʻrsatiladi (oʻqituvchi ekranida — doim)
        memory: race.memory ? {
            kind: race.memory.kind, count: race.memory.items.length, intervalMs: race.memory.intervalMs, recallSec: race.memory.recallSec,
            items: isHost || race.status === 'ended' ? race.memory.items : undefined,
        } : undefined,
        question: race.kind === 'english' && me && race.status === 'running' ? publicQuestion(currentQuestion(race, me), me.id) : undefined,
        match: race.match ? { penaltySec: race.match.penaltySec, rounds: race.match.rounds.length } : undefined,
        matchRound: race.kind === 'match' && me && race.status === 'running' ? publicRound(race, me) : undefined,
        mistakes: me?.mistakes ?? 0,
        attempts: me?.attempts,
        tasks: isHost ? race.tasks : publicTasks(race),
        players: isHost ? ranked.map(publicRacer) : undefined,
        playerCount: ranked.length,
        top: ranked.slice(0, 5).map(publicRacer),
        me: me ? { ...publicRacer(me), rank: ranked.indexOf(me) + 1 } : null,
    });
}

export async function POST(req: Request, { params }: { params: { action: string } }) {
    const body = await req.json().catch(() => ({}));
    const pin = String(body.pin ?? '');

    switch (params.action) {
        case 'create': {
            // Login shart emas — faqat IP bo'yicha cheklov (bir daqiqada 10 ta o'yin)
            if (!createLimiter(getClientIp(req)).success) return json({ error: "Juda ko'p urinish, bir daqiqadan keyin qayta urining" }, 429);
            if (body.kind === 'match') {
                const { match, error } = sanitizeMatch(body.rounds, body.penaltySec);
                if (!match) return json({ error }, 400);
                const race: CodeRace = {
                    pin: await generateRacePin(), title: String(body.title || 'Moslashtir').slice(0, 80),
                    hostKey: crypto.randomUUID(), tasks: [], kind: 'match', match,
                    uiLang: body.uiLang === 'ru' ? 'ru' : 'uz',
                    durationSec: Math.min(Math.max(Number(body.durationSec) || 600, 60), 60 * 60), status: 'lobby',
                };
                await saveRace(race);
                return json({ pin: race.pin, hostKey: race.hostKey });
            }
            if (body.kind === 'memory') {
                const items: string[] = Array.isArray(body.items)
                    ? body.items.map((x: unknown) => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 20) : [];
                if (items.length < 3) return json({ error: 'Kamida 3 ta soʻz kerak' }, 400);
                const memory: MemoryConfig = {
                    items,
                    kind: ['words', 'numbers', 'sentence'].includes(body.memoryKind) ? body.memoryKind : 'words',
                    intervalMs: Math.min(Math.max(Number(body.intervalMs) || 2000, 1000), 5000),
                    recallSec: Math.min(Math.max(Number(body.recallSec) || 60, 20), 180),
                    setId: body.setId ? String(body.setId).slice(0, 40) : undefined,
                };
                const race: CodeRace = {
                    pin: await generateRacePin(), title: String(body.title || 'Xotira sinovi').slice(0, 80),
                    hostKey: crypto.randomUUID(), tasks: [], kind: 'memory', memory,
                    uiLang: body.uiLang === 'ru' ? 'ru' : 'uz',
                    durationSec: memoryDurationSec(memory), status: 'lobby',
                };
                await saveRace(race);
                return json({ pin: race.pin, hostKey: race.hostKey });
            }
            const english = body.kind === 'english';
            const { tasks, error } = english ? { tasks: [], error: undefined } : sanitizeTasks(body.tasks);
            const { questions, error: qError } = english ? sanitizeQuestions(body.questions) : { questions: undefined, error: undefined };
            if (error || qError) return json({ error: error || qError }, 400);
            const race: CodeRace = {
                ...(english ? {
                    kind: 'english' as const, questions, goal: Math.min(Math.max(Number(body.goal) || 15, 3), 100),
                    theme: body.theme === 'it' ? 'it' as const : body.theme === 'psixo' ? 'psixo' as const : 'grammar' as const,
                    uiLang: body.uiLang === 'ru' ? 'ru' as const : 'uz' as const,
                } : {}),
                pin: await generateRacePin(),
                title: String(body.title || "Kod Cho'qqisi").slice(0, 80),
                hostKey: crypto.randomUUID(),
                tasks,
                durationSec: Math.min(Math.max(Number(body.durationSec) || 900, 60), 3 * 60 * 60),
                status: 'lobby',
            };
            await saveRace(race);
            return json({ pin: race.pin, hostKey: race.hostKey });
        }

        case 'join': {
            const race = await getRace(pin);
            if (!race) return json({ error: "O'yin topilmadi (PIN noto'g'ri)" }, 404);
            if (race.status === 'ended') return json({ error: "O'yin tugagan" }, 400);
            const playerId = String(body.playerId ?? '');
            const nickname = String(body.nickname ?? '').trim().slice(0, 24);
            if (!playerId || nickname.length < 2) return json({ error: "Nikneym kamida 2 ta harf" }, 400);

            const userId = (await getServerSession(authOptions).catch(() => null))?.user?.id as string | undefined;
            const existing = await getRacer(pin, playerId);
            const racer = existing ?? {
                id: playerId, nickname, avatar: String(body.avatar || '🧑‍💻').slice(0, 8),
                solved: 0, solvedAt: [], attempts: 0, joinedAt: Date.now(),
            };
            racer.nickname = nickname;
            if (userId && !racer.userId) racer.userId = userId;
            await saveRacer(pin, racer);
            if (!existing) await notify(hostChannel(pin), 'cr-joined', { player: publicRacer(racer) });
            return json({ ok: true, pin });
        }

        case 'solve': {
            const race = await getRace(pin);
            if (!race) return json({ error: "O'yin topilmadi" }, 404);
            if (race.status !== 'running' || timeIsUp(race)) return json({ error: 'Vaqt tugadi' }, 400);
            const racer = await getRacer(pin, String(body.playerId ?? ''));
            if (!racer) return json({ error: "Avval o'yinga qo'shiling" }, 400);

            const task = Number(body.task);
            // Faqat navbatdagi masala qabul qilinadi (takroriy yuborish ballni oshirmaydi)
            if (task !== racer.solved || task >= race.tasks.length) return json({ ok: true, solved: racer.solved });

            racer.solved += 1;
            racer.solvedAt.push(Date.now() - (race.startedAt ?? Date.now()));
            await Promise.all([saveRacer(pin, racer), saveSolution(pin, racer.id, task, String(body.code ?? ''))]);
            await notify(hostChannel(pin), 'cr-progress', { player: publicRacer(racer), finished: racer.solved >= race.tasks.length });
            return json({ ok: true, solved: racer.solved });
        }

        case 'answer': {
            const race = await getRace(pin);
            if (!race || race.kind !== 'english') return json({ error: "O'yin topilmadi" }, 404);
            if (race.status !== 'running' || timeIsUp(race)) return json({ error: 'Vaqt tugadi', ended: true }, 400);
            const racer = await getRacer(pin, String(body.playerId ?? ''));
            if (!racer) return json({ error: "Avval o'yinga qo'shiling" }, 400);
            const goal = raceSteps(race);
            if (racer.solved >= goal) return json({ finished: true, solved: racer.solved });
            // Ikki marta yuborilgan javob (tarmoq takrori) faqat bir marta hisoblanadi
            if (Number(body.attempt) !== racer.attempts) {
                return json({ stale: true, solved: racer.solved, attempts: racer.attempts, question: publicQuestion(currentQuestion(race, racer), racer.id) });
            }

            const q = currentQuestion(race, racer)!;
            const correct = isCorrect(q, String(body.answer ?? ''));
            racer.attempts += 1;
            if (correct) {
                racer.solved += 1;
                racer.solvedAt.push(Date.now() - (race.startedAt ?? Date.now()));
            }
            await saveRacer(pin, racer);
            const finished = racer.solved >= goal;
            // Faqat to'g'ri javoblar o'qituvchi ekraniga — xabarlar soni kam bo'lsin
            if (correct) await notify(hostChannel(pin), 'cr-progress', { player: publicRacer(racer), finished });
            return json({
                correct, answer: q.answer, explain: q.explain ?? null,
                solved: racer.solved, attempts: racer.attempts, finished,
                question: finished ? null : publicQuestion(currentQuestion(race, racer), racer.id),
            });
        }

        case 'match': {
            const race = await getRace(pin);
            if (!race || race.kind !== 'match' || !race.match) return json({ error: "O'yin topilmadi" }, 404);
            if (race.status !== 'running' || timeIsUp(race)) return json({ error: 'Vaqt tugadi', ended: true }, 400);
            const racer = await getRacer(pin, String(body.playerId ?? ''));
            if (!racer) return json({ error: "Avval o'yinga qo'shiling" }, 400);
            const round = publicRound(race, racer);
            if (!round) return json({ finished: true, solved: racer.solved });
            // Eskirgan soʻrov (boshqa raund) — joriy holatni qaytaramiz
            if (Number(body.round) !== round.index) return json({ stale: true, solved: racer.solved, mistakes: racer.mistakes ?? 0, round });
            const li = Number(body.left);
            const pair = race.match.rounds[round.index].pairs[li];
            if (!pair || round.matched[li]) return json({ stale: true, solved: racer.solved, mistakes: racer.mistakes ?? 0, round });
            const penaltyMs = race.match.penaltySec * 1000;
            const correct = pair.right === String(body.right ?? '');
            racer.attempts += 1;
            racer.mistakes = racer.mistakes ?? 0;
            if (correct) {
                racer.matched = [...(racer.matched ?? []), `${round.index}:${li}`];
                racer.solved += 1;
                // Reyting vaqti = haqiqiy vaqt + xatolar uchun jarima
                racer.solvedAt.push(Date.now() - (race.startedAt ?? Date.now()) + racer.mistakes * penaltyMs);
            } else {
                racer.mistakes += 1;
                if (racer.solved > 0) racer.solvedAt[racer.solved - 1] += penaltyMs;
            }
            await saveRacer(pin, racer);
            const finished = racer.solved >= raceSteps(race);
            if (correct) await notify(hostChannel(pin), 'cr-progress', { player: publicRacer(racer), finished });
            return json({ correct, solved: racer.solved, mistakes: racer.mistakes, finished, round: finished ? null : publicRound(race, racer) });
        }

        case 'recall': {
            const race = await getRace(pin);
            if (!race || race.kind !== 'memory' || !race.memory) return json({ error: "O'yin topilmadi" }, 404);
            if (race.status !== 'running' || !race.startedAt) return json({ error: 'Vaqt tugadi' }, 400);
            const p = memoryPhase(race.memory, race.startedAt, Date.now());
            if (Date.now() - race.startedAt > p.recallEnd + SUBMIT_GRACE_MS) return json({ error: 'Vaqt tugadi' }, 400);
            if (p.phase === 'ready' || p.phase === 'show') return json({ error: 'Hali erta' }, 400);
            const racer = await getRacer(pin, String(body.playerId ?? ''));
            if (!racer) return json({ error: "Avval o'yinga qo'shiling" }, 400);
            // Har bir talaba bir marta yuboradi — takroriy yuborish natijani oʻzgartirmaydi
            if (racer.attempts > 0) return json({ recalled: racer.recalled ?? [], total: race.memory.items.length });

            const recalled = matchRecall(race.memory.items, String(body.answer ?? '').slice(0, 2000));
            const at = Date.now() - race.startedAt;
            racer.recalled = recalled;
            racer.solved = recalled.length;
            racer.solvedAt = recalled.map(() => at);
            racer.attempts = 1;
            await saveRacer(pin, racer);
            await notify(hostChannel(pin), 'cr-progress', { player: publicRacer(racer), finished: false });
            return json({ recalled, total: race.memory.items.length });
        }

        case 'start':
        case 'end': {
            const race = await getRace(pin);
            if (!race) return json({ error: "O'yin topilmadi" }, 404);
            if (body.hostKey !== race.hostKey) return json({ error: 'Ruxsat yo\'q' }, 403);
            if (params.action === 'start') {
                if (race.status !== 'lobby') return json({ ok: true });
                race.status = 'running';
                race.startedAt = Date.now();
                await saveRace(race);
                await notify(playChannel(pin), 'cr-start', { startedAt: race.startedAt, durationSec: race.durationSec });
            } else {
                await finish(race);
            }
            return json({ ok: true });
        }
    }
    return json({ error: 'Topilmadi' }, 404);
}

/** Oʻyin natijalari Excel'da (oʻqituvchi kaliti bilan). Tugagan oʻyin — saqlangan yakuniy natijadan. */
async function exportXlsx(req: Request) {
    const url = new URL(req.url);
    const pin = url.searchParams.get('pin') ?? '';
    const hostKey = url.searchParams.get('hostKey') ?? '';
    const live = await getRace(pin);
    let race: CodeRace | null = live;
    let racers: CodeRacer[];
    if (live && live.status !== 'ended') {
        racers = rankRacers(await getRacers(pin));
    } else {
        const raw = await redis.get(`cr:${pin}:final`);
        const snap = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) as { race: CodeRace; racers: CodeRacer[] } : null;
        if (snap) { race = snap.race; racers = snap.racers; } else racers = race ? rankRacers(await getRacers(pin)) : [];
    }
    if (!race) return json({ error: "Natija topilmadi (60 kundan eski yoki PIN notoʻgʻri)" }, 404);
    if (hostKey !== race.hostKey) return json({ error: "Ruxsat yo'q" }, 403);

    const ru = race.uiLang === 'ru';
    const L = (uz: string, r: string) => (ru ? r : uz);
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(L('Natijalar', 'Результаты'));
    const clock = (ms: number | null | undefined) => ms == null ? '' : `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
    const last = (r: CodeRacer) => r.solvedAt[r.solved - 1] ?? null;
    const steps = raceSteps(race);
    const base = [
        { header: '№', key: 'n', width: 5 },
        { header: L('Ishtirokchi', 'Участник'), key: 'name', width: 26 },
    ];

    if (race.kind === 'memory' && race.memory) {
        const items = race.memory.items;
        ws.columns = [...base,
            { header: L(`Esladi (${items.length} dan)`, `Запомнил (из ${items.length})`), key: 'rec', width: 14 },
            { header: '%', key: 'pct', width: 8 },
            { header: L('Miller (7±2)', 'Миллер (7±2)'), key: 'miller', width: 14 },
            { header: L('Eslangan elementlar', 'Запомненные элементы'), key: 'words', width: 60 }];
        const sorted = [...racers].sort((a, b) => (b.recalled?.length ?? 0) - (a.recalled?.length ?? 0));
        sorted.forEach((r, i) => {
            const k = r.recalled?.length ?? 0;
            ws.addRow({ n: i + 1, name: r.nickname, rec: r.attempts > 0 ? k : L('yubormadi', 'не отправил'), pct: r.attempts > 0 ? Math.round(k / items.length * 100) : '',
                miller: r.attempts > 0 ? (k < 5 ? L('pastroq', 'ниже') : k > 9 ? L('yuqoriroq', 'выше') : L('meʼyorda', 'в норме')) : '',
                words: (r.recalled ?? []).sort((a, b) => a - b).map(p => items[p]).join(', ') });
        });
        const sent = racers.filter(r => r.attempts > 0);
        const avg = sent.length ? sent.reduce((s2, r) => s2 + (r.recalled?.length ?? 0), 0) / sent.length : 0;
        ws.addRow({});
        ws.addRow({ name: L('Guruh oʻrtachasi', 'Среднее по группе'), rec: Math.round(avg * 10) / 10 }).font = { bold: true };
        // Pozitsiya effekti (birinchi/oxirgi oʻrin)
        const pos = wb.addWorksheet(L('Pozitsiya effekti', 'Эффект позиции'));
        pos.columns = [
            { header: L('Oʻrin', 'Позиция'), key: 'p', width: 8 },
            { header: L('Element', 'Элемент'), key: 'w', width: 22 },
            { header: L('Eslaganlar', 'Запомнили'), key: 'c', width: 12 },
            { header: '%', key: 'pct', width: 8 }];
        items.forEach((w, p) => {
            const c = sent.filter(r => r.recalled?.includes(p)).length;
            pos.addRow({ p: p + 1, w, c, pct: sent.length ? Math.round(c / sent.length * 100) : 0 });
        });
        pos.getRow(1).font = { bold: true };
    } else if (race.kind === 'match') {
        ws.columns = [...base,
            { header: L(`Juftliklar (${steps} dan)`, `Пары (из ${steps})`), key: 's', width: 14 },
            { header: L('Xatolar', 'Ошибки'), key: 'm', width: 10 },
            { header: L('Jarima, s', 'Штраф, с'), key: 'pen', width: 10 },
            { header: L('Vaqt (jarima bilan)', 'Время (со штрафом)'), key: 't', width: 18 }];
        racers.forEach((r, i) => ws.addRow({ n: i + 1, name: r.nickname, s: r.solved, m: r.mistakes ?? 0,
            pen: (r.mistakes ?? 0) * (race!.match?.penaltySec ?? 0), t: clock(last(r)) }));
    } else if (race.kind === 'english') {
        ws.columns = [...base,
            { header: L(`Toʻgʻri javoblar (marra: ${steps})`, `Верные ответы (финиш: ${steps})`), key: 's', width: 22 },
            { header: L('Jami javoblar', 'Всего ответов'), key: 'a', width: 14 },
            { header: L('Aniqlik, %', 'Точность, %'), key: 'acc', width: 12 },
            { header: L('Marraga yetdi', 'Финишировал'), key: 'fin', width: 14 },
            { header: L('Oxirgi toʻgʻri javob vaqti', 'Время последнего верного'), key: 't', width: 22 }];
        racers.forEach((r, i) => ws.addRow({ n: i + 1, name: r.nickname, s: r.solved, a: r.attempts,
            acc: r.attempts ? Math.round(r.solved / r.attempts * 100) : '', fin: r.solved >= steps ? '✓' : '', t: clock(last(r)) }));
    } else {
        ws.columns = [...base,
            { header: `Masalalar (${steps} dan)`, key: 's', width: 16 },
            { header: 'Urinishlar', key: 'a', width: 12 },
            { header: 'Oxirgi yechim vaqti', key: 't', width: 18 }];
        racers.forEach((r, i) => ws.addRow({ n: i + 1, name: r.nickname, s: r.solved, a: r.attempts, t: clock(last(r)) }));
    }
    ws.getRow(1).font = { bold: true };
    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf as ArrayBuffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="natijalar-${pin}.xlsx"`,
        },
    });
}
