const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetProductionDatabase() {
  console.log('🧹 Purge intégrale de la base de données pour le lancement officiel...');

  try {
    // Purge tables with cascade/order
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.messages CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.conversations CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_tracking CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_status_history CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_assignments CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_offers CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.reviews CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.reports CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.notifications CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.admin_actions CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_requests CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.driver_documents CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.vehicles CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.subscriptions CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.payments CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public.driver_profiles CASCADE;`);

    // Remove all non-admin profiles
    await prisma.$executeRawUnsafe(`DELETE FROM public.profiles WHERE role::text != 'admin';`);

    // Ensure Super Admin Profile exists
    const adminRows = await prisma.$queryRawUnsafe(`
      SELECT id FROM public.profiles WHERE role::text = 'admin' LIMIT 1;
    `);

    if (!adminRows || adminRows.length === 0) {
      console.log('👑 Création du profil Super Administrateur...');
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.profiles (id, role, full_name, phone, email, account_status, created_at, updated_at)
        VALUES (
          '3e60767a-fac7-4c5a-bca3-36bbba9b81d5'::uuid,
          'admin'::user_role,
          'Super Administrateur Nick',
          '+226 06 88 73 30',
          'nickyshone62@gmail.com',
          'active'::account_status,
          NOW(),
          NOW()
        );
      `);
    }

    console.log('✅ Base de données remise à zéro avec succès ! Tous les tests ont été nettoyés.');
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetProductionDatabase();
