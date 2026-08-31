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
          where: { paymentType: 'subscription' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const now = new Date();

    // Find all active subscriptions with expiresAt in the future
    const activeSubs = profile.subscriptions.filter(
      (s) => s.status === 'active' && s.expiresAt && new Date(s.expiresAt) > now
    );

    // Sort by expiresAt descending to find furthest future expiration date
    activeSubs.sort((a, b) => new Date(b.expiresAt!).getTime() - new Date(a.expiresAt!).getTime());

    const activeSubscription = activeSubs[0] || profile.subscriptions[0] || null;

    let daysLeft = 0;
    let hoursLeft = 0;
    let isSubActive = false;
    let expiresAtFormatted = '';

    if (activeSubscription && activeSubscription.expiresAt) {
      const expDate = new Date(activeSubscription.expiresAt);
      if (expDate > now) {
        isSubActive = true;
        const diffMs = expDate.getTime() - now.getTime();
        daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        expiresAtFormatted = expDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    return NextResponse.json({
      currentSubscription: activeSubscription,
      activeSubscriptions: activeSubs,
      isSubActive,
      daysLeft,
      hoursLeft,
      expiresAtFormatted,
      subscriptions: profile.subscriptions,
      payments: profile.payments,
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
