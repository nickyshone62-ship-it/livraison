import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, generateDisputeNumber } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { category, description, evidenceUrls } = await req.json();

    if (!category || !description) {
      return NextResponse.json({ error: 'Catégorie et description requises pour signaler un problème' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: { delivery: true },
    });

    if (!deliveryRequest || !deliveryRequest.delivery) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    const disputeNumber = generateDisputeNumber();

    const dispute = await db.dispute.create({
      data: {
        disputeNumber,
        deliveryId: deliveryRequest.delivery.id,
        openedByUserId: String(session.userId),
        category,
        description,
        evidenceUrls: evidenceUrls || null,
        status: 'OUVERT',
      },
    });

    // Update delivery status to LITIGE
    await db.delivery.update({
      where: { id: deliveryRequest.delivery.id },
      data: { status: 'LITIGE' },
    });

    await db.deliveryRequest.update({
      where: { id: params.id },
      data: { status: 'LITIGE' },
    });

    await db.deliveryStatusHistory.create({
      data: {
        deliveryId: deliveryRequest.delivery.id,
        previousStatus: deliveryRequest.delivery.status,
        newStatus: 'LITIGE',
        changedByUserId: String(session.userId),
        note: `Signalement d'un problème (${category}) : ${description}`,
      },
    });

    return NextResponse.json({ success: true, dispute });
  } catch (error: any) {
    console.error('Error opening dispute:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'ouverture du litige' }, { status: 500 });
  }
}
