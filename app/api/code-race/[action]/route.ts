import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import { currentQuestion, isCorrect, publicQuestion, sanitizeQuestions } from '@/lib/engRace';
import { redis } from '@/lib/gameState';
import { awardGameXP, XP_REWARDS } from '@/lib/gamification/xp';
import {
    CR_TTL, generateRacePin, raceSteps, getRace, getRacer, getRacers, publicRacer, publicTasks, rankRacers,
    sanitizeTasks, saveRace, saveRacer, saveSolution, type CodeRace,
} from '@/lib/codeRace';

export const dynamic = 'force-dynamic';

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
    await notify(playChannel(race.pin), 'cr-end', { podium: racers.slice(0, 3).map(publicRacer) });
}

export async function GET(req: Request, { params }: { params: { action: string } }) {
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
        taskCount: raceSteps(race),
        questionCount: race.questions?.length ?? 0,
        // Ingliz tili: o'quvchiga faqat navbatdagi savol (javobsiz) yuboriladi
        question: race.kind === 'english' && me && race.status === 'running' ? publicQuestion(currentQuestion(race, me), me.id) : undefined,
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
            const session = await getServerSession(authOptions);
            if (!session?.user) return json({ error: 'Avval tizimga kiring' }, 401);
            const english = body.kind === 'english';
            const { tasks, error } = english ? { tasks: [], error: undefined } : sanitizeTasks(body.tasks);
            const { questions, error: qError } = english ? sanitizeQuestions(body.questions) : { questions: undefined, error: undefined };
            if (error || qError) return json({ error: error || qError }, 400);
            const race: CodeRace = {
                ...(english ? { kind: 'english' as const, questions, goal: Math.min(Math.max(Number(body.goal) || 15, 3), 100) } : {}),
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
