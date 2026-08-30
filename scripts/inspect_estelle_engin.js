const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEstelleEngin() {
  console.log('Inspection de la photo engin de Zongo Estelle...');

  const profile = await prisma.profile.findFirst({
    where: { fullName: { contains: 'Estelle', mode: 'insensitive' } },
    include: {
      driverProfile: {
        include: {
          documents: true,
          vehicles: true,
        },
      },
    },
  });

  if (!profile) {
    console.log('Profil Estelle non trouve!');
    await prisma.$disconnect();
    return;
  }

  console.log('Estelle User ID:', profile.id);
  console.log('Estelle Driver Profile ID:', profile.driverProfile?.id);
  console.log('Estelle Driver Documents:', profile.driverProfile?.documents.map(d => ({ id: d.id, type: d.documentType, length: d.fileUrl ? d.fileUrl.length : 0 })));
  console.log('Estelle Vehicles:', profile.driverProfile?.vehicles);

  await prisma.$disconnect();
}

inspectEstelleEngin().catch(console.error);
