import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const payments = await db.payment.findMany({
      include: {
        user: {
          include: {
            profile: true,
            driver: true,
            subscriptions: {
              orderBy: { endsAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des paiements' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { paymentId, action } = await req.json(); // action: 'APPROVE' | 'REJECT'

    if (!paymentId || !action) {
      return NextResponse.json({ error: 'Identifiant du paiement et action requis' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          include: {
            subscriptions: {
              orderBy: { endsAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'APPROVE') {
      // 1. Mark payment COMPLETED
      await db.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED' },
      });

      // 2. Extend subscription by 30 days
      const lastSubEnd = payment.user.subscriptions[0] && new Date(payment.user.subscriptions[0].endsAt) > now
        ? new Date(payment.user.subscriptions[0].endsAt)
        : now;

      const newEndsAt = new Date(lastSubEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

      const planCode = payment.user.role === 'LIVREUR' ? 'LIVREUR' : 'COMMERCANT';
      let plan = await db.subscriptionPlan.findFirst({ where: { code: planCode } });

      if (!plan) {
        plan = await db.subscriptionPlan.create({
          data: {
            code: planCode,
            name: payment.user.role === 'LIVREUR' ? 'Plan Livreur Mensuel' : 'Plan Boutique Mensuel',
            priceFcfa: payment.amountFcfa,
            durationDays: 30,
          },
        });
      }

      await db.subscription.create({
        data: {
          userId: payment.userId,
          planId: plan.id,
          status: 'ACTIVE',
          startsAt: now,
          endsAt: newEndsAt,
        },
      });

      // 3. Notify user
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Abonnement Mensuel Validé par l\'Admin !',
          message: `Votre paiement de ${payment.amountFcfa} FCFA a été vérifié et approuvé par l'administrateur. Votre abonnement est actif jusqu'au ${newEndsAt.toLocaleDateString('fr-FR')}.`,
          type: 'PAYMENT',
        },
      });

      // 4. Audit Log
      await db.auditLog.create({
        data: {
          userId: String(session.userId),
          action: 'APPROVE_SUBSCRIPTION_PAYMENT',
          targetEntity: 'Payment',
          targetId: paymentId,
          detailsJson: JSON.stringify({ amountFcfa: payment.amountFcfa, newEndsAt }),
        },
      });

      return NextResponse.json({ success: true, message: 'Paiement d\'abonnement approuvé et activé avec succès !' });
    }

    if (action === 'REJECT') {
      await db.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      });

      await db.notification.create({
        data: {
          userId: payment.userId,
          title: '❌ Paiement d\'abonnement rejeté',
          message: `Votre demande de paiement d'abonnement de ${payment.amountFcfa} FCFA a été rejetée par l'administrateur. Veuillez contacter le support.`,
          type: 'PAYMENT',
        },
      });

      await db.auditLog.create({
        data: {
          userId: String(session.userId),
          action: 'REJECT_SUBSCRIPTION_PAYMENT',
          targetEntity: 'Payment',
          targetId: paymentId,
        },
      });

      return NextResponse.json({ success: true, message: 'Paiement d\'abonnement rejeté.' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating admin payment:', error);
    return NextResponse.json({ error: 'Erreur lors de la validation du paiement' }, { status: 500 });
  }
}
