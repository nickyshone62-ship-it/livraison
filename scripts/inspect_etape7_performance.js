const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape7() {
  console.log('=== INSPECTION PERFORMANCE, RAPIDITÉ & RESPONSIVE (ÉTAPE 7) ===\n');

  // 1. Inspect Indexes on key tables
  const indexes = await prisma.$queryRaw`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'driver_profiles', 'delivery_requests', 'delivery_assignments', 'payments', 'subscriptions', 'reviews', 'reports', 'messages', 'delivery_tracking')
    ORDER BY tablename, indexname;
  `;

  console.log(`1. INDEX POSTGRESQL EXISTANTS (${indexes.length}) :`);
  for (const idx of indexes) {
    console.log(`   - Table: ${idx.tablename.padEnd(22)} | Index: ${idx.indexname}`);
  }

  // 2. Query Performance Timings Test
  console.log('\n2. MESURE DES TEMPS DE RÉPONSE DES REQUÊTES SQL COMPTAGE :');

  const t0 = Date.now();
  await prisma.$queryRaw`SELECT COUNT(*)::int FROM public.profiles;`;
  console.log(`   - Count profiles: ${Date.now() - t0}ms`);

  const t1 = Date.now();
  await prisma.$queryRaw`SELECT COUNT(*)::int FROM public.delivery_requests;`;
  console.log(`   - Count delivery_requests: ${Date.now() - t1}ms`);

  const t2 = Date.now();
  await prisma.$queryRaw`SELECT COUNT(*)::int FROM public.payments;`;
  console.log(`   - Count payments: ${Date.now() - t2}ms`);

  const t3 = Date.now();
  await prisma.$queryRaw`SELECT COUNT(*)::int FROM public.messages;`;
  console.log(`   - Count messages: ${Date.now() - t3}ms`);
}

inspectEtape7()
  .catch((e) => console.error('Error inspecting step 7:', e))
  .finally(async () => await prisma.$disconnect());
