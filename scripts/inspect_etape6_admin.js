const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape6() {
  console.log('=== INSPECTION ADMINISTRATION COMPLÈTE (ÉTAPE 6) ===\n');

  // 1. Fetch Real Platform Statistics from Database
  const clientStats = await prisma.$queryRaw`
    SELECT account_status::text as status, COUNT(*)::int as count
    FROM public.profiles
    WHERE role = 'client'
    GROUP BY account_status;
  `;

  const driverStats = await prisma.$queryRaw`
    SELECT dp.verification_status::text as status, COUNT(*)::int as count
    FROM public.driver_profiles dp
    GROUP BY dp.verification_status;
  `;

  const paymentStats = await prisma.$queryRaw`
    SELECT status::text as status, COUNT(*)::int as count
    FROM public.payments
    GROUP BY status;
  `;

  const deliveryStats = await prisma.$queryRaw`
    SELECT status::text as status, COUNT(*)::int as count
    FROM public.delivery_requests
    GROUP BY status;
  `;

  console.log('1. STATISTIQUES RÉELLES CLIENTS EN BASE :');
  for (const c of clientStats) console.log(`   - Statut ${c.status} : ${c.count}`);

  console.log('\n2. STATISTIQUES RÉELLES LIVREURS EN BASE :');
  for (const d of driverStats) console.log(`   - Statut verification ${d.status} : ${d.count}`);

  console.log('\n3. STATISTIQUES RÉELLES PAIEMENTS EN BASE :');
  for (const p of paymentStats) console.log(`   - Statut paiement ${p.status} : ${p.count}`);

  console.log('\n4. STATISTIQUES RÉELLES LIVRAISONS EN BASE :');
  for (const del of deliveryStats) console.log(`   - Statut livraison ${del.status} : ${del.count}`);

  // 5. Inspect admin_actions table
  const adminActions = await prisma.$queryRaw`
    SELECT id, admin_id as "adminId", action_type as "actionType", target_table as "targetTable", created_at as "createdAt"
    FROM public.admin_actions
    ORDER BY created_at DESC
    LIMIT 5;
  `;
  console.log(`\n5. JOURNAL DE LOGS ADMIN_ACTIONS (${adminActions.length} enregistrements) :`);
  for (const a of adminActions) {
    console.log(`   - ID: ${a.id} | Admin: ${a.adminId} | Action: ${a.actionType} | Cible: ${a.targetTable}`);
  }
}

inspectEtape6()
  .catch((e) => console.error('Error inspecting step 6:', e))
  .finally(async () => await prisma.$disconnect());
