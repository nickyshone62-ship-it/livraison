import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = String(session.userId);

    // Fetch user with active and past subscriptions
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          where: { type: 'SUBSCRIPTION' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const activeSubscription = user.subscriptions.find((s) => s.status === 'ACTIVE') || user.subscriptions[0] || null;
    const now = new Date();

    let subscriptionDetail = null;

    if (activeSubscription) {
      const startsAt = new Date(activeSubscription.startsAt);
      const endsAt = new Date(activeSubscription.endsAt);
      const isExpired = endsAt < now;

      const totalDuration = Math.max(1, endsAt.getTime() - startsAt.getTime());
      const elapsed = Math.max(0, now.getTime() - startsAt.getTime());
      const daysRemaining = isExpired ? 0 : Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const progressPercentage = isExpired ? 100 : Math.min(100, Math.round((elapsed / totalDuration) * 100));

      subscriptionDetail = {
        id: activeSubscription.id,
        planName: activeSubscription.plan.name,
        code: activeSubscription.plan.code,
        priceFcfa: activeSubscription.plan.priceFcfa,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: isExpired ? 'EXPIRED' : activeSubscription.status,
        daysRemaining,
        progressPercentage,
      };
    }

    const pendingPayment = user.payments.find((p) => p.status === 'PENDING') || null;

    return NextResponse.json({
      currentSubscription: subscriptionDetail,
      pendingPayment: pendingPayment
        ? {
            id: pendingPayment.id,
            amountFcfa: pendingPayment.amountFcfa,
            paymentMethod: pendingPayment.paymentMethod,
            transactionReference: pendingPayment.transactionReference,
            createdAt: pendingPayment.createdAt,
          }
        : null,
      paymentHistory: user.payments.map((p) => ({
        id: p.id,
        amountFcfa: p.amountFcfa,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
