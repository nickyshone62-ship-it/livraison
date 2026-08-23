import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, validateActiveSubscription } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'LIVREUR') {
      return NextResponse.json({ error: 'Seuls les livreurs autorisés peuvent soumettre une proposition' }, { status: 403 });
    }

    // Check driver verification status
    const driverRecord = await db.driver.findUnique({
      where: { userId: String(session.userId) },
    });

    if (!driverRecord || driverRecord.verificationStatus !== 'VERIFIE') {
      return NextResponse.json(
        { error: 'Votre compte livreur doit être VÉRIFIÉ par l\'administration pour soumettre des propositions' },
        { status: 403 }
      );
    }

    // Strict driver subscription check
    const subCheck = await validateActiveSubscription(String(session.userId), session.role);
    if (!subCheck.active) {
      return NextResponse.json(
        { error: subCheck.message, subscriptionExpired: true },
        { status: 403 }
      );
    }

    // Strict Single-Task Check: Driver cannot propose on new tasks if they have an active unfinished delivery task!
    const activeDelivery = await db.delivery.findFirst({
      where: {
        driverId: String(session.userId),
        status: { in: ['EN_COURS_LIVRAISON', 'COLIS_RECUPERE', 'LIVREUR_SELECTIONNE'] },
      },
      include: {
        deliveryRequest: true,
      }
    });

    if (activeDelivery) {
      return NextResponse.json(
        {
          error: `⚠️ TÂCHE EN COURS NON TERMINÉE : Vous avez déjà la livraison #${activeDelivery.deliveryRequest?.trackingNumber || activeDelivery.id} en cours. Tant que vous n'avez pas terminé et livré vos tâches actuelles (statut LIVRÉ), vous ne pouvez pas accepter ou faire une proposition sur une autre livraison.`
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { proposedPriceFcfa, estimatedDurationMinutes, comment } = body;

    if (!proposedPriceFcfa || proposedPriceFcfa <= 0) {
      return NextResponse.json({ error: 'Veuillez proposer un prix valide' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({ where: { id: params.id } });
    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (deliveryRequest.status !== 'DEMANDE_PUBLIEE' && deliveryRequest.status !== 'PROPOSITIONS_RECUES') {
      return NextResponse.json({ error: 'Cette demande n\'est plus disponible' }, { status: 400 });
    }

    // Upsert proposal for driver
    const existingProposal = await db.deliveryProposal.findFirst({
      where: {
        deliveryRequestId: params.id,
        driverId: String(session.userId),
      },
    });

    let proposal;
    if (existingProposal) {
      proposal = await db.deliveryProposal.update({
        where: { id: existingProposal.id },
        data: {
          proposedPriceFcfa: parseInt(proposedPriceFcfa),
          estimatedDurationMinutes: parseInt(estimatedDurationMinutes || '30'),
          comment: comment || null,
        },
      });
    } else {
      proposal = await db.deliveryProposal.create({
        data: {
          deliveryRequestId: params.id,
          driverId: String(session.userId),
          proposedPriceFcfa: parseInt(proposedPriceFcfa),
          estimatedDurationMinutes: parseInt(estimatedDurationMinutes || '30'),
          comment: comment || null,
        },
      });
    }

    // Update request status to PROPOSITIONS_RECUES
    await db.deliveryRequest.update({
      where: { id: params.id },
      data: { status: 'PROPOSITIONS_RECUES' },
    });

    // Send notification to customer
    await db.notification.create({
      data: {
        userId: deliveryRequest.customerId,
        title: 'Nouvelle proposition de livraison !',
        message: `Un livreur vous propose ${proposedPriceFcfa} FCFA pour la livraison ${deliveryRequest.trackingNumber}.`,
        type: 'DELIVERY',
      },
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    console.error('Error submitting proposal:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de la proposition' }, { status: 500 });
  }
}
