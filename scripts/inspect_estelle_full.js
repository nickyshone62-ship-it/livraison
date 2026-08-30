const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEstelleFull() {
  const users = await prisma.$queryRaw`
    SELECT * FROM public.profiles WHERE LOWER(full_name) LIKE '%estelle%' OR LOWER(full_name) LIKE '%zongo%'
  `;
  console.log('Users profiles:', users);

  if (users.length > 0) {
    const userId = users[0].id;
    const dp = await prisma.$queryRaw`
      SELECT * FROM public.driver_profiles WHERE user_id = ${userId}::uuid
    `;
    console.log('DriverProfile:', dp);

    if (dp.length > 0) {
      const docs = await prisma.$queryRaw`
        SELECT id, document_type, length(file_url) as len FROM public.driver_documents WHERE driver_id = ${dp[0].id}::uuid
      `;
      console.log('Docs in driver_documents:', docs);
    }
  }

  await prisma.$disconnect();
}

inspectEstelleFull().catch(console.error);
