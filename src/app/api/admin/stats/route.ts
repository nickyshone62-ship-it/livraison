import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const totalUsers = await db.user.count();
    const totalDrivers = await db.driver.count();
    const verifiedDrivers = await db.driver.count({ where: { verificationStatus: 'VERIFIE' } });
    const pendingDrivers = await db.driver.count({ where: { verificationStatus: 'EN_VERIFICATION' } });
    
    const totalDeliveries = await db.deliveryRequest.count();
    const completedDeliveries = await db.deliveryRequest.count({ where: { status: 'LIVRE' } });
    const activeDeliveries = await db.deliveryRequest.count({ where: { status: { in: ['EN_COURS_LIVRAISON', 'COLIS_RECUPERE', 'LIVREUR_SELECTIONNE'] } } });
    const openDisputes = await db.dispute.count({ where: { status: 'OUVERT' } });

    const totalAgreedPrice = await db.delivery.aggregate({
      _sum: { agreedPriceFcfa: true },
      where: { status: 'LIVRE' },
    });

    const activeSubscriptionsCount = await db.subscription.count({ where: { status: 'ACTIVE' } });

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
