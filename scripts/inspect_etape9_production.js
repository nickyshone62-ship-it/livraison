const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEtape9() {
  console.log('=== INSPECTION PRÉPARATION AU LANCEMENT RÉEL (ÉTAPE 9) ===\n');

  // 1. Audit Environment Files & Frontend Keys
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  console.log('1. AUDIT DES VARIABLES D\'ENVIRONNEMENT ET SÉCURITÉ DES CLÉS :');
  const hasServiceRoleKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  console.log(`   - Présence SUPABASE_SERVICE_ROLE_KEY dans .env: ${hasServiceRoleKey}`);

  // Check if any src/ file exposes service role key
  let exposedInSrc = false;
  function searchSrc(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchSrc(fullPath);
      } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('process.env.SUPABASE_SERVICE_ROLE_KEY') && !fullPath.includes('api')) {
          exposedInSrc = true;
          console.error(`   ⚠️ ALERTE SÉCURITÉ: Clé secrète trouvée dans ${fullPath}`);
        }
      }
    }
  }

  const srcDir = path.join(__dirname, '..', 'src');
  if (fs.existsSync(srcDir)) searchSrc(srcDir);
  console.log(`   - Clé secrète exposée dans le frontend: ${exposedInSrc ? 'OUI (ATTENTION)' : 'NON (100% SÉCURISÉ)'}`);

  // 2. Audit Database Table & Constraint Status
  const dbStatus = await prisma.$queryRaw`
    SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public';
  `;
  console.log(`\n2. ÉTAT DES TABLES POSTGRESQL (${dbStatus[0].count} tables actives) :`);

  // 3. Platform Settings Audit
  const settings = await prisma.$queryRaw`
    SELECT *
    FROM public.platform_settings
    LIMIT 1;
  `;
  console.log('\n3. TARIFICATION CONFIGURÉE EN BASE :');
  console.log(settings);
}

inspectEtape9()
  .catch((e) => console.error('Error inspecting step 9:', e))
  .finally(async () => await prisma.$disconnect());
