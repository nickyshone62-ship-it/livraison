import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const role = (session.role || 'client').toLowerCase();
    if (role !== 'driver') {
      return NextResponse.json({ error: 'Seuls les livreurs autorisés peuvent émettre une proposition.' }, { status: 403 });
    }

    // Check driver verification status
    const driverProfile = await db.driverProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!driverProfile || driverProfile.verificationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Votre compte livreur doit être approuvé par l\'administration pour émettre des propositions.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { proposedPrice, estimatedDuration, message } = body;

    if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
      return NextResponse.json({ error: 'Veuillez proposer un prix valide' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({ where: { id: params.id } });
    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    // Check one proposal per driver per request
    const existingOffer = await db.deliveryOffer.findFirst({
      where: {
        deliveryId: params.id,
        driverId: driverProfile.id,
      },
    });

    let offer;
    if (existingOffer) {
      offer = await db.deliveryOffer.update({
        where: { id: existingOffer.id },
        data: {
          proposedPrice: parseFloat(proposedPrice),
          estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
          message: message || null,
          status: 'pending',
        },
      });
    } else {
      offer = await db.deliveryOffer.create({
        data: {
          deliveryId: params.id,
          driverId: driverProfile.id,
          proposedPrice: parseFloat(proposedPrice),
          estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
          message: message || null,
          status: 'pending',
        },
      });
    }

    // Notify Client in notifications table
    await db.notification.create({
      data: {
        userId: deliveryRequest.clientId,
        title: '🔔 Nouvelle proposition reçue',
        message: `Un livreur vous propose un prix de ${proposedPrice} FCFA pour votre livraison.`,
        type: 'delivery',
        relatedId: deliveryRequest.id,
      },
    });

    return NextResponse.json({
      success: true,
      offer,
      message: 'Votre proposition a été transmise au client.',
    });
  } catch (error: any) {
    console.error('Erreur soumission proposition:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la soumission' }, { status: 500 });
  }
}
