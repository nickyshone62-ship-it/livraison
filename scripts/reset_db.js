const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Démarrage de la remise à zéro de la base de données...');

  const deleteSafe = async (model) => {
    try {
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany({});
      }
    } catch (e) {
      // Ignore
    }
  };

  await deleteSafe(prisma.deliveryStatusHistory);
  await deleteSafe(prisma.deliveryItem);
  await deleteSafe(prisma.deliveryProposal);
  await deleteSafe(prisma.delivery);
  await deleteSafe(prisma.deliveryRequest);
  await deleteSafe(prisma.dispute);
  await deleteSafe(prisma.review);
  await deleteSafe(prisma.report);
  await deleteSafe(prisma.notification);
  await deleteSafe(prisma.auditLog);
  await deleteSafe(prisma.payment);
  await deleteSafe(prisma.subscription);
  await deleteSafe(prisma.driverZonePreference);
  await deleteSafe(prisma.driver);

  await prisma.profile.deleteMany({
    where: {
      user: {
        role: { not: 'ADMIN' }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      role: { not: 'ADMIN' }
    }
  });

  const adminPhone = '+226 06 88 73 30';
  const adminPassHash = await bcrypt.hash('Nick2004', 10);

  let adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: adminPhone },
        { role: 'ADMIN' }
      ]
    }
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        phone: adminPhone,
        passwordHash: adminPassHash,
        role: 'ADMIN',
        isActive: true,
        profile: {
          create: {
            fullName: 'Direction Administrateur Central',
            city: 'Ouagadougou',
            address: 'Centre-Ville Ouagadougou'
          }
        }
      }
    });
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        phone: adminPhone,
        passwordHash: adminPassHash,
        role: 'ADMIN',
        isActive: true
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'DATABASE_RESET_TO_ZERO',
      targetEntity: 'System',
      targetId: 'ALL',
      detailsJson: 'Remise à zéro complète effectuée par l\'administrateur pour le démarrage réel.'
    }
  });

  console.log('✅ Remise à zéro terminée avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
