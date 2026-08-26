import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
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
      openReports,
      activeSubscriptionsCount,
    ] = await Promise.all([
      db.profile.count(),
      db.driverProfile.count(),
      db.driverProfile.count({ where: { verificationStatus: 'approved' } }),
      db.driverProfile.count({ where: { verificationStatus: 'pending' } }),
      db.deliveryRequest.count(),
      db.deliveryRequest.count({ where: { status: 'completed' } }),
      db.deliveryRequest.count({ where: { status: { notIn: ['completed', 'cancelled', 'failed'] } } }),
      db.report.count({ where: { status: 'pending' } }),
      db.subscription.count({ where: { status: 'active' } }),
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
        openReports,
        activeSubscriptionsCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors du calcul des statistiques' }, { status: 500 });
  }
}
