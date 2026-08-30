const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectBitibalyAdoua() {
  console.log('=== INSPECTION DE LA LIVRAISON BITIBALY -> ADOUA ===\n');

  // 1. Bitibaly
  const bitibaly = await prisma.$queryRaw`
    SELECT id, full_name, phone, role::text FROM public.profiles
    WHERE LOWER(full_name) LIKE '%bitibaly%' OR LOWER(full_name) LIKE '%biti%'
  `;
  console.log('Client Bitibaly:', bitibaly);

  // 2. Adoua
  const adoua = await prisma.$queryRaw`
    SELECT p.id as user_id, p.full_name, p.phone, dp.id as driver_profile_id
    FROM public.profiles p
    LEFT JOIN public.driver_profiles dp ON dp.user_id = p.id
    WHERE LOWER(p.full_name) LIKE '%adoua%'
  `;
  console.log('Livreurs Adoua:', adoua);

  if (bitibaly.length > 0) {
    const clientId = bitibaly[0].id;

    // Delivery requests for Bitibaly
    const requests = await prisma.$queryRaw`
      SELECT id, status, pickup_address, destination_address, created_at
      FROM public.delivery_requests
      WHERE client_id = ${clientId}::uuid
      ORDER BY created_at DESC
    `;
    console.log('\nLivraisons de Bitibaly:', requests);

    for (const req of requests) {
      const assignments = await prisma.$queryRaw`
        SELECT id, driver_id, pickup_otp, delivery_otp, pickup_otp_verified, delivery_otp_verified, pickup_otp_attempts, delivery_otp_attempts, created_at
        FROM public.delivery_assignments
        WHERE delivery_id = ${req.id}::uuid
        ORDER BY created_at DESC
      `;
      console.log(`\nAttributions pour la livraison ${req.id} (Statut: ${req.status}):`);
      console.log(assignments);
    }
  }

  await prisma.$disconnect();
}

inspectBitibalyAdoua().catch(console.error);
