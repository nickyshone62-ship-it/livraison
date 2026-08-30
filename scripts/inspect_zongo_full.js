const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectZongoFull() {
  const profile = await prisma.$queryRaw`
    SELECT * FROM public.profiles WHERE id = '93704b75-e59d-48c3-a537-56c6b3454577'::uuid
  `;
  console.log('Profile complet Zongo:', profile);

  const driverDocs = await prisma.$queryRaw`
    SELECT * FROM public.driver_documents WHERE driver_id = '923153ec-6f4d-40cb-bed8-989c83e5c133'::uuid
  `;
  console.log('DriverDocs Zongo:', driverDocs);

  await prisma.$disconnect();
}

inspectZongoFull().catch(console.error);
