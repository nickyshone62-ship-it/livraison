const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dedupeZongo() {
  const driverId = '923153ec-6f4d-40cb-bed8-989c83e5c133';

  // Find all documents for Zongo
  const docs = await prisma.$queryRaw`
    SELECT id, document_type, created_at FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid
    ORDER BY created_at DESC
  `;

  console.log('Docs avant deduplication:', docs);

  const seenTypes = new Set();
  const toDelete = [];

  for (const doc of docs) {
    if (seenTypes.has(doc.document_type)) {
      toDelete.push(doc.id);
    } else {
      seenTypes.add(doc.document_type);
    }
  }

  if (toDelete.length > 0) {
    console.log('Suppression des anciens doublons:', toDelete);
    for (const id of toDelete) {
      await prisma.$executeRaw`DELETE FROM public.driver_documents WHERE id = ${id}::uuid`;
    }
  }

  const finalDocs = await prisma.$queryRaw`
    SELECT id, document_type, status, created_at FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid
  `;
  console.log('Docs apres deduplication (Strictement 1 seule version par type):', finalDocs);

  await prisma.$disconnect();
}

dedupeZongo().catch(console.error);
