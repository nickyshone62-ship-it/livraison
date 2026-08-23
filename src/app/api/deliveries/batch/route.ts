import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, generateTrackingNumber, validateActiveSubscription } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Non autorisé ou seuls les clients/commerçants peuvent soumettre des livraisons' }, { status: 403 });
    }

    const userId = String(session.userId);

    // Strict subscription active check
    const subCheck = await validateActiveSubscription(userId, session.role);
    if (!subCheck.active) {
      return NextResponse.json({
        error: subCheck.message,
        subscriptionExpired: true,
      }, { status: 403 });
    }

    const body = await req.json();
    const { pickupAddress, items } = body;

    if (!pickupAddress || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Veuillez renseigner le point de ramassage et au moins 1 colis' }, { status: 400 });
    }

    const createdRequests = [];

    for (const item of items) {
      const {
        dropoffAddress,
        packageType,
        description,
        quantity,
        urgencyLevel,
        recipientName,
        recipientPhone,
        additionalNotes,
      } = item;

      if (!dropoffAddress || !description) {
        continue;
      }

      const trackingNumber = generateTrackingNumber();
      const combinedNotes = [
        recipientName ? `Destinataire : ${recipientName}` : null,
        recipientPhone ? `Tél Destinataire : ${recipientPhone}` : null,
        additionalNotes || null,
      ].filter(Boolean).join(' • ');

      const reqEntry = await db.deliveryRequest.create({
        data: {
          trackingNumber,
          customerId: userId,
          pickupAddress,
          dropoffAddress,
          packageType: packageType || 'Colis / Marchandise',
          description,
          quantity: quantity ? parseInt(quantity) : 1,
          urgencyLevel: urgencyLevel || 'NORMAL',
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: 'Immédiat',
          additionalNotes: combinedNotes || null,
          status: 'DEMANDE_PUBLIEE',
        },
      });

      createdRequests.push(reqEntry);
    }

    if (createdRequests.length === 0) {
      return NextResponse.json({ error: 'Aucun colis valide n\'a pu être créé' }, { status: 400 });
    }

    await db.auditLog.create({
      data: {
        userId,
        action: 'BATCH_DELIVERY_REQUESTS_CREATED',
        targetEntity: 'DeliveryRequest',
        detailsJson: JSON.stringify({ count: createdRequests.length, pickupAddress }),
      },
    });

    return NextResponse.json({
      success: true,
      count: createdRequests.length,
      createdRequests,
    });
  } catch (error: any) {
    console.error('Error creating batch delivery requests:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du lot de livraisons' }, { status: 500 });
  }
}
