const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepAudit() {
  console.log('====================================================');
  console.log('🔍 INVENTAIRE ET AUDIT ULTRA-DÉTAILLÉ SUPABASE');
  console.log('====================================================\n');

  try {
    // 1. Audit complet des Utilisateurs & Sécurité
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        driver: {
          include: { vehicles: true, documents: true },
        },
        subscriptions: { include: { plan: true } },
        deliveryRequests: true,
        customerDeliveries: true,
        driverDeliveries: true,
      },
    });

    console.log(`📌 TOTAL UTILISATEURS : ${users.length}`);

    const report = {
      usersSummary: [],
      securityIssues: [],
      kycIssues: [],
      dataIntegrityIssues: [],
    };

    for (const u of users) {
      const summary = {
        id: u.id,
        phone: u.phone,
        email: u.email || 'N/A',
        role: u.role,
        approvalStatus: u.approvalStatus,
        isActive: u.isActive,
        hasPasswordHash: !!u.passwordHash,
        isBcrypt: u.passwordHash?.startsWith('$2a$') || u.passwordHash?.startsWith('$2b$'),
        fullName: u.profile?.fullName || 'MANQUANT',
        companyName: u.profile?.companyName || 'N/A',
        taxId: u.profile?.taxId || 'N/A',
        hasDriverRecord: !!u.driver,
        driverStatus: u.driver?.verificationStatus || 'N/A',
        vehiclesCount: u.driver?.vehicles?.length || 0,
        docsCount: u.driver?.documents?.length || 0,
        activeSubscriptionsCount: u.subscriptions?.filter(s => s.status === 'ACTIVE').length || 0,
      };

      report.usersSummary.push(summary);

      // Sécurité : Mot de passe non haché ou vide
      if (!u.passwordHash) {
        report.securityIssues.push(`Mot de passe MANQUANT pour l'utilisateur ${u.phone} (${u.id})`);
      } else if (!summary.isBcrypt) {
        report.securityIssues.push(`Mot de passe en CLAIR ou format non-bcrypt pour l'utilisateur ${u.phone}`);
      }

      // Rôle et Driver
      if (u.role === 'LIVREUR' && !u.driver) {
        report.kycIssues.push(`Utilisateur ${u.phone} a le rôle LIVREUR mais n'a AUCUN profil Driver dans la table Driver.`);
      }
      if (u.role !== 'LIVREUR' && u.driver) {
        report.kycIssues.push(`Utilisateur ${u.phone} (rôle ${u.role}) a une fiche Driver associée alors qu'il n'est pas livreur.`);
      }

      // Incohérence des statuts d'approbation et activité
      if (u.approvalStatus === 'PENDING' && u.isActive) {
        report.dataIntegrityIssues.push(`Utilisateur ${u.phone} : PENDING mais isActive=true (Règle 1 enfreinte)`);
      }
      if (u.approvalStatus === 'REJECTED' && u.isActive) {
        report.dataIntegrityIssues.push(`Utilisateur ${u.phone} : REJECTED mais isActive=true (Règle 5 enfreinte)`);
      }
      if (u.approvalStatus === 'APPROVED' && !u.isActive) {
        report.dataIntegrityIssues.push(`Utilisateur ${u.phone} : APPROVED mais isActive=false (Compte bloqué)`);
      }
    }

    // 2. Audit des Livreurs & Documents
    const drivers = await prisma.driver.findMany({
      include: { user: { include: { profile: true } }, vehicles: true, documents: true },
    });
    console.log(`📌 TOTAL LIVREURS (Fiches Driver) : ${drivers.length}`);

    for (const d of drivers) {
      if (!d.user) {
        report.dataIntegrityIssues.push(`Fiche Driver ${d.id} est ORPHELINE (aucun User associé)`);
      }
      if (d.vehicles.length === 0) {
        report.kycIssues.push(`Livreur ${d.user?.phone || d.id} n'a aucun véhicule enregistré dans la table Vehicle`);
      }
    }

    // 3. Audit des Demandes & Livraisons
    const requests = await prisma.deliveryRequest.findMany({
      include: { customer: true, delivery: { include: { codes: true } }, proposals: true },
    });
    console.log(`📌 TOTAL DEMANDES DE LIVRAISON : ${requests.length}`);

    for (const r of requests) {
      if (!r.customer) {
        report.dataIntegrityIssues.push(`Demande ${r.trackingNumber} : customerId ${r.customerId} est introuvable`);
      }
      if (r.delivery) {
        if (!r.delivery.codes) {
          report.dataIntegrityIssues.push(`Livraison ${r.delivery.trackingNumber} n'a pas de codes OTP (table DeliveryCode manquant)`);
        }
      }
    }

    // 4. Audit des Abonnements & Paiements
    const subs = await prisma.subscription.findMany({ include: { user: true, plan: true } });
    console.log(`📌 TOTAL ABONNEMENTS : ${subs.length}`);
    for (const s of subs) {
      if (!s.user) {
        report.dataIntegrityIssues.push(`Abonnement ${s.id} pointe vers un userId introuvable (${s.userId})`);
      }
      if (!s.plan) {
        report.dataIntegrityIssues.push(`Abonnement ${s.id} pointe vers un planId introuvable (${s.planId})`);
      }
    }

    const payments = await prisma.payment.findMany({ include: { user: true } });
    console.log(`📌 TOTAL PAIEMENTS : ${payments.length}`);

    const disputes = await prisma.dispute.findMany();
    console.log(`📌 TOTAL LITIGES : ${disputes.length}`);

    const notifications = await prisma.notification.findMany();
    console.log(`📌 TOTAL NOTIFICATIONS : ${notifications.length}`);

    const auditLogs = await prisma.auditLog.findMany();
    console.log(`📌 TOTAL AUDIT LOGS : ${auditLogs.length}`);

    console.log('\n====================================================');
    console.log('📋 DETAIL DES UTILISATEURS SUR SUPABASE');
    console.log('====================================================');
    console.table(report.usersSummary);

    console.log('\n====================================================');
    console.log('🚨 ANOMALIES & POINTS D\'ATTENTION DÉTECTÉS');
    console.log('====================================================');

    console.log('\n--- 1. Sécurité & Mots de Passe ---');
    if (report.securityIssues.length === 0) console.log('✅ Tous les mots de passe sont hachés en bcrypt.');
    else console.log(report.securityIssues);

    console.log('\n--- 2. KYC & Profils Livreurs ---');
    if (report.kycIssues.length === 0) console.log('✅ Fiches livreurs et véhicules conformes.');
    else console.log(report.kycIssues);

    console.log('\n--- 3. Intégrité des Données & Statuts ---');
    if (report.dataIntegrityIssues.length === 0) console.log('✅ Aucune incohérence d\'intégrité détectée.');
    else console.log(report.dataIntegrityIssues);

  } catch (err) {
    console.error('❌ Erreur lors de l\'audit approfondi Supabase :', err);
  } finally {
    await prisma.$disconnect();
  }
}

deepAudit();
