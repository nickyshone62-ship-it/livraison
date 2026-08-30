const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectVehiclesColumns() {
  const sampleVehicle = await prisma.$queryRaw`
    SELECT * FROM public.vehicles WHERE driver_id = '923153ec-6f4d-40cb-bed8-989c83e5c133'::uuid
  `;
  console.log('Estelle Vehicle Record:', sampleVehicle);

  const sampleProfile = await prisma.$queryRaw`
    SELECT * FROM public.profiles WHERE id = '93704b75-e59d-48c3-a537-56c6b3454577'::uuid
  `;
  console.log('Estelle Profile keys:', Object.keys(sampleProfile[0]));

  await prisma.$disconnect();
}

inspectVehiclesColumns().catch(console.error);
