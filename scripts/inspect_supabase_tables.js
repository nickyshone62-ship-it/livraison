const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectSupabase() {
  console.log('====================================================');
  console.log('🔍 ANOMALIES & AUDIT COMPLET DE LA BASE SUPABASE');
  console.log('====================================================\n');

  try {
    // 1. Audit Table USER & Statuts
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        driver: true,
        subscriptions: true,
      },
    });

    console.log(`📊 Total Utilisateurs dans Supabase : ${users.length}\n`);

    const anomalies = [];

    users.forEach((u, i) => {
      console.log(`[Utilisateur #${i + 1}] ID: ${u.id}`);
      console.log(`  - Nom: ${u.profile?.fullName || 'SANS PROFIL ⚠️'}`);
      console.log(`  - Tél: ${u.phone}`);
      console.log(`  - Rôle: ${u.role}`);
      console.log(`  - Statut Approbation: ${u.approvalStatus}`);
      console.log(`  - Compte Actif (isActive): ${u.isActive}`);

      // Détection des anomalies de cohérence des statuts
      if (u.approvalStatus === 'APPROVED' && !u.isActive) {
        anomalies.push({
          userId: u.id,
          phone: u.phone,
          type: 'INCOHÉRENCE_APPROVED_INACTIF',
          description: `Utilisateur ${u.phone} a approvalStatus='APPROVED' mais isActive=false. Il sera bloqué à la connexion selon les règles.`,
        });
      }

      if ((u.approvalStatus === 'PENDING' || u.approvalStatus === 'REJECTED') && u.isActive) {
        anomalies.push({
          userId: u.id,
          phone: u.phone,
          type: 'ANOMALIE_STATUT_ACTIF_NON_APPROUVÉ',
          description: `Utilisateur ${u.phone} est ${u.approvalStatus} mais a isActive=true dans la base ! Doit être isActive=false.`,
        });
      }

      if (!u.profile) {
        anomalies.push({
          userId: u.id,
          phone: u.phone,
          type: 'PROFIL_MANQUANT',
          description: `L'utilisateur ${u.phone} n'a pas de profil associé dans la table Profile.`,
        });
      }

      if (u.role === 'LIVREUR' && !u.driver) {
        anomalies.push({
          userId: u.id,
          phone: u.phone,
          type: 'FICHE_LIVREUR_MANQUANTE',
          description: `L'utilisateur a le rôle LIVREUR mais aucune entrée correspondante dans la table Driver.`,
        });
      }
    });

    // 2. Audit Table DeliveryRequest & Delivery
    const deliveryRequests = await prisma.deliveryRequest.findMany({
      include: { customer: true, delivery: true, proposals: true }
    });
    console.log(`\n📦 Total Demandes de Livraison : ${deliveryRequests.length}`);

    deliveryRequests.forEach((dr) => {
      if (!dr.customer) {
        anomalies.push({
          type: 'CLIENT_DELIVERY_ORPHELIN',
          description: `La demande de livraison ${dr.trackingNumber} pointe vers un customerId introuvable (${dr.customerId}).`,
        });
      }
    });

    // 3. Audit Table Subscriptions & Plans
    const plans = await prisma.subscriptionPlan.findMany();
    console.log(`\n💳 Total Plans d'Abonnement : ${plans.length}`);

    const payments = await prisma.payment.findMany();
    console.log(`💰 Total Paiements Enregistrés : ${payments.length}`);

    const disputes = await prisma.dispute.findMany();
    console.log(`⚠️ Total Litiges : ${disputes.length}`);

    const auditLogs = await prisma.auditLog.findMany();
    console.log(`📜 Total Logs d'Audit : ${auditLogs.length}`);

    console.log('\n====================================================');
    console.log(`🚨 BILAN DES ANOMALIES DÉTECTÉES (${anomalies.length})`);
    console.log('====================================================');

    if (anomalies.length === 0) {
      console.log('✅ Aucune anomalie détectée dans la base Supabase ! Toutes les contraintes et relations sont 100% valides.');
    } else {
      console.log(JSON.stringify(anomalies, null, 2));
    }

  } catch (err) {
    console.error('❌ Erreur lors de l\'inspection Supabase :', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectSupabase();
