// MasofaLab natijalari — Neon (Postgres). Deploy paytida migratsiya ishlamaydi, shuning uchun
// jadval birinchi murojaatda kodning oʻzi tomonidan yaratiladi (CREATE TABLE IF NOT EXISTS).

import { prisma } from '@/lib/prisma';
import type { CodeRace, CodeRacer } from '@/lib/codeRace';

let ready: Promise<unknown> | null = null;
const ensureTable = () => (ready ??= prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS masofa_results (
        id          TEXT PRIMARY KEY,
        pin         TEXT NOT NULL,
        host_key    TEXT NOT NULL,
        mission     TEXT NOT NULL,
        name        TEXT NOT NULL,
        grp         TEXT NOT NULL DEFAULT '',
        steps       JSONB NOT NULL DEFAULT '{}'::jsonb,
        help_count  INTEGER NOT NULL DEFAULT 0,
        test_correct INTEGER,
        test_max    INTEGER,
        session_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`).then(() => prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS masofa_results_pin_idx ON masofa_results (pin, host_key)'))
    .catch(err => { ready = null; throw err; }));

export interface MasofaRow {
    id: string; pin: string; mission: string; name: string; grp: string;
    steps: Record<string, { at: number; link?: string }>; help_count: number;
    test_correct: number | null; test_max: number | null; session_at: Date; updated_at: Date;
}

/** Talaba natijasini yozadi (bor boʻlsa yangilaydi). Xato oʻyinni toʻxtatmasin — faqat logga. */
export async function saveResult(race: CodeRace, r: CodeRacer) {
    try {
        await ensureTable();
        await prisma.$executeRawUnsafe(
            `INSERT INTO masofa_results (id, pin, host_key, mission, name, grp, steps, help_count, test_correct, test_max, session_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::timestamptz,now())
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, grp = EXCLUDED.grp, steps = EXCLUDED.steps,
                 help_count = EXCLUDED.help_count, test_correct = EXCLUDED.test_correct, test_max = EXCLUDED.test_max, updated_at = now()`,
            `${race.pin}:${r.id}`, race.pin, race.hostKey, race.mission?.code ?? '', r.nickname, r.group ?? '',
            JSON.stringify(r.msteps ?? {}), r.helpCount ?? 0, r.test?.correct ?? null, r.test?.max ?? null,
            new Date(race.startedAt ?? Date.now()),
        );
    } catch (err) {
        console.error('masofa saveResult:', err);
    }
}

export async function resultsFor(pin: string, hostKey: string | null, admin: boolean): Promise<MasofaRow[]> {
    await ensureTable();
    return admin
        ? prisma.$queryRawUnsafe<MasofaRow[]>('SELECT * FROM masofa_results WHERE pin = $1 ORDER BY grp, name', pin)
        : prisma.$queryRawUnsafe<MasofaRow[]>('SELECT * FROM masofa_results WHERE pin = $1 AND host_key = $2 ORDER BY grp, name', pin, hostKey ?? '');
}

/** Admin paneli: barcha mashgʻulotlar (PIN boʻyicha guruhlangan). */
export async function sessionsList() {
    await ensureTable();
    return prisma.$queryRawUnsafe<{ pin: string; mission: string; students: number; session_at: Date }[]>(
        `SELECT pin, mission, COUNT(*)::int AS students, MIN(session_at) AS session_at
         FROM masofa_results GROUP BY pin, mission ORDER BY MIN(session_at) DESC LIMIT 300`);
}
