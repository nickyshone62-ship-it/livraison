const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findEstelleOriginalUploads() {
  console.log("Recherche approfondie des documents d'origine de Zongo Estelle...");

  const userId = '93704b75-e59d-48c3-a537-56c6b3454577';
  const driverId = '923153ec-6f4d-40cb-bed8-989c83e5c133';

  const profile = await prisma.$queryRaw`
    SELECT * FROM public.profiles WHERE id = ${userId}::uuid
  `;
  console.log("Profil Estelle:", profile);

  const docs = await prisma.$queryRaw`
    SELECT id, document_type, status, created_at, length(file_url) as len
    FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid
  `;
  console.log("Documents Estelle:", docs);

  const payments = await prisma.$queryRaw`
    SELECT * FROM public.payments WHERE user_id = ${userId}::uuid
  `;
  console.log("Paiements Estelle:", payments);

  await prisma.$disconnect();
}

findEstelleOriginalUploads().catch(console.error);
