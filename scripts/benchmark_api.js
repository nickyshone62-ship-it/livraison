const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function benchmark() {
  console.log('⏱️ BENCHMARK DE LATENCE SUPABASE DATABASE');
  
  const startTotal = Date.now();

  const startConnect = Date.now();
  await prisma.$connect();
  console.log(`1. Temps de connexion TCP/SSL à Supabase: ${Date.now() - startConnect} ms`);

  const startQuery1 = Date.now();
  const usersCount = await prisma.user.count();
  console.log(`2. Temps d'exécution query 1 (count users = ${usersCount}): ${Date.now() - startQuery1} ms`);

  const startQuery2 = Date.now();
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, phone: true, role: true }
  });
  console.log(`3. Temps d'exécution query 2 (findAdmin = ${user?.phone}): ${Date.now() - startQuery2} ms`);

  console.log(`🏁 TEMPS TOTAL BASE DE DONNÉES: ${Date.now() - startTotal} ms`);

  await prisma.$disconnect();
}

benchmark();
