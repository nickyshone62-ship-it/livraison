const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape13() {
  console.log('=== GRAND AUDIT BÊTA UTILISATEURS ET CONCURRENCE MULTI-UTILISATEURS (ÉTAPE 13) ===\n');

  // 1. Audit Active Beta Accounts
  const clientAccounts = await prisma.$queryRaw`
    SELECT id, full_name as "fullName", phone, email, account_status::text as status
    FROM public.profiles
    WHERE role = 'client';
  `;

  const driverAccounts = await prisma.$queryRaw`
    SELECT p.id, p.full_name as "fullName", p.phone, dp.verification_status::text as "kycStatus", dp.is_available as "isAvailable"
    FROM public.profiles p
    JOIN public.driver_profiles dp ON dp.user_id = p.id
    WHERE p.role = 'driver';
  `;

  console.log(`1. COMPTES DE TEST CLIENTS BÊTA (${clientAccounts.length} clients) :`);
  for (const c of clientAccounts) {
    console.log(`   - Client: ${c.fullName || c.phone} | Phone: ${c.phone} | Status: ${c.status}`);
  }

  console.log(`\n2. COMPTES DE TEST LIVREURS BÊTA (${driverAccounts.length} livreurs) :`);
  for (const d of driverAccounts) {
    console.log(`   - Livreur: ${d.fullName || d.phone} | Phone: ${d.phone} | KYC: ${d.kycStatus} | Dispo: ${d.isAvailable}`);
  }

  // 3. Multi-User Delivery Isolation Audit
  const activeDeliveries = await prisma.$queryRaw`
    SELECT id, client_id as "clientId", status::text as status, package_description as "pkg"
    FROM public.delivery_requests
    ORDER BY created_at DESC;
  `;

  console.log(`\n3. AUDIT D'ISOLATION DES LIVRAISONS EN BASE (${activeDeliveries.length} livraisons) :`);
  for (const del of activeDeliveries) {
    console.log(`   - Delivery ID: ${del.id} | Client: ${del.clientId} | Statut: ${del.status.padEnd(16)} | Colis: "${del.pkg}"`);
  }
}

inspectEtape13()
  .catch((e) => console.error('Error inspecting step 13:', e))
  .finally(async () => await prisma.$disconnect());
