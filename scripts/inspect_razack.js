const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectRazack() {
  const p = await prisma.profile.findFirst({
    where: { fullName: { contains: 'Razack', mode: 'insensitive' } },
    include: { driverProfile: { include: { documents: true } } }
  });

  console.log('Razack Profile:', p.fullName);
  console.log('Avatar URL in profile:', p.avatarUrl ? p.avatarUrl.length : null);
  console.log('CNI Recto URL in profile:', p.cniRectoUrl ? p.cniRectoUrl.length : null);
  console.log('CNI Verso URL in profile:', p.cniVersoUrl ? p.cniVersoUrl.length : null);
  console.log('Driver Documents count:', p.driverProfile?.documents?.length);
  console.log('Driver Documents:', p.driverProfile?.documents.map(d => ({ id: d.id, type: d.documentType, createdAt: d.createdAt })));

  await prisma.$disconnect();
}

inspectRazack().catch(console.error);
