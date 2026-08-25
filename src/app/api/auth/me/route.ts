import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: String(session.userId) },
      include: {
        profile: true,
        driver: {
          include: {
            vehicles: true,
            documents: true,
          },
        },
        subscriptions: {
          include: { plan: true },
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!user) {
      if (session.role === 'ADMIN') {
        return NextResponse.json({
          user: {
            id: session.userId || 'admin-root',
            phone: session.phone || '+226 06 88 73 30',
            email: 'admin@livraisonouaga.bf',
            role: 'ADMIN',
            isActive: true,
            profile: {
              fullName: session.fullName || 'Super Administrateur Nick',
              city: 'Ouagadougou',
            },
            driver: null,
            activeSubscription: null,
            isSubscriptionActive: true,
            daysRemaining: 9999,
            pendingPayment: null,
          },
        });
      }
      return NextResponse.json({ user: null }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && (user.approvalStatus !== 'APPROVED' || !user.isActive)) {
      return NextResponse.json({
        user: null,
        error: user.approvalStatus === 'REJECTED'
          ? "Votre inscription a été refusée."
          : "Votre compte est en attente d'approbation par l'administrateur.",
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
      }, { status: 403 });
    }

    const latestSub = user.subscriptions[0] || null;
    const now = new Date();
    const isSubActive = latestSub ? new Date(latestSub.endsAt) > now : false;
    const daysRemaining = latestSub ? Math.max(0, Math.ceil((new Date(latestSub.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    const pendingPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        type: 'SUBSCRIPTION',
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        approvalStatus: user.approvalStatus,
        profile: user.profile,
        driver: user.driver,
        activeSubscription: latestSub,
        isSubscriptionActive: isSubActive,
        daysRemaining: daysRemaining,
        pendingPayment: pendingPayment || null,
      },
    });
    res.headers.set('Cache-Control', 'private, max-age=3, stale-while-revalidate=5');
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la récupération du profil' }, { status: 500 });
  }
}
