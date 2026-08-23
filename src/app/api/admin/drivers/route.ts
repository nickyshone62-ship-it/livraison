import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const drivers = await db.driver.findMany({
      include: {
        user: { include: { profile: true } },
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
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { driverId, action, reviewNotes } = await req.json(); // action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'START_VERIFICATION' | 'SET_PENDING'

    if (!driverId || !action) {
      return NextResponse.json({ error: 'ID du livreur et action requis' }, { status: 400 });
    }

    let newStatus: 'EN_ATTENTE' | 'EN_VERIFICATION' | 'VERIFIE' | 'REJETE' | 'SUSPENDU' = 'VERIFIE';
    if (action === 'REJECT') newStatus = 'REJETE';
    if (action === 'SUSPEND') newStatus = 'SUSPENDU';
    if (action === 'START_VERIFICATION') newStatus = 'EN_VERIFICATION';
    if (action === 'SET_PENDING') newStatus = 'EN_ATTENTE';
    if (action === 'APPROVE' || action === 'REACTIVATE') newStatus = 'VERIFIE';

    const driver = await db.driver.update({
      where: { id: driverId },
      data: {
        verificationStatus: newStatus,
        rejectionReason: action === 'REJECT' ? (reviewNotes || 'Documents non conformes') : null,
      },
      include: { user: true },
    });

    if (action === 'APPROVE' || action === 'REACTIVATE') {
      await db.user.update({
        where: { id: driver.userId },
        data: { isActive: true },
      });
    }

    // Notify driver
    let message = 'Votre compte livreur a été approuvé ! Vous pouvez maintenant proposer des livraisons.';
    if (action === 'REJECT') message = `Votre dossier de vérification a été rejeté. Motif : ${reviewNotes || 'Documents non conformes'}`;
    if (action === 'SUSPEND') message = 'Votre compte livreur a été temporairement suspendu. Contactez l\'administration.';

    await db.notification.create({
      data: {
        userId: driver.userId,
        title: action === 'APPROVE' || action === 'REACTIVATE' ? '✅ Compte Vérifié !' : '⚠️ Mise à jour de votre compte',
        message,
        type: 'SYSTEM',
      },
    });

    // Log to audit log
    await db.auditLog.create({
      data: {
        userId: String(session.userId),
        action: `DRIVER_${action}`,
        targetEntity: 'Driver',
        targetId: driverId,
        detailsJson: JSON.stringify({ newStatus, reviewNotes }),
      },
    });

    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    console.error('Error updating driver verification:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
