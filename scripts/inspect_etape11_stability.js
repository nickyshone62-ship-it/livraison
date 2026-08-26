const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape11() {
  console.log('=== INSPECTION SUPERVISION, MAINTENANCE ET STABILITÉ (ÉTAPE 11) ===\n');

  // 1. Health Ping & Timing Test
  const t0 = Date.now();
  const dbPing = await prisma.$queryRaw`SELECT NOW() as "currentTime";`;
  const pingTime = Date.now() - t0;
  console.log(`1. PING BASE DE DONNÉES SUPABASE : ${pingTime}ms (Horloge: ${dbPing[0].currentTime})`);

  // 2. Audit Logs Count
  const logsCount = await prisma.$queryRaw`SELECT count(*)::int as count FROM public.admin_actions;`;
  console.log(`2. TOTAL JOURNAUX D'AUDIT DANS ADMIN_ACTIONS : ${logsCount[0].count}`);

  // 3. RLS Security Integrity Check across all tables
  const rlsTables = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  console.log(`\n3. AUDIT DU NIVEAU SÉCURITÉ LIGNE (RLS) SUR LES ${rlsTables.length} TABLES :`);
  let allSecured = true;
  for (const t of rlsTables) {
    if (!t.rowsecurity) allSecured = false;
    console.log(`   - Table: ${t.tablename.padEnd(24)} | RLS Active: ${t.rowsecurity}`);
  }
  console.log(`   - Statut RLS Global: ${allSecured ? '100% SÉCURISÉ (CONFORME)' : 'ATTENTION (RLS MANQUANT)'}`);

  // 4. Memory & Performance Snapshot
  const memUsage = process.memoryUsage();
  console.log('\n4. EMPREINTE MÉMOIRE SERVEUR :');
  console.log(`   - RSS           : ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - Heap Total    : ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - Heap Utilisé  : ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}

inspectEtape11()
  .catch((e) => console.error('Error inspecting step 11:', e))
  .finally(async () => await prisma.$disconnect());
