const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetBitibalyAdouaAttempts() {
  console.log("Reinitialisation des tentatives OTP pour Bitibaly -> Adoua...");

  const assignmentId = 'e45371a9-f76d-4190-ad60-e34e20aa3642';

  await prisma.$executeRaw`
    UPDATE public.delivery_assignments
    SET pickup_otp_attempts = 0, delivery_otp_attempts = 0
    WHERE id = ${assignmentId}::uuid
  `;

  const assignment = await prisma.$queryRaw`
    SELECT id, pickup_otp, delivery_otp, pickup_otp_attempts, pickup_otp_verified
    FROM public.delivery_assignments
    WHERE id = ${assignmentId}::uuid
  `;

  console.log('Attribution apres reinitialisation:', assignment);

  await prisma.$disconnect();
}

resetBitibalyAdouaAttempts().catch(console.error);
