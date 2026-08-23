import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Livraison Ouagadougou...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.deliveryCode.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.deliveryProposal.deleteMany();
  await prisma.deliveryRequest.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.verificationDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. System Settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'DRIVER_VERIFICATION_FEE_FCFA',
        value: '5000',
        description: 'Frais uniques d\'inscription et de vérification des livreurs',
      },
      {
        key: 'PLATFORM_COMMISSION_PERCENT',
        value: '5',
        description: 'Pourcentage indicatif de commission sur les livraisons',
      },
      {
        key: 'SUPPORT_PHONE',
        value: '+226 25 30 00 00',
        description: 'Téléphone de l\'assistance clientèle à Ouagadougou',
      },
    ],
  });

  // 3. Subscription Plans (Uniquement Plan Commerçant et Plan Livreur)
  const planCommercant = await prisma.subscriptionPlan.create({
    data: {
      code: 'COMMERCANT',
      name: 'Plan Commerçant',
      description: 'Abonnement mensuel unique pour les boutiques, vendeurs en ligne et commerçants à Ouagadougou.',
      priceFcfa: 1000,
      durationDays: 30,
      maxActiveRequests: 50,
    },
  });

  const planLivreur = await prisma.subscriptionPlan.create({
    data: {
      code: 'LIVREUR',
      name: 'Plan Livreur',
      description: 'Abonnement mensuel unique pour les livreurs indépendants à Ouagadougou.',
      priceFcfa: 500,
      durationDays: 30,
      maxActiveRequests: 100,
    },
  });

  // 4. All 11 Arrondissements of Ouagadougou
  const zone1 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 1',
      city: 'Ouagadougou',
      indicativePriceFcfa: 1500,
      associatedQuartiers: 'Bilbalogo, Saint-Léon, Zangouettin, Tiedpalogo, Koulouba, Kamsonghin, Samandin, Gounghin Sud, Gandin (Petit Paris), Kouritenga, Mankoudougou',
    },
  });

  const zone2 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 2',
      city: 'Ouagadougou',
      indicativePriceFcfa: 1500,
      associatedQuartiers: 'Paspanga, Ouidi, Larlé, Kologh-Naba, Dapoya II, Nemnin, Niogsin, Hamdalaye, Gounghin Nord, Baoghin, Cité An III, Sankariaré',
    },
  });

  const zone3 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 3',
      city: 'Ouagadougou',
      indicativePriceFcfa: 2000,
      associatedQuartiers: 'Camp militaire, Naab Pougo, Yaoghin, Zongo, Noncin/Nonsin, Rimkiéta, Toécin, Kilwin, Tampouy, Kienbaoghin, Koumdayonré',
    },
  });

  const zone4 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 4',
      city: 'Ouagadougou',
      indicativePriceFcfa: 2000,
      associatedQuartiers: 'Tanghin, Sambin Barrage, Somgandé, Zone industrielle de Kossodo, Toudoubwéogo, Sogdin, Polesgo, Tabtenga, Toukin',
    },
  });

  const zone5 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 5',
      city: 'Ouagadougou',
      indicativePriceFcfa: 1800,
      associatedQuartiers: 'ENAREF, Wayalghin, Zone du Bois, Zogona, 1200 Logements, Dagnoën, Wemtenga, Ronsin, Kalgondin, Ouaga Inter, SIAO, Silmissin, Toeyibin',
    },
  });

  const zone6 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 6',
      city: 'Ouagadougou',
      indicativePriceFcfa: 1800,
      associatedQuartiers: 'Pagalayiri, Cissin, Pissy, Bongnaam, Kouritenga, Sonré, Song-Naaba, Azimo/Socogib',
    },
  });

  const zone7 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 7',
      city: 'Ouagadougou',
      indicativePriceFcfa: 2200,
      associatedQuartiers: 'Nagrin, Yaoghin, Bonheur-Ville, Waa-Paasi, Belle-Ville, Sandogo, Boassa, Kankamsin, Zagtouli Sud, Zagtouli Nord',
    },
  });

  const zone8 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 8',
      city: 'Ouagadougou',
      indicativePriceFcfa: 2500,
      associatedQuartiers: 'Darsalam, Zongo Nabitenga, Nonghin, Bassinko/Basseko, Sogpelcé, Bissighin, Silmiougou, Gantin',
    },
  });

  const zone9 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 9',
      city: 'Ouagadougou',
      indicativePriceFcfa: 2500,
      associatedQuartiers: 'Silmiyiri, Marcoussis, Bissighin, Yagma, Ouapassi, Kamboincé, Zoodnoma, Watinonma, Kossoghin, Bangpooré, Wobriguéré, Babouang Rouanga, Toudwéogo, Kamboissin, Dapaweoghin',
    },
  });

  const zone10 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 10',
      city: 'Ouagadougou',
      indicativePriceFcfa: 2000,
      associatedQuartiers: 'Kossodo, Nioko II, Bendogo, Wayalghin, Nioko I, Godin, Dassasgho, Goundrin, Quatorze-Yaar, Djikof, Taabtenga, Sakoula',
    },
  });

  const zone11 = await prisma.zone.create({
    data: {
      name: 'Arrondissement 11',
      city: 'Ouagadougou',
      indicativePriceFcfa: 2000,
      associatedQuartiers: 'Zone Une, Katr-Yaar, Rayongo, Yamtenga, Ouidtenga, Karpala, Balkuy, Lanoayiri, Dayongo, Sanyiri',
    },
  });

  // 5. Create Tariffs for Moto & Tricycle
  await prisma.tariff.createMany({
    data: [
      { zoneId: zone1.id, vehicleType: 'MOTO', basePriceFcfa: 1500, perKmFcfa: 150 },
      { zoneId: zone1.id, vehicleType: 'TRICYCLE', basePriceFcfa: 3500, perKmFcfa: 300 },
      { zoneId: zone5.id, vehicleType: 'MOTO', basePriceFcfa: 1800, perKmFcfa: 200 },
      { zoneId: zone11.id, vehicleType: 'MOTO', basePriceFcfa: 2000, perKmFcfa: 200 },
      { zoneId: zone9.id, vehicleType: 'MOTO', basePriceFcfa: 2500, perKmFcfa: 250 },
    ],
  });

  // 6. Users & Profiles
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      phone: '+226 70 00 00 00',
      email: 'admin@livraison-ouaga.bf',
      passwordHash: defaultPassword,
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'Administrateur Principal',
          city: 'Ouagadougou',
          address: 'Avenue Kwame N\'Krumah, Ouagadougou',
        },
      },
    },
  });

  // Customer 1: Particulier
  const particulierUser = await prisma.user.create({
    data: {
      phone: '+226 76 11 22 33',
      email: 'ousmane.kaboro@gmail.com',
      passwordHash: defaultPassword,
      role: 'PARTICULIER',
      profile: {
        create: {
          fullName: 'Ousmane Kaboré',
          city: 'Ouagadougou',
          address: 'Zogona, près de l\'Université Joseph Ki-Zerbo',
        },
      },
      subscriptions: {
        create: {
          planId: planCommercant.id,
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Customer 2: Commerçant
  const commercantUser = await prisma.user.create({
    data: {
      phone: '+226 78 44 55 66',
      email: 'contact@faso-boutique.bf',
      passwordHash: defaultPassword,
      role: 'COMMERCANT',
      profile: {
        create: {
          fullName: 'Boutique Faso Mode & Électro',
          companyName: 'Faso Mode SARL',
          taxId: 'BF-OUA-2024-B-1234',
          city: 'Ouagadougou',
          address: 'Grand Marché Rood-Woko, Stand B12',
        },
      },
      subscriptions: {
        create: {
          planId: planCommercant.id,
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Customer 3: Entreprise
  const entrepriseUser = await prisma.user.create({
    data: {
      phone: '+226 70 88 99 00',
      email: 'logistique@sahel-express.bf',
      passwordHash: defaultPassword,
      role: 'ENTREPRISE',
      profile: {
        create: {
          fullName: 'Sahel Distribution SA',
          companyName: 'Sahel Distribution SA',
          taxId: 'BF-OUA-2020-M-9999',
          legalInfo: 'Registre du Commerce IFU 00099988Z',
          city: 'Ouagadougou',
          address: 'Zone Industrielle de Kossodo',
        },
      },
      subscriptions: {
        create: {
          planId: planCommercant.id,
          endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Driver 1: Verified Driver
  const driverVerifiedUser = await prisma.user.create({
    data: {
      phone: '+226 70 12 34 56',
      email: 'ibrahim.sawadogo@gmail.com',
      passwordHash: defaultPassword,
      role: 'LIVREUR',
      subscriptions: {
        create: {
          planId: planLivreur.id,
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      profile: {
        create: {
          fullName: 'Ibrahim Sawadogo',
          city: 'Ouagadougou',
          address: 'Dassasgho, Secteur 28',
        },
      },
      driver: {
        create: {
          verificationStatus: 'VERIFIE',
          idCardNumber: 'B1234567890',
          totalDeliveries: 42,
          successfulDeliveries: 41,
          successRate: 97.6,
          ratingAvg: 4.9,
          ratingCount: 38,
          isAvailable: true,
          preferredZones: 'Ouaga-Centre, Ouaga 2000, Dassasgho',
          vehicles: {
            create: {
              vehicleType: 'MOTO',
              brand: 'YAMAHA',
              model: 'Nanfang 125',
              licensePlate: '11-JJ-4567',
              color: 'Rouge',
            },
          },
          documents: {
            createMany: {
              data: [
                {
                  docType: 'ID_CARD',
                  fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
                  status: 'VERIFIE',
                  reviewNotes: 'Document conforme et lisible.',
                },
                {
                  docType: 'DRIVING_LICENSE',
                  fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
                  status: 'VERIFIE',
                },
              ],
            },
          },
        },
      },
    },
  });

  // Driver 2: Second Verified Driver
  const driverVerifiedUser2 = await prisma.user.create({
    data: {
      phone: '+226 76 99 88 77',
      email: 'moussa.zongo@gmail.com',
      passwordHash: defaultPassword,
      role: 'LIVREUR',
      profile: {
        create: {
          fullName: 'Moussa Zongo',
          city: 'Ouagadougou',
          address: 'Tampouy, Secteur 21',
        },
      },
      driver: {
        create: {
          verificationStatus: 'VERIFIE',
          idCardNumber: 'B9876543210',
          totalDeliveries: 18,
          successfulDeliveries: 18,
          successRate: 100.0,
          ratingAvg: 4.8,
          ratingCount: 15,
          isAvailable: true,
          preferredZones: 'Kamboinse & Tampouy, Ouaga-Centre',
          vehicles: {
            create: {
              vehicleType: 'TRICYCLE',
              brand: 'KAVAKI',
              model: 'Tricycle Cargo 200cc',
              licensePlate: '11-KK-9876',
              color: 'Bleu',
            },
          },
        },
      },
    },
  });

  // Driver 3: Driver in Verification (Pending Admin Review)
  const driverPendingUser = await prisma.user.create({
    data: {
      phone: '+226 75 98 76 54',
      email: 'karim.traore@gmail.com',
      passwordHash: defaultPassword,
      role: 'LIVREUR',
      profile: {
        create: {
          fullName: 'Karim Traoré',
          city: 'Ouagadougou',
          address: 'Pissy, Secteur 17',
        },
      },
      driver: {
        create: {
          verificationStatus: 'EN_VERIFICATION',
          idCardNumber: 'B5554443332',
          totalDeliveries: 0,
          isAvailable: false,
          vehicles: {
            create: {
              vehicleType: 'MOTO',
              brand: 'HAOJUE',
              model: 'HJ 110',
              licensePlate: '11-HH-1122',
              color: 'Noire',
            },
          },
          documents: {
            create: {
              docType: 'ID_CARD',
              fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
              status: 'EN_VERIFICATION',
            },
          },
        },
      },
    },
  });

  // 7. Delivery Requests & Proposals
  const req1 = await prisma.deliveryRequest.create({
    data: {
      trackingNumber: 'LIV-2026-000101',
      customerId: particulierUser.id,
      pickupAddress: 'Zogona, pharmacie de la Paix',
      dropoffAddress: 'Ouaga 2000, près du canal de Décennal',
      packageType: 'Documents & Pli urgent',
      description: 'Enveloppe scellée contenant des documents administratifs importants.',
      quantity: 1,
      urgencyLevel: 'URGENT',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '14:30',
      additionalNotes: 'Demander M. Diallo à l\'arrivée.',
      status: 'PROPOSITIONS_RECUES',
    },
  });

  const prop1 = await prisma.deliveryProposal.create({
    data: {
      deliveryRequestId: req1.id,
      driverId: driverVerifiedUser.id,
      proposedPriceFcfa: 2000,
      estimatedDurationMinutes: 25,
      comment: 'Je suis actuellement à Zogona, je peux récupérer immédiatement.',
      status: 'PENDING',
    },
  });

  const prop2 = await prisma.deliveryProposal.create({
    data: {
      deliveryRequestId: req1.id,
      driverId: driverVerifiedUser2.id,
      proposedPriceFcfa: 1800,
      estimatedDurationMinutes: 35,
      comment: 'Disponible en 10 min.',
      status: 'PENDING',
    },
  });

  const req2 = await prisma.deliveryRequest.create({
    data: {
      trackingNumber: 'LIV-2026-000102',
      customerId: commercantUser.id,
      pickupAddress: 'Grand Marché Rood-Woko, Stand B12',
      dropoffAddress: 'Kamboinse, Cité Universitaire',
      packageType: 'Colis Vêtements & Chaussures',
      description: 'Carton de 3 paires de chaussures et 2 boubous traditionnels.',
      quantity: 1,
      urgencyLevel: 'NORMAL',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '11:00',
      status: 'EN_COURS_LIVRAISON',
    },
  });

  const propReq2 = await prisma.deliveryProposal.create({
    data: {
      deliveryRequestId: req2.id,
      driverId: driverVerifiedUser.id,
      proposedPriceFcfa: 2500,
      estimatedDurationMinutes: 40,
      status: 'ACCEPTED',
    },
  });

  const activeDelivery = await prisma.delivery.create({
    data: {
      trackingNumber: 'LIV-2026-000102',
      deliveryRequestId: req2.id,
      customerId: commercantUser.id,
      driverId: driverVerifiedUser.id,
      selectedProposalId: propReq2.id,
      agreedPriceFcfa: 2500,
      status: 'EN_COURS_LIVRAISON',
      pickedUpAt: new Date(Date.now() - 30 * 60 * 1000),
      codes: {
        create: {
          pickupCode: '4821',
          deliveryCode: '9134',
          pickupVerifiedAt: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
    },
  });

  await prisma.deliveryStatusHistory.createMany({
    data: [
      {
        deliveryId: activeDelivery.id,
        previousStatus: 'PROPOSITIONS_RECUES',
        newStatus: 'LIVREUR_SELECTIONNE',
        changedByUserId: commercantUser.id,
        note: 'Le client a sélectionné le livreur Ibrahim Sawadogo.',
      },
      {
        deliveryId: activeDelivery.id,
        previousStatus: 'LIVREUR_SELECTIONNE',
        newStatus: 'COLIS_RECUPERE',
        changedByUserId: driverVerifiedUser.id,
        note: 'Code OTP de récupération vérifié avec succès.',
      },
      {
        deliveryId: activeDelivery.id,
        previousStatus: 'COLIS_RECUPERE',
        newStatus: 'EN_COURS_LIVRAISON',
        changedByUserId: driverVerifiedUser.id,
        note: 'Colis en cours de transport vers Kamboinse.',
      },
    ],
  });

  const req3 = await prisma.deliveryRequest.create({
    data: {
      trackingNumber: 'LIV-2026-000099',
      customerId: entrepriseUser.id,
      pickupAddress: 'Kossodo, Zone Industrielle',
      dropoffAddress: 'Avenue Kwame N\'Krumah',
      packageType: 'Matériel Électronique',
      description: 'Lot de 5 imprimantes et cartouches d\'encre.',
      quantity: 5,
      urgencyLevel: 'NORMAL',
      scheduledDate: '2026-08-20',
      scheduledTime: '09:00',
      status: 'LIVRE',
    },
  });

  const propReq3 = await prisma.deliveryProposal.create({
    data: {
      deliveryRequestId: req3.id,
      driverId: driverVerifiedUser2.id,
      proposedPriceFcfa: 6000,
      estimatedDurationMinutes: 45,
      status: 'ACCEPTED',
    },
  });

  const completedDelivery = await prisma.delivery.create({
    data: {
      trackingNumber: 'LIV-2026-000099',
      deliveryRequestId: req3.id,
      customerId: entrepriseUser.id,
      driverId: driverVerifiedUser2.id,
      selectedProposalId: propReq3.id,
      agreedPriceFcfa: 6000,
      status: 'LIVRE',
      pickedUpAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      codes: {
        create: {
          pickupCode: '1234',
          deliveryCode: '5678',
          pickupVerifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          deliveryVerifiedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        },
      },
    },
  });

  await prisma.review.create({
    data: {
      deliveryId: completedDelivery.id,
      reviewerId: entrepriseUser.id,
      revieweeId: driverVerifiedUser2.id,
      rating: 5,
      punctualityRating: 5,
      communicationRating: 5,
      packageConditionRating: 5,
      comment: 'Superbe livraison en tricycle cargo, colis en parfait état !',
    },
  });

  // 8. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'DRIVER_VERIFICATION_APPROVED',
        targetEntity: 'Driver',
        targetId: driverVerifiedUser.id,
        detailsJson: JSON.stringify({ note: 'Validation des pièces d\'identité et permis par l\'admin' }),
      },
      {
        userId: commercantUser.id,
        action: 'DELIVERY_PROPOSAL_SELECTED',
        targetEntity: 'DeliveryRequest',
        targetId: req2.id,
        detailsJson: JSON.stringify({ agreedPriceFcfa: 2500, driverId: driverVerifiedUser.id }),
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Comptes de démonstration créés (mot de passe commun : password123) :');
  console.log('👑 Admin       : +226 70 00 00 00');
  console.log('👤 Particulier : +226 76 11 22 33');
  console.log('🏪 Commerçant  : +226 78 44 55 66');
  console.log('🏢 Entreprise  : +226 70 88 99 00');
  console.log('🛵 Livreur (Vérifié) : +226 70 12 34 56');
  console.log('🛵 Livreur (En cours KYC) : +226 75 98 76 54');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
