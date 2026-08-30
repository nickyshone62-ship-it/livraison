const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeOrResetBitibaly() {
  const assignmentId = 'e45371a9-f76d-4190-ad60-e34e20aa3642';

  await prisma.$executeRaw`
    UPDATE public.delivery_assignments
    SET delivery_otp_attempts = 0
    WHERE id = ${assignmentId}::uuid
  `;

  console.log("Compteur de tentatives OTP 2 réinitialisé à 0 pour Bitibaly ↔ Adoua.");

  await prisma.$disconnect();
}

completeOrResetBitibaly().catch(console.error);
