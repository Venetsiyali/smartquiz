// Savollar omborining zaxira nusxasi: backups/bank-YYYY-MM-DD.json
// Ishga tushirish: npm run bank:export            (barcha holatdagi savollar)
//                  npm run bank:export -- --approved   (faqat tasdiqlanganlar)
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

async function main() {
    const onlyApproved = process.argv.includes('--approved');
    const rows = await prisma.bankQuestion.findMany({
        where: onlyApproved ? { status: 'APPROVED' } : {},
        orderBy: [{ subject: 'asc' }, { topic: 'asc' }, { createdAt: 'asc' }],
        include: { reports: { select: { reason: true, resolved: true, createdAt: true } } },
    });

    const dir = path.join(process.cwd(), 'backups');
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `bank-${new Date().toISOString().slice(0, 10)}${onlyApproved ? '-approved' : ''}.json`);
    writeFileSync(file, JSON.stringify({ exportedAt: new Date().toISOString(), count: rows.length, questions: rows }, null, 2));

    console.log(`${rows.length} ta savol eksport qilindi → ${file}`);
}

main()
    .catch(err => { console.error(err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
