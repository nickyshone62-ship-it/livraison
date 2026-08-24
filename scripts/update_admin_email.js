const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEmail() {
  console.log('🔄 Updating Super Admin email in database to nickyshone62@gmail.com...');
  const updated = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { email: 'nickyshone62@gmail.com' },
  });
  console.log('Updated Admin records count:', updated.count);

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    include: { profile: true },
  });
  console.log('Current Admin user:', JSON.stringify(admins, null, 2));
}

updateEmail().finally(() => prisma.$disconnect());
