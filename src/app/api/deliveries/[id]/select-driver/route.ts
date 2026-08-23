import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, generateOTPCode } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { proposalId } = await req.json();
    if (!proposalId) {
      return NextResponse.json({ error: 'Identifiant de la proposition requis' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: { proposals: true },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (deliveryRequest.customerId !== String(session.userId) && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vous ne pouvez choisir le livreur que pour vos propres demandes' }, { status: 403 });
    }

    const selectedProposal = await db.deliveryProposal.findUnique({
      where: { id: proposalId },
      include: { driver: { include: { profile: true } } },
    });

    if (!selectedProposal || selectedProposal.deliveryRequestId !== params.id) {
      return NextResponse.json({ error: 'Proposition invalide' }, { status: 404 });
    }

    // Verify that the driver isn't currently occupied with another active delivery
    const activeDriverTask = await db.delivery.findFirst({
      where: {
        driverId: selectedProposal.driverId,
        status: { in: ['EN_COURS_LIVRAISON', 'COLIS_RECUPERE', 'LIVREUR_SELECTIONNE'] },
      },
      include: { deliveryRequest: true }
    });

    if (activeDriverTask) {
      return NextResponse.json(
        {
          error: `⚠️ LIVREUR DÉJÀ EN OCCUPATION : Le livreur ${selectedProposal.driver?.profile?.fullName || ''} effectue actuellement une autre livraison (#${activeDriverTask.deliveryRequest?.trackingNumber || activeDriverTask.id}). Il doit d'abord terminer ses courses en cours avant de prendre en charge une nouvelle livraison.`
        },
        { status: 400 }
      );
    }

    const pickupCode = generateOTPCode();
    const deliveryCode = generateOTPCode();

    // 1. Update selected proposal status
    await db.deliveryProposal.update({
      where: { id: proposalId },
      data: { status: 'ACCEPTED' },
    });

    // 2. Reject other proposals
    await db.deliveryProposal.updateMany({
      where: {
        deliveryRequestId: params.id,
        id: { not: proposalId },
      },
      data: { status: 'REJECTED' },
    });

    // 3. Update DeliveryRequest status
    await db.deliveryRequest.update({
      where: { id: params.id },
      data: { status: 'LIVREUR_SELECTIONNE' },
    });

    // 4. Create Delivery record & OTP codes
    const delivery = await db.delivery.create({
      data: {
        trackingNumber: deliveryRequest.trackingNumber,
        deliveryRequestId: params.id,
        customerId: deliveryRequest.customerId,
        driverId: selectedProposal.driverId,
        selectedProposalId: proposalId,
        agreedPriceFcfa: selectedProposal.proposedPriceFcfa,
        status: 'LIVREUR_SELECTIONNE',
        selectedAt: new Date(),
        codes: {
          create: {
            pickupCode,
            deliveryCode,
          },
        },
      },
      include: {
        codes: true,
      },
    });

    // 5. Log status transition
    await db.deliveryStatusHistory.create({
      data: {
        deliveryId: delivery.id,
        previousStatus: 'PROPOSITIONS_RECUES',
        newStatus: 'LIVREUR_SELECTIONNE',
        changedByUserId: String(session.userId),
        note: `Le client a sélectionné ${selectedProposal.driver.profile?.fullName || 'un livreur'} au tarif de ${selectedProposal.proposedPriceFcfa} FCFA.`,
      },
    });

    // 6. Notify selected driver
    await db.notification.create({
      data: {
        userId: selectedProposal.driverId,
        title: '🎉 Proposition acceptée !',
        message: `Félicitations ! Vous avez été sélectionné pour la livraison ${deliveryRequest.trackingNumber} (${selectedProposal.proposedPriceFcfa} FCFA).`,
        type: 'DELIVERY',
      },
    });

    return NextResponse.json({
      success: true,
      delivery,
      pickupCode,
      deliveryCode,
    });
  } catch (error: any) {
    console.error('Error selecting driver proposal:', error);
    return NextResponse.json({ error: 'Erreur lors de la sélection du livreur' }, { status: 500 });
  }
}
