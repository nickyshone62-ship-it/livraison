import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, validateActiveSubscription } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { offerId } = await req.json();
    if (!offerId) {
      return NextResponse.json({ error: 'Identifiant de la proposition requis' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: { offers: true },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    const role = (session.role || 'client').toLowerCase();
    if (deliveryRequest.clientId !== session.userId && role !== 'admin') {
      return NextResponse.json({ error: 'Vous pouvez uniquement choisir un livreur pour vos propres demandes.' }, { status: 403 });
    }

    const selectedOffer = await db.deliveryOffer.findUnique({
      where: { id: offerId },
      include: { driver: { include: { profile: true } } },
    });

    if (!selectedOffer || selectedOffer.deliveryId !== params.id) {
      return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
    }

    // SERVER-SIDE STRICT CHECK: Driver status, subscription, & 1 active delivery rule
    const driverProfile = selectedOffer.driver;
    const driverUserId = driverProfile.userId;

    if (driverProfile.verificationStatus !== 'approved') {
      return NextResponse.json({ error: 'Ce livreur n\'a pas encore été approuvé par l\'administration.' }, { status: 400 });
    }

    if (driverProfile.profile?.accountStatus !== 'active') {
      return NextResponse.json({ error: 'Le compte de ce livreur est actuellement suspendu ou inactif.' }, { status: 400 });
    }

    const subCheck = await validateActiveSubscription(driverUserId, 'driver');
    if (!subCheck.active) {
      return NextResponse.json({ error: 'Ce livreur ne dispose pas d\'un abonnement actif à jour.' }, { status: 400 });
    }

    // Check if driver has an existing active delivery
    const activeAssignment = await db.deliveryAssignment.findFirst({
      where: {
        driverId: selectedOffer.driverId,
        delivery: {
          status: { notIn: ['completed', 'cancelled', 'failed'] }
        }
      }
    });

    if (activeAssignment || !driverProfile.isAvailable) {
      return NextResponse.json({ error: 'Ce livreur est actuellement occupé sur une autre livraison.' }, { status: 400 });
    }

    // 1. Accept selected offer
    await db.deliveryOffer.update({
      where: { id: offerId },
      data: { status: 'accepted' },
    });

    // 2. Reject other offers for this delivery
    await db.deliveryOffer.updateMany({
      where: {
        deliveryId: params.id,
        id: { not: offerId },
      },
      data: { status: 'rejected' },
    });

    // 3. Update DeliveryRequest status
    await db.deliveryRequest.update({
      where: { id: params.id },
      data: { status: 'driver_selected' },
    });

    // 4. Create DeliveryAssignment
    const assignment = await db.deliveryAssignment.create({
      data: {
        deliveryId: params.id,
        driverId: selectedOffer.driverId,
        offerId: selectedOffer.id,
        assignedAt: new Date(),
      },
    });

    // 5. Update Driver status to BUSY (isAvailable = false)
    await db.driverProfile.update({
      where: { id: selectedOffer.driverId },
      data: { isAvailable: false },
    });

    // 6. Log status history
    await db.deliveryStatusHistory.create({
      data: {
        deliveryId: params.id,
        status: 'driver_selected',
        changedBy: session.userId,
        note: `Livreur ${selectedOffer.driver?.profile?.fullName || ''} sélectionné au montant de ${selectedOffer.proposedPrice} FCFA.`,
      },
    });

    // 7. Notify selected driver
    await db.notification.create({
      data: {
        userId: selectedOffer.driver.userId,
        title: '🎉 Proposition acceptée !',
        message: `Votre proposition de ${selectedOffer.proposedPrice} FCFA a été acceptée par le client.`,
        type: 'delivery',
        relatedId: params.id,
      },
    });

    // 8. Create Conversation for messaging if not exists
    const existingConversation = await db.conversation.findFirst({
      where: {
        deliveryId: params.id,
        clientId: deliveryRequest.clientId,
        driverId: selectedOffer.driverId,
      },
    });

    if (!existingConversation) {
      await db.conversation.create({
        data: {
          deliveryId: params.id,
          clientId: deliveryRequest.clientId,
          driverId: selectedOffer.driverId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      assignment,
      message: 'Livreur sélectionné avec succès. Le livreur est maintenant occupé sur cette livraison.',
    });
  } catch (error: any) {
    console.error('Erreur sélection livreur:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la sélection du livreur' }, { status: 500 });
  }
}
