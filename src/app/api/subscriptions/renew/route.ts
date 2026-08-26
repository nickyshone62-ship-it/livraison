import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { initiateUserPayment } from '@/lib/payments';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { paymentMethod, userTxRef, payerPhone } = await req.json();

    const profile = await db.profile.findUnique({
      where: { id: session.userId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const result = await initiateUserPayment({
      userId: session.userId,
      paymentType: 'monthly_subscription',
      amount: 1000,
      paymentMethod: paymentMethod || 'orange_money',
      recipientPhone: payerPhone || profile.phone || undefined,
      transactionReference: userTxRef || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Subscription renewal error:', error);
    return NextResponse.json({ error: 'Erreur lors du renouvellement de l\'abonnement' }, { status: 500 });
  }
}
