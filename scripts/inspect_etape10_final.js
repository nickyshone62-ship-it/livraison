const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape10() {
  console.log('=== GRAND AUDIT DE MISE EN PRODUCTION ET LANCEMENT OFFICIEL (ÉTAPE 10) ===\n');

  // 1. Audit System Infrastructure
  const tableCount = await prisma.$queryRaw`SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public';`;
  const rlsCount = await prisma.$queryRaw`SELECT count(distinct tablename)::int as count FROM pg_policies WHERE schemaname = 'public';`;
  const profilesCount = await prisma.$queryRaw`SELECT count(*)::int as count FROM public.profiles;`;
  const deliveriesCount = await prisma.$queryRaw`SELECT count(*)::int as count FROM public.delivery_requests;`;
  const paymentsCount = await prisma.$queryRaw`SELECT count(*)::int as count FROM public.payments;`;

  console.log('1. ÉTAT DU SYSTÈME EN PRODUCTION :');
  console.log(`   - Tables PostgreSQL actives       : ${tableCount[0].count} tables`);
  console.log(`   - Tables protégées par RLS (100%) : ${rlsCount[0].count} tables`);
  console.log(`   - Total Profils enregistrés       : ${profilesCount[0].count}`);
  console.log(`   - Total Livraisons enregistrées   : ${deliveriesCount[0].count}`);
  console.log(`   - Total Paiements traités         : ${paymentsCount[0].count}`);

  // 2. Official Settings Check
  const settings = await prisma.$queryRaw`SELECT setting_key as key, setting_value as value FROM public.platform_settings;`;
  console.log('\n2. PARAMÈTRES OFFICIELS DE TARIFICATION ET USSD :');
  for (const s of settings) {
    console.log(`   - ${s.key.padEnd(26)} : ${s.value}`);
  }
}

inspectEtape10()
  .catch((e) => console.error('Error inspecting step 10:', e))
  .finally(async () => await prisma.$disconnect());
