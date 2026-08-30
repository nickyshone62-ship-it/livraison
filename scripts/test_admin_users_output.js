const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminUsersOutput() {
  const users = await prisma.profile.findMany({
    where: { role: 'driver' },
    include: {
      driverProfile: {
        include: {
          vehicles: true,
          documents: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const estelle = users.find(u => u.fullName.toLowerCase().includes('estelle'));

  console.log('--- USER OUTPUT FOR ESTELLE IN /api/admin/users ---');
  console.log('Name:', estelle?.fullName);
  console.log('Role:', estelle?.role);
  console.log('cniRectoUrl len:', estelle?.cniRectoUrl?.length);
  console.log('cniVersoUrl len:', estelle?.cniVersoUrl?.length);
  console.log('avatarUrl len:', estelle?.avatarUrl?.length);
  console.log('DriverProfile documents count:', estelle?.driverProfile?.documents?.length);
  console.log('DriverProfile documents:', estelle?.driverProfile?.documents.map(d => ({ id: d.id, type: d.documentType, len: d.fileUrl?.length })));

  await prisma.$disconnect();
}

testAdminUsersOutput().catch(console.error);
