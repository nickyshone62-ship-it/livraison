const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Démarrage de la purge intégrale et de la mise à zéro de la base de données Supabase...');

  // 1. Purge all operational data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.deliveryCode.deleteMany({});
  await prisma.deliveryStatusHistory.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.deliveryProposal.deleteMany({});
  await prisma.deliveryRequest.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.verificationDocument.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});

  // 2. Delete non-admin profiles and users
  await prisma.profile.deleteMany({
    where: {
      user: {
        role: { not: 'ADMIN' },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      role: { not: 'ADMIN' },
    },
  });

  // 3. Ensure System Settings exist
  const existingSettingsCount = await prisma.systemSetting.count();
  if (existingSettingsCount === 0) {
    await prisma.systemSetting.createMany({
      data: [
        { key: 'DRIVER_VERIFICATION_FEE_FCFA', value: '1500', description: 'Frais d\'inscription des livreurs' },
        { key: 'PLATFORM_COMMISSION_PERCENT', value: '5', description: 'Pourcentage de commission' },
        { key: 'SUPPORT_PHONE', value: '+226 70 00 00 00', description: 'Assistance Ouagadougou' },
      ],
    });
  }

  // 4. Ensure Subscription Plans exist (Plan Commerçant 1000f, Plan Livreur 500f)
  let planCommercant = await prisma.subscriptionPlan.findFirst({ where: { code: 'COMMERCANT' } });
  if (!planCommercant) {
    planCommercant = await prisma.subscriptionPlan.create({
      data: {
        code: 'COMMERCANT',
        name: 'Plan Commerçant',
        description: 'Abonnement mensuel unique pour les boutiques et vendeurs à Ouagadougou.',
        priceFcfa: 1000,
        durationDays: 30,
        maxActiveRequests: 100,
      },
    });
  } else {
    await prisma.subscriptionPlan.update({
      where: { id: planCommercant.id },
      data: { priceFcfa: 1000, name: 'Plan Commerçant' },
    });
  }

  let planLivreur = await prisma.subscriptionPlan.findFirst({ where: { code: 'LIVREUR' } });
  if (!planLivreur) {
    planLivreur = await prisma.subscriptionPlan.create({
      data: {
        code: 'LIVREUR',
        name: 'Plan Livreur',
        description: 'Abonnement mensuel unique pour les livreurs indépendants à Ouagadougou.',
        priceFcfa: 500,
        durationDays: 30,
        maxActiveRequests: 200,
      },
    });
  } else {
    await prisma.subscriptionPlan.update({
      where: { id: planLivreur.id },
      data: { priceFcfa: 500, name: 'Plan Livreur' },
    });
  }

  // 5. Ensure 11 Arrondissements exist
  const zonesData = [
    { name: 'Arrondissement 1', associatedQuartiers: 'Bilbalogo, Saint-Léon, Zangouettin, Tiedpalogo, Koulouba, Kamsonghin, Samandin, Gounghin Sud, Gandin (Petit Paris), Kouritenga, Mankoudougou' },
    { name: 'Arrondissement 2', associatedQuartiers: 'Paspanga, Ouidi, Larlé, Kologh-Naba, Dapoya II, Nemnin, Niogsin, Hamdalaye, Gounghin Nord, Baoghin, Cité An III, Sankariaré' },
    { name: 'Arrondissement 3', associatedQuartiers: 'Camp militaire, Naab Pougo, Yaoghin, Zongo, Noncin/Nonsin, Rimkiéta, Toécin, Kilwin, Tampouy, Kienbaoghin, Koumdayonré' },
    { name: 'Arrondissement 4', associatedQuartiers: 'Tanghin, Sambin Barrage, Somgandé, Zone industrielle de Kossodo, Toudoubwéogo, Sogdin, Polesgo, Tabtenga, Toukin' },
    { name: 'Arrondissement 5', associatedQuartiers: 'ENAREF, Wayalghin, Zone du Bois, Zogona, 1200 Logements, Dagnoën, Wemtenga, Ronsin, Kalgondin, Ouaga Inter, SIAO, Silmissin, Toeyibin' },
    { name: 'Arrondissement 6', associatedQuartiers: 'Pagalayiri, Cissin, Pissy, Bongnaam, Kouritenga, Sonré, Song-Naaba, Azimo/Socogib' },
    { name: 'Arrondissement 7', associatedQuartiers: 'Nagrin, Yaoghin, Bonheur-Ville, Waa-Paasi, Belle-Ville, Sandogo, Boassa, Kankamsin, Zagtouli Sud, Zagtouli Nord' },
    { name: 'Arrondissement 8', associatedQuartiers: 'Darsalam, Zongo Nabitenga, Nonghin, Bassinko/Basseko, Sogpelcé, Bissighin, Silmiougou, Gantin' },
    { name: 'Arrondissement 9', associatedQuartiers: 'Silmiyiri, Marcoussis, Bissighin, Yagma, Ouapassi, Kamboincé, Zoodnoma, Watinonma, Kossoghin, Bangpooré, Wobriguéré, Babouang Rouanga, Toudwéogo, Kamboissin, Dapaweoghin' },
    { name: 'Arrondissement 10', associatedQuartiers: 'Kossodo, Nioko II, Bendogo, Wayalghin, Nioko I, Godin, Dassasgho, Goundrin, Quatorze-Yaar, Djikof, Taabtenga, Sakoula' },
    { name: 'Arrondissement 11', associatedQuartiers: 'Zone Une, Katr-Yaar, Rayongo, Yamtenga, Ouidtenga, Karpala, Balkuy, Lanoayiri, Dayongo, Sanyiri' },
  ];

  for (const z of zonesData) {
    const existing = await prisma.zone.findFirst({ where: { name: z.name } });
    if (!existing) {
      await prisma.zone.create({
        data: {
          name: z.name,
          city: 'Ouagadougou',
          indicativePriceFcfa: 1500,
          associatedQuartiers: z.associatedQuartiers,
        },
      });
    }
  }

  // 6. Ensure Super Admin Account exists
  const adminPassHash = await bcrypt.hash('Nick2004', 10);
  const adminPhone1 = '+226 70 00 00 00';
  const adminPhone2 = '+226 06 88 73 30';

  let adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: adminPhone1 },
        { phone: adminPhone2 },
        { role: 'ADMIN' },
      ],
    },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        phone: adminPhone1,
        email: 'admin@livraison-ouaga.bf',
        passwordHash: adminPassHash,
        role: 'ADMIN',
        isActive: true,
        profile: {
          create: {
            fullName: 'Super Administrateur Nick',
            city: 'Ouagadougou',
            address: 'Avenue Kwame N\'Krumah, Ouagadougou',
          },
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: adminPassHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'PRODUCTION_RESET_COMPLETED',
      targetEntity: 'System',
      targetId: 'ALL',
      detailsJson: JSON.stringify({ message: 'Base de données réinitialisée à zéro pour le démarrage officiel des activités réelles.' }),
    },
  });

  console.log('✅ Base de données remise à zéro avec succès ! Prête pour les activités réelles.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la remise à zéro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
