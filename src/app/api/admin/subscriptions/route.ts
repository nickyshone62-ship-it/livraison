import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const subscriptions = await db.subscription.findMany({
      include: {
        user: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors du chargement des abonnements' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { userId, months = 1 } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'Identifiant utilisateur requis' }, { status: 400 });
    }

    const startsAt = new Date();
    const expiresAt = new Date(Date.now() + (months * 30 * 24 * 60 * 60 * 1000));

    // Deactivate old active subscriptions for user
    await db.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'expired' },
    });

    const subscription = await db.subscription.create({
      data: {
        userId,
        amount: 1000 * months,
        currency: 'XOF',
        status: 'active',
        startsAt,
        expiresAt,
        approvedBy: session.userId,
        approvedAt: startsAt,
      },
    });

    // Create notification for user
    await db.notification.create({
      data: {
        userId,
        title: '🎉 ABONNEMENT ACTIVÉ PAR L\'ADMIN',
        message: `Félicitations ! Votre abonnement de ${months} mois a été activé par l'administration. Valide jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
        type: 'subscription',
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
      message: `Abonnement activé avec succès pour cet utilisateur jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
    });
  } catch (error: any) {
    console.error('Erreur activation abonnement admin:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'activation de l\'abonnement' }, { status: 500 });
  }
}
