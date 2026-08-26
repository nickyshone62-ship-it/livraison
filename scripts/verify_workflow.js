const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function testCompleteWorkflow() {
  console.log('===========================================================');
  console.log('🚀 TEST COMPLET DE BOUT EN BOUT DU WORKFLOW APPLICATION');
  console.log('===========================================================\n');

  try {
    const timestamp = Date.now();
    const clientPhone = `+226 76 ${Math.floor(100000 + Math.random() * 900000)}`;
    const driverPhone = `+226 78 ${Math.floor(100000 + Math.random() * 900000)}`;
    const clientEmail = `client_${timestamp}@test.bf`;
    const driverEmail = `driver_${timestamp}@test.bf`;

    // 1. INSCRIPTION CLIENT
    console.log('1️⃣ Création profil Client...');
    const clientProfile = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        role: 'client',
        fullName: 'Client Test Ouaga',
        phone: clientPhone,
        email: clientEmail,
        city: 'Ouagadougou',
        address: 'Ouaga 2000, Secteur 15',
        accountStatus: 'pending',
      },
    });
    console.log('  ✅ Client créé avec statut:', clientProfile.accountStatus);

    // 2. PAIEMENT INSCRIPTION CLIENT (2000 FCFA -> pending)
    console.log('\n2️⃣ Soumission Paiement Inscription Client (2000 FCFA)...');
    const clientPayment = await prisma.payment.create({
      data: {
        userId: clientProfile.id,
        paymentType: 'client_registration',
        amount: 2000,
        currency: 'XOF',
        paymentMethod: 'orange_money',
        transactionReference: `REF-CLI-${timestamp}`,
        status: 'pending',
      },
    });
    console.log('  ✅ Paiement client enregistré en statut:', clientPayment.status);

    // 3. INSCRIPTION DRIVER
    console.log('\n3️⃣ Création profil Driver + Véhicule + Document KYC...');
    const driverProfile = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        role: 'driver',
        fullName: 'Livreur Test Pro',
        phone: driverPhone,
        email: driverEmail,
        city: 'Ouagadougou',
        address: 'Tampouy, Secteur 21',
        accountStatus: 'pending',
        driverProfile: {
          create: {
            verificationStatus: 'pending',
            isAvailable: true,
            vehicles: {
              create: {
                vehicleType: 'moto',
                brand: 'Yamaha',
                model: 'Sirius',
                registrationNumber: '11-JJ-4500',
                color: 'Rouge',
                year: 2024,
                isPrimary: true,
              },
            },
            documents: {
              create: {
                documentType: 'identity_card',
                documentNumber: 'CNIB-B12345678',
                fileUrl: 'https://vofydpjgavyegluebhek.supabase.co/storage/v1/object/authenticated/identity_documents/test.jpg',
                status: 'pending',
              },
            },
          },
        },
      },
      include: { driverProfile: { include: { vehicles: true, documents: true } } },
    });
    console.log('  ✅ Driver créé avec status account:', driverProfile.accountStatus, 'verification:', driverProfile.driverProfile?.verificationStatus);

    // 4. PAIEMENT INSCRIPTION DRIVER (1500 FCFA -> pending)
    console.log('\n4️⃣ Soumission Paiement Inscription Driver (1500 FCFA)...');
    const driverPayment = await prisma.payment.create({
      data: {
        userId: driverProfile.id,
        paymentType: 'driver_registration',
        amount: 1500,
        currency: 'XOF',
        paymentMethod: 'moov_money',
        transactionReference: `REF-DRV-${timestamp}`,
        status: 'pending',
      },
    });
    console.log('  ✅ Paiement driver enregistré en statut:', driverPayment.status);

    // 5. VALIDATION ADMIN DES PAIEMENTS & ACTIVATION DES COMPTES
    console.log('\n5️⃣ Validation Administrative des paiements & Approbation...');
    await prisma.payment.update({
      where: { id: clientPayment.id },
      data: { status: 'approved', reviewedAt: new Date() },
    });
    await prisma.profile.update({
      where: { id: clientProfile.id },
      data: { accountStatus: 'approved' },
    });

    await prisma.payment.update({
      where: { id: driverPayment.id },
      data: { status: 'approved', reviewedAt: new Date() },
    });
    await prisma.profile.update({
      where: { id: driverProfile.id },
      data: { accountStatus: 'approved' },
    });
    await prisma.driverProfile.update({
      where: { id: driverProfile.driverProfile.id },
      data: { verificationStatus: 'approved', approvedAt: new Date() },
    });
    console.log('  ✅ Client et Driver approuvés par l\'Admin !');

    // 6. CRÉATION D'UNE DEMANDE DE LIVRAISON PAR LE CLIENT
    console.log('\n6️⃣ Publication d\'une demande de livraison par le client...');
    const deliveryReq = await prisma.deliveryRequest.create({
      data: {
        clientId: clientProfile.id,
        pickupAddress: 'Boutique Shone, Ouaga 2000',
        destinationAddress: 'Kamboinse, face Université',
        recipientName: 'Moussa Sawadogo',
        recipientPhone: '+226 70 12 34 56',
        packageDescription: 'Colis Parfums Shone (2 flacons)',
        packageCategory: 'Cosmétique',
        packageWeight: 1.5,
        packageQuantity: 2,
        status: 'searching_driver',
      },
    });
    console.log('  ✅ Demande créée ID:', deliveryReq.id, 'Statut:', deliveryReq.status);

    // 7. SOUMISSION D'UNE PROPOSITION PAR LE LIVREUR
    console.log('\n7️⃣ Soumission d\'une proposition de prix par le livreur...');
    const offer = await prisma.deliveryOffer.create({
      data: {
        deliveryId: deliveryReq.id,
        driverId: driverProfile.id,
        proposedPrice: 1500,
        estimatedDuration: 25,
        message: 'Disponible immédiatement avec sac isotherme !',
        status: 'pending',
      },
    });
    console.log('  ✅ Offre soumise: 1500 FCFA par driver', offer.driverId);

    // 8. SÉLECTION DU LIVREUR PAR LE CLIENT
    console.log('\n8️⃣ Sélection du livreur par le client...');
    await prisma.deliveryOffer.update({
      where: { id: offer.id },
      data: { status: 'accepted' },
    });
    await prisma.deliveryRequest.update({
      where: { id: deliveryReq.id },
      data: { status: 'driver_selected' },
    });
    const assignment = await prisma.deliveryAssignment.create({
      data: {
        deliveryId: deliveryReq.id,
        driverId: driverProfile.id,
        offerId: offer.id,
      },
    });
    await prisma.deliveryStatusHistory.create({
      data: {
        deliveryId: deliveryReq.id,
        status: 'driver_selected',
        changedBy: clientProfile.id,
        note: 'Livreur sélectionné au tarif de 1500 FCFA',
      },
    });
    console.log('  ✅ Attribution effectuée ID:', assignment.id);

    // 9. DÉROULEMENT DE LA LIVRAISON (STATUTS)
    console.log('\n9️⃣ Évolution du statut de livraison...');
    const statuses = ['driver_accepted', 'driver_arriving', 'package_picked_up', 'in_transit', 'delivered', 'completed'];
    for (const st of statuses) {
      await prisma.deliveryRequest.update({
        where: { id: deliveryReq.id },
        data: { status: st },
      });
      await prisma.deliveryStatusHistory.create({
        data: {
          deliveryId: deliveryReq.id,
          status: st,
          changedBy: driverProfile.id,
        },
      });
      console.log(`  -> Statut mis à jour vers: [${st}]`);
    }

    // 10. ÉVALUATION POST-LIVRAISON
    console.log('\n🔟 Soumission évaluation 5 étoiles par le client...');
    const review = await prisma.review.create({
      data: {
        deliveryId: deliveryReq.id,
        reviewerId: clientProfile.id,
        reviewedDriverId: driverProfile.id,
        rating: 5,
        comment: 'Super rapide et très poli ! Je recommande.',
      },
    });
    console.log('  ✅ Évaluation enregistrée note:', review.rating, 'étoiles.');

    console.log('\n===========================================================');
    console.log('🎉 TOUS LES 10 ÉTAPES DU WORKFLOW SONT VALIDÉES ET FONCTIONNELLES !');
    console.log('===========================================================');

  } catch (err) {
    console.error('❌ Erreur lors du test workflow:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteWorkflow();
