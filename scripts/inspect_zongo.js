const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectZongo() {
  console.log('Inspection du compte ZONGO ESTELLE...');

  const users = await prisma.$queryRaw`
    SELECT id, full_name, phone, email, role::text, account_status::text,
           avatar_url, cni_recto_url, cni_verso_url, rejection_reason, created_at, updated_at
    FROM public.profiles
    WHERE LOWER(full_name) LIKE '%zongo%' OR LOWER(full_name) LIKE '%estelle%' OR phone LIKE '%estelle%'
  `;

  console.log('Resultats profiles:', JSON.stringify(users, null, 2));

  if (users && users.length > 0) {
    for (const u of users) {
      const driverProfiles = await prisma.$queryRaw`
        SELECT id, user_id, verification_status::text, is_available, created_at
        FROM public.driver_profiles
        WHERE user_id = ${u.id}::uuid
      `;
      console.log(`DriverProfile pour user ${u.id}:`, JSON.stringify(driverProfiles, null, 2));

      if (driverProfiles && driverProfiles.length > 0) {
        const dId = driverProfiles[0].id;
        const docs = await prisma.$queryRaw`
          SELECT id, driver_id, document_type, file_url, status::text, created_at
          FROM public.driver_documents
          WHERE driver_id = ${dId}::uuid
        `;
        console.log(`DriverDocuments pour driver ${dId}:`, JSON.stringify(docs, null, 2));

        const vehicles = await prisma.$queryRaw`
          SELECT id, driver_id, vehicle_type::text, brand, model, registration_number, color
          FROM public.vehicles
          WHERE driver_id = ${dId}::uuid
        `;
        console.log(`Vehicles pour driver ${dId}:`, JSON.stringify(vehicles, null, 2));
      }

      const payments = await prisma.$queryRaw`
        SELECT id, user_id, payment_type::text, amount, payment_method::text, transaction_reference, status::text
        FROM public.payments
        WHERE user_id = ${u.id}::uuid
      `;
      console.log(`Payments pour user ${u.id}:`, JSON.stringify(payments, null, 2));
    }
  }

  await prisma.$disconnect();
}

inspectZongo().catch(err => {
  console.error(err);
  process.exit(1);
});
