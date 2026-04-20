const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.user.update({
        where: { id: 'cmmfyjxpx0000j7ywzcurok6l' },
        data: { plan: 'PRO' },
        select: { id: true, email: true, role: true, plan: true }
    });
    console.log('✅ Updated:', JSON.stringify(updated, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
