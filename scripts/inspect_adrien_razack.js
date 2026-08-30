const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectAdrienRazack() {
  console.log('Inspection de Adrien et Razack...');

  const profiles = await prisma.$queryRaw`
    SELECT id, full_name, phone, role::text, avatar_url, cni_recto_url, cni_verso_url
    FROM public.profiles
    WHERE LOWER(full_name) LIKE '%adrien%' OR LOWER(full_name) LIKE '%razack%' OR LOWER(full_name) LIKE '%somtore%'
  `;

  console.log('Profils trouves:', profiles);

  for (const p of profiles) {
    const [dp] = await prisma.$queryRaw`
      SELECT id FROM public.driver_profiles WHERE user_id = ${p.id}::uuid
    `;

    if (dp) {
      const docs = await prisma.$queryRaw`
        SELECT id, document_type, file_url, created_at FROM public.driver_documents
        WHERE driver_id = ${dp.id}::uuid
        ORDER BY created_at ASC
      `;
      console.log(`\n=== Documents dans driver_documents pour ${p.full_name} (DriverID: ${dp.id}) ===`);
      console.log(`Nombre total de documents: ${docs.length}`);
      docs.forEach((doc, i) => {
        console.log(`Doc ${i+1}: ID=${doc.id}, Type=${doc.document_type}, CreatedAt=${doc.created_at}, URL length=${doc.file_url ? doc.file_url.length : 0}`);
      });
    }
  }

  await prisma.$disconnect();
}

inspectAdrienRazack().catch(console.error);
