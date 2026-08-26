const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== AUDIT RLS SUPABASE POSTGRESQL ===\n');
  
  const tables = await prisma.$queryRaw`
    SELECT 
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;

  console.log('--- TABLES ET STATUT RLS ---');
  for (const t of tables) {
    console.log(`Table: ${t.tablename.padEnd(25)} | RLS Active: ${t.rowsecurity ? '✅ OUI' : '❌ NON'}`);
  }

  console.log('\n--- POLICIES EXISTANTES ---');
  const policies = await prisma.$queryRaw`
    SELECT 
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;

  if (policies.length === 0) {
    console.log('Aucune policy RLS spécifique trouvée dans pg_policies.');
  } else {
    for (const p of policies) {
      console.log(`Table: ${p.tablename} | Policy: ${p.policyname} | Cmd: ${p.cmd} | Qual: ${p.qual}`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error auditing RLS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
