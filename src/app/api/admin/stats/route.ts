import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const [
      totalUsers,
      totalDrivers,
      verifiedDrivers,
      pendingDrivers,
      totalDeliveries,
      completedDeliveries,
      activeDeliveries,
      openDisputes,
      totalAgreedPrice,
      activeSubscriptionsCount,
    ] = await Promise.all([
      db.user.count(),
      db.driver.count(),
      db.driver.count({ where: { verificationStatus: 'VERIFIE' } }),
      db.driver.count({ where: { verificationStatus: 'EN_VERIFICATION' } }),
      db.deliveryRequest.count(),
      db.deliveryRequest.count({ where: { status: 'LIVRE' } }),
      db.deliveryRequest.count({ where: { status: { in: ['EN_COURS_LIVRAISON', 'COLIS_RECUPERE', 'LIVREUR_SELECTIONNE'] } } }),
      db.dispute.count({ where: { status: 'OUVERT' } }),
      db.delivery.aggregate({
        _sum: { agreedPriceFcfa: true },
        where: { status: 'LIVRE' },
      }),
      db.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDrivers,
        verifiedDrivers,
        pendingDrivers,
        totalDeliveries,
        completedDeliveries,
        activeDeliveries,
        openDisputes,
        activeSubscriptionsCount,
        totalVolumeFcfa: totalAgreedPrice._sum.agreedPriceFcfa || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors du calcul des statistiques' }, { status: 500 });
  }
}
