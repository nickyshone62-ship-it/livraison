const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ include: { profile: true, driver: true } });
  console.log('--- ALL USERS IN DB ---');
  console.log(JSON.stringify(users, null, 2));

  const notifications = await prisma.notification.findMany();
  console.log('--- ALL NOTIFICATIONS IN DB ---');
  console.log(JSON.stringify(notifications, null, 2));
}

check().finally(() => prisma.$disconnect());
