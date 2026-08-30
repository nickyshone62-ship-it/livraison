const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeGeneratedVehiclePhoto() {
  console.log("Suppression de la photo generee pour l'engin d'Estelle...");

  const driverId = '923153ec-6f4d-40cb-bed8-989c83e5c133';

  await prisma.$executeRaw`
    DELETE FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid AND document_type = 'vehicle_photo'
  `;

  const remainingDocs = await prisma.$queryRaw`
    SELECT id, document_type, status, created_at, length(file_url) as len
    FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid
  `;

  console.log("Documents AUTHENTIQUES restants pour Zongo Estelle (strictement ses vraies photos d'inscription):", remainingDocs);

  await prisma.$disconnect();
}

removeGeneratedVehiclePhoto().catch(console.error);
