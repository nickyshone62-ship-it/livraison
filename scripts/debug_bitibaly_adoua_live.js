const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBitibalyAdouaLive() {
  console.log("=== DEBUG LIVE : LIVRAISON BITIBALY ↔ ADOUA ===\n");

  const deliveryId = '91aa3b03-c032-4952-a574-ee64ff460824';

  const req = await prisma.$queryRaw`
    SELECT id, client_id, status, pickup_address, destination_address, created_at
    FROM public.delivery_requests
    WHERE id = ${deliveryId}::uuid
  `;
  console.log('Delivery Request in DB:', req);

  const assignments = await prisma.$queryRaw`
    SELECT id, driver_id, pickup_otp, delivery_otp, pickup_otp_verified, delivery_otp_verified, pickup_otp_attempts, delivery_otp_attempts, created_at
    FROM public.delivery_assignments
    WHERE delivery_id = ${deliveryId}::uuid
    ORDER BY created_at DESC
  `;
  console.log('Assignments in DB:', assignments);

  const client = await prisma.$queryRaw`
    SELECT id, full_name, phone FROM public.profiles WHERE id = ${req[0].client_id}::uuid
  `;
  console.log('Client in DB:', client);

  if (assignments.length > 0) {
    const driverId = assignments[0].driver_id;
    const driverProfile = await prisma.$queryRaw`
      SELECT dp.id as driver_profile_id, dp.user_id, p.full_name, p.phone, p.role::text
      FROM public.driver_profiles dp
      JOIN public.profiles p ON p.id = dp.user_id
      WHERE dp.id = ${driverId}::uuid OR dp.user_id = ${driverId}::uuid
    `;
    console.log('Driver Profile in DB:', driverProfile);
  }

  await prisma.$disconnect();
}

debugBitibalyAdouaLive().catch(console.error);
