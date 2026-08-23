import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { reason } = await req.json().catch(() => ({ reason: '' }));

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: {
        delivery: { include: { driver: true } },
        proposals: true,
      },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    // Verify ownership or Admin role
    if (deliveryRequest.customerId !== String(session.userId) && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vous ne pouvez changer le livreur que pour vos propres demandes' }, { status: 403 });
    }

    if (deliveryRequest.status === 'LIVRE') {
      return NextResponse.json({ error: 'Impossible de changer de livreur pour une commande déjà livrée' }, { status: 400 });
    }

    const previousDriverUserId = deliveryRequest.delivery?.driverId;

    // 1. Reset proposals status so driver can be re-selected or new proposals can arrive
    await db.deliveryProposal.updateMany({
      where: { deliveryRequestId: params.id },
      data: { status: 'PENDING' },
    });

    // 2. Remove or reset Delivery entry if existing
    if (deliveryRequest.delivery) {
      await db.delivery.update({
        where: { id: deliveryRequest.delivery.id },
        data: {
          status: 'ANNULE',
        },
      });
    }

    // 3. Reset DeliveryRequest status to PROPOSITIONS_RECUES
    await db.deliveryRequest.update({
      where: { id: params.id },
      data: {
        status: deliveryRequest.proposals.length > 0 ? 'PROPOSITIONS_RECUES' : 'DEMANDE_PUBLIEE',
      },
    });

    // 4. Log status history
    if (deliveryRequest.delivery) {
      await db.deliveryStatusHistory.create({
        data: {
          deliveryId: deliveryRequest.delivery.id,
          previousStatus: deliveryRequest.status,
          newStatus: 'PROPOSITIONS_RECUES',
          changedByUserId: String(session.userId),
          note: `Changement de livreur demandé par le client. Motif : ${reason || 'Changement de livreur en cas de soucis'}`,
        },
      });
    }

    // 5. Notify previous driver if assigned
    if (previousDriverUserId) {
      await db.notification.create({
        data: {
          userId: previousDriverUserId,
          title: '🔄 Remplacement sur la livraison',
          message: `Le client a choisi de changer de livreur pour la livraison ${deliveryRequest.trackingNumber}. Votre affectation a été réinitialisée.`,
          type: 'DELIVERY',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Demande réouverte avec succès ! Vous pouvez à présent choisir un autre livreur ou recevoir de nouvelles offres.',
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors du changement de livreur' }, { status: 500 });
  }
}
