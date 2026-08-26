import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = String(session.userId);

    const profile = await db.profile.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          where: { paymentType: 'monthly_subscription' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const activeSubscription = profile.subscriptions.find((s) => s.status === 'active') || profile.subscriptions[0] || null;

    return NextResponse.json({
      currentSubscription: activeSubscription,
      payments: profile.payments,
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
