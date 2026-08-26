import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = String(session.userId);
    const body = await req.json();
    const { pickupAddress, items } = body;

    if (!pickupAddress || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Veuillez renseigner le point de ramassage et au moins 1 colis' }, { status: 400 });
    }

    const createdRequests = [];

    for (const item of items) {
      const {
        destinationAddress,
        packageCategory,
        description,
        quantity,
        recipientName,
        recipientPhone,
        additionalNotes,
      } = item;

      if (!destinationAddress || !description) continue;

      const reqEntry = await db.deliveryRequest.create({
        data: {
          clientId: userId,
          pickupAddress,
          destinationAddress,
          packageCategory: packageCategory || 'Colis Général',
          packageDescription: description,
          packageQuantity: quantity ? parseInt(quantity) : 1,
          recipientName: recipientName || 'Destinataire',
          recipientPhone: recipientPhone || '',
          additionalInstructions: additionalNotes || null,
          status: 'searching_driver',
        },
      });

      createdRequests.push(reqEntry);
    }

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
