const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding OTP columns to delivery_assignments...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.delivery_assignments 
    ADD COLUMN IF NOT EXISTS pickup_otp VARCHAR(20),
    ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(20),
    ADD COLUMN IF NOT EXISTS pickup_otp_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS delivery_otp_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pickup_otp_attempts INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_otp_attempts INT DEFAULT 0;
  `);
  console.log('✅ OTP columns added successfully to PostgreSQL database!');
}

main()
  .catch((e) => {
    console.error('Error adding OTP columns:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
