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
        offers: true,
        assignments: true,
      },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (deliveryRequest.clientId !== String(session.userId) && (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Seul le client peut modifier cette livraison' }, { status: 403 });
    }

    if (deliveryRequest.status === 'completed') {
      return NextResponse.json({ error: 'Impossible de changer de livreur pour une livraison terminée' }, { status: 400 });
    }

    // Reset offers to pending
    await db.deliveryOffer.updateMany({
      where: { deliveryId: params.id },
      data: { status: 'pending' },
    });

    // Reset request status
    await db.deliveryRequest.update({
      where: { id: params.id },
      data: { status: 'searching_driver' },
    });

    // Record status history
    await db.deliveryStatusHistory.create({
      data: {
        deliveryId: params.id,
        status: 'searching_driver',
        changedBy: session.userId,
        note: `Changement de livreur demandé. Motif: ${reason || 'Réinitialisation'}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Demande réouverte. Vous pouvez choisir un autre livreur.',
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors du changement de livreur' }, { status: 500 });
  }
}
