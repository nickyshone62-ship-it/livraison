const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testDirect() {
  console.log('🧪 Testing direct driver creation in database...');
  const phone = '+226 77 99 88 11';
  const computedFullName = 'Test Livreur Ouaga';
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      role: 'LIVREUR',
      isActive: false,
      profile: {
        create: {
          fullName: computedFullName,
          city: 'Ouagadougou',
        },
      },
      driver: {
        create: {
          verificationStatus: 'EN_ATTENTE',
          idCardNumber: 'B11223344',
          vehicles: {
            create: {
              vehicleType: 'MOTO',
              brand: 'Yamaha',
            },
          },
        },
      },
    },
    include: { profile: true, driver: true },
  });

  console.log('Created User ID:', user.id);
  console.log('Created User Role:', user.role);
  console.log('Created User isActive:', user.isActive);

  // Notify Admins
  let adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log('Admin Users Found:', adminUsers.length, adminUsers.map(a => a.id));

  const notifs = await prisma.notification.createMany({
    data: adminUsers.map((admin) => ({
      userId: admin.id,
      title: '🛵 NOUVEAU LIVREUR À VALIDER !',
      message: `L'utilisateur ${computedFullName} (Livreur, Tél: ${phone}) vient de s'inscrire et attend la validation.`,
      type: 'SYSTEM',
    })),
  });

  console.log('Notifications Created:', notifs);

  // Check what /api/admin/users and /api/admin/notifications return
  const usersForAdmin = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    include: { profile: true, driver: true },
  });
  console.log('Users returned for Admin Panel:', usersForAdmin.length);

  const notifsForAdmin = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { include: { profile: true } } },
  });
  console.log('Notifications returned for Admin Panel:', notifsForAdmin.length, notifsForAdmin);
}

testDirect().finally(() => prisma.$disconnect());
