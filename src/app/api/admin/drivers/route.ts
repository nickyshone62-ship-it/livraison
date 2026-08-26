import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const drivers = await db.driverProfile.findMany({
      include: {
        profile: true,
        vehicles: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ drivers });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors du chargement des livreurs' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { driverId, action, reviewNotes } = await req.json();

    if (!driverId || !action) {
      return NextResponse.json({ error: 'ID du livreur et action requis' }, { status: 400 });
    }

    const newStatus = action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : 'approved';

    const driver = await db.driverProfile.update({
      where: { id: driverId },
      data: {
        verificationStatus: newStatus,
        rejectionReason: action === 'reject' ? (reviewNotes || 'Documents non conformes') : null,
        approvedAt: newStatus === 'approved' ? new Date() : undefined,
        approvedBy: newStatus === 'approved' ? session.userId : undefined,
      },
    });

    if (newStatus === 'approved') {
      await db.profile.update({
        where: { id: driver.userId },
        data: { accountStatus: 'approved' },
      });
    }

    await db.notification.create({
      data: {
        userId: driver.userId,
        title: newStatus === 'approved' ? '✅ Compte Vérifié !' : '⚠️ Mise à jour de votre compte',
        message: newStatus === 'approved' ? 'Votre profil de livreur a été vérifié et approuvé par l\'administration.' : `Statut mis à jour vers : ${newStatus}`,
        type: 'account',
      },
    });

    await db.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: `DRIVER_VERIFY_${action.toUpperCase()}`,
        targetTable: 'driver_profiles',
        targetId: driverId,
        newData: { verificationStatus: newStatus },
      },
    });

    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    console.error('Error updating driver verification:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
