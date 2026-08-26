const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape2() {
  console.log('=== INSPECTION PLATEFORME & PAIEMENTS (ÉTAPE 2) ===\n');

  // 1. Inspect platform_settings
  const settings = await prisma.$queryRaw`
    SELECT setting_key as "settingKey", setting_value as "settingValue"
    FROM public.platform_settings;
  `;
  console.log(`1. PLATFORM SETTINGS EN BASE (${settings.length} paramètres) :`);
  for (const s of settings) {
    console.log(`   - ${s.settingKey.padEnd(25)} : ${JSON.stringify(s.settingValue)}`);
  }

  // 2. Inspect payments table via $queryRaw
  const payments = await prisma.$queryRaw`
    SELECT id, user_id as "userId", payment_type::text as "paymentType", amount, payment_method as "paymentMethod", transaction_reference as "transactionReference", status::text as status, created_at as "createdAt"
    FROM public.payments
    ORDER BY created_at DESC;
  `;
  console.log(`\n2. PAIEMENTS EN BASE (${payments.length} enregistrements) :`);
  for (const p of payments) {
    console.log(`   - ID: ${p.id} | Type: ${p.paymentType} | Montant: ${p.amount} FCFA | Méthode: ${p.paymentMethod} | Statut: ${p.status} | Date: ${p.createdAt}`);
  }

  // 3. Inspect subscriptions table via $queryRaw
  const subscriptions = await prisma.$queryRaw`
    SELECT id, user_id as "userId", amount, status::text as status, starts_at as "startsAt", expires_at as "expiresAt"
    FROM public.subscriptions
    ORDER BY created_at DESC;
  `;
  console.log(`\n3. ABONNEMENTS EN BASE (${subscriptions.length} enregistrements) :`);
  for (const s of subscriptions) {
    console.log(`   - ID: ${s.id} | User: ${s.userId} | Montant: ${s.amount} FCFA | Statut: ${s.status} | Expire: ${s.expiresAt}`);
  }

  // 4. Check RLS policies for payments & subscriptions
  const rlsPolicies = await prisma.$queryRaw`
    SELECT tablename, policyname, cmd, qual
    FROM pg_policies
    WHERE tablename IN ('payments', 'subscriptions', 'platform_settings')
    ORDER BY tablename, policyname;
  `;
  console.log('\n4. POLICIES RLS PAIEMENTS & ABONNEMENTS :');
  for (const pol of rlsPolicies) {
    console.log(`   - Table: ${pol.tablename.padEnd(20)} | Policy: ${pol.policyname.padEnd(25)} | Cmd: ${pol.cmd}`);
  }
}

inspectEtape2()
  .catch((e) => console.error('Error inspecting step 2:', e))
  .finally(async () => await prisma.$disconnect());
