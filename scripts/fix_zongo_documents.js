const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixZongo() {
  const driverId = '923153ec-6f4d-40cb-bed8-989c83e5c133';
  const profileId = '93704b75-e59d-48c3-a537-56c6b3454577';

  const [p] = await prisma.$queryRaw`SELECT cni_recto_url, cni_verso_url, avatar_url FROM public.profiles WHERE id = ${profileId}::uuid`;

  console.log('Insertion dans driver_documents...');

  if (p.cni_recto_url) {
    await prisma.$executeRaw`
      INSERT INTO public.driver_documents (id, driver_id, document_type, file_url, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${driverId}::uuid, 'identity_card_recto', ${p.cni_recto_url}, 'pending', NOW(), NOW())
    `;
  }

  if (p.cni_verso_url) {
    await prisma.$executeRaw`
      INSERT INTO public.driver_documents (id, driver_id, document_type, file_url, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${driverId}::uuid, 'identity_card_verso', ${p.cni_verso_url}, 'pending', NOW(), NOW())
    `;
  }

  if (p.avatar_url) {
    await prisma.$executeRaw`
      INSERT INTO public.driver_documents (id, driver_id, document_type, file_url, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${driverId}::uuid, 'photo', ${p.avatar_url}, 'pending', NOW(), NOW())
    `;
  }

  const docs = await prisma.$queryRaw`
    SELECT id, document_type, status, created_at FROM public.driver_documents WHERE driver_id = ${driverId}::uuid
  `;
  console.log('Succes total ! Documents de ZONGO ESTELLE en base:', docs);

  await prisma.$disconnect();
}

fixZongo().catch(console.error);
