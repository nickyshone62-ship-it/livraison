import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { paymentMethod, userTxRef, payerPhone } = await req.json(); // ORANGE_MONEY, MOOV_MONEY, WAVE

    const user = await db.user.findUnique({
      where: { id: String(session.userId) },
      include: {
        profile: true,
        subscriptions: {
          orderBy: { endsAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const renewalFeeFcfa = user.role === 'LIVREUR' ? 500 : 1000;
    const now = new Date();
    
    // Calculate new endsAt: if currently active, add 30 days from existing endsAt; if expired, add 30 days from now
    const currentEnd = user.subscriptions[0] && new Date(user.subscriptions[0].endsAt) > now
      ? new Date(user.subscriptions[0].endsAt)
      : now;

    const newEndsAt = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find or get default plan
    let plan = await db.subscriptionPlan.findFirst({
      where: { code: user.role === 'LIVREUR' ? 'LIVREUR' : 'COMMERCANT' },
    });

    if (!plan) {
      plan = await db.subscriptionPlan.create({
        data: {
          code: user.role === 'LIVREUR' ? 'LIVREUR' : 'COMMERCANT',
          name: user.role === 'LIVREUR' ? 'Plan Livreur Mensuel' : 'Plan Boutique Mensuel',
          priceFcfa: renewalFeeFcfa,
          durationDays: 30,
        },
      });
    }

    // Create pending payment record awaiting Admin validation
    const formattedPayerPhone = payerPhone || user.phone;
    const transactionRef = userTxRef
      ? `ID: ${userTxRef.trim()} (Expéditeur: ${formattedPayerPhone})`
      : `SUB-RENEW-${Date.now()} (Tél: ${formattedPayerPhone})`;

    const newPayment = await db.payment.create({
      data: {
        userId: user.id,
        type: 'SUBSCRIPTION',
        amountFcfa: renewalFeeFcfa,
        paymentMethod: paymentMethod || 'ORANGE_MONEY',
        transactionReference: transactionRef,
        status: 'PENDING',
      },
    });

    // Notify all Admin users
    const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } });
    const userRoleLabel = user.role === 'LIVREUR' ? 'Livreur' : 'Boutique / Commerçant';

    if (adminUsers.length > 0) {
      await db.notification.createMany({
        data: adminUsers.map((admin) => ({
          userId: admin.id,
          title: '📢 NOUVEAU PAIEMENT D\'ABONNEMENT À VALIDER !',
          message: `L'utilisateur ${user.profile?.fullName || user.phone} (${userRoleLabel}, inscrit le ${new Date(user.createdAt).toLocaleDateString('fr-FR')}) a soumis un paiement de ${renewalFeeFcfa} FCFA via ${paymentMethod || 'Mobile Money'}. Réf: ${transactionRef}.`,
          type: 'PAYMENT',
        })),
      });
    }

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'SUBSCRIPTION_RENEWAL_SUBMITTED',
        targetEntity: 'Payment',
        targetId: newPayment.id,
        detailsJson: JSON.stringify({ renewalFeeFcfa, paymentMethod, transactionRef }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Paiement d'abonnement de ${renewalFeeFcfa} FCFA soumis avec succès ! L'administrateur a reçu la notification pour valider votre compte.`,
      payment: newPayment,
      pendingValidation: true,
    });
  } catch (error: any) {
    console.error('Subscription renewal error:', error);
    return NextResponse.json({ error: 'Erreur lors du renouvellement de l\'abonnement' }, { status: 500 });
  }
}
