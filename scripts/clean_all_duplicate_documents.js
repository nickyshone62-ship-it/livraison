const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAllDuplicates() {
  console.log('Nettoyage complet des doublons dans driver_documents...');

  // Get all drivers
  const drivers = await prisma.$queryRaw`SELECT id FROM public.driver_profiles`;

  for (const dr of drivers) {
    const docs = await prisma.$queryRaw`
      SELECT id, document_type, created_at
      FROM public.driver_documents
      WHERE driver_id = ${dr.id}::uuid
      ORDER BY created_at DESC
    `;

    const seenTypes = new Set();
    const duplicateIds = [];

    for (const d of docs) {
      if (seenTypes.has(d.document_type)) {
        duplicateIds.push(d.id);
      } else {
        seenTypes.add(d.document_type);
      }
    }

    if (duplicateIds.length > 0) {
      console.log(`Driver ${dr.id}: suppression de ${duplicateIds.length} doublons...`);
      for (const id of duplicateIds) {
        await prisma.$executeRaw`DELETE FROM public.driver_documents WHERE id = ${id}::uuid`;
      }
    }
  }

  console.log('\nVerification post-nettoyage pour Adrien:');
  const adrienDocs = await prisma.$queryRaw`
    SELECT d.id, d.document_type, d.created_at
    FROM public.driver_documents d
    JOIN public.driver_profiles dp ON dp.id = d.driver_id
    JOIN public.profiles p ON p.id = dp.user_id
    WHERE LOWER(p.full_name) LIKE '%adrien%'
  `;
  console.log('Docs Adrien:', adrienDocs);

  console.log('\nVerification post-nettoyage pour Razack:');
  const razackDocs = await prisma.$queryRaw`
    SELECT d.id, d.document_type, d.created_at
    FROM public.driver_documents d
    JOIN public.driver_profiles dp ON dp.id = d.driver_id
    JOIN public.profiles p ON p.id = dp.user_id
    WHERE LOWER(p.full_name) LIKE '%razack%'
  `;
  console.log('Docs Razack:', razackDocs);

  await prisma.$disconnect();
}

cleanAllDuplicates().catch(console.error);
