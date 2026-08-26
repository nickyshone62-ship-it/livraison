import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'open', 'my_requests', 'my_offers', 'my_deliveries'
    const role = (session.role || 'client').toLowerCase();
    const userId = session.userId;

    if (role === 'admin') {
      const requests = await db.deliveryRequest.findMany({
        include: {
          client: true,
          offers: { include: { driver: { include: { profile: true, vehicles: true } } } },
          assignments: { include: { driver: { include: { profile: true } } } },
          reviews: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ requests });
    }

    if (role === 'driver') {
      const driverProfile = await db.driverProfile.findUnique({
        where: { userId },
      });

      const driverProfileId = driverProfile ? driverProfile.id : userId;

      if (filter === 'my_offers') {
        const offers = await db.deliveryOffer.findMany({
          where: { driverId: driverProfileId },
          include: {
            deliveryRequest: { include: { client: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ offers });
      }

      if (filter === 'my_deliveries') {
        const assignments = await db.deliveryAssignment.findMany({
          where: { driverId: driverProfileId },
          include: {
            delivery: { include: { client: true, offers: true, reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ assignments });
      }

      // Default for driver: available open requests with status 'searching_driver' or 'pending'
      const openRequests = await db.deliveryRequest.findMany({
        where: {
          status: { in: ['searching_driver', 'pending'] },
        },
        include: {
          client: true,
          offers: {
            where: { driverId: driverProfileId },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ requests: openRequests });
    }

    // Client space: my requests
    const customerRequests = await db.deliveryRequest.findMany({
      where: { clientId: userId },
      include: {
        offers: {
          include: {
            driver: {
              include: {
                profile: true,
                vehicles: true,
                documents: true,
              },
            },
          },
        },
        assignments: {
          include: {
            driver: {
              include: {
                profile: true,
                vehicles: true,
              },
            },
          },
        },
        reviews: true,
        reports: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests: customerRequests });
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des livraisons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const role = (session.role || 'client').toLowerCase();
    if (role === 'driver') {
      return NextResponse.json({ error: 'Seuls les clients peuvent émettre des demandes de livraison.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      pickupAddress,
      pickupCity,
      pickupInstructions,
      pickupLatitude,
      pickupLongitude,
      destinationAddress,
      destinationCity,
      destinationInstructions,
      destinationLatitude,
      destinationLongitude,
      recipientName,
      recipientPhone,
      packageDescription,
      packageCategory,
      packageWeight,
      packageQuantity,
      packageSize,
      requestedDate,
      requestedTime,
      additionalInstructions,
    } = body;

    if (!pickupAddress || !destinationAddress || !recipientName || !recipientPhone || !packageDescription) {
      return NextResponse.json({ error: 'Veuillez remplir les informations obligatoires (Départ, Destination, Destinataire, Description colis).' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.create({
      data: {
        clientId: session.userId,
        pickupAddress,
        pickupCity: pickupCity || 'Ouagadougou',
        pickupInstructions: pickupInstructions || null,
        pickupLatitude: pickupLatitude ? parseFloat(pickupLatitude) : null,
        pickupLongitude: pickupLongitude ? parseFloat(pickupLongitude) : null,
        destinationAddress,
        destinationCity: destinationCity || 'Ouagadougou',
        destinationInstructions: destinationInstructions || null,
        destinationLatitude: destinationLatitude ? parseFloat(destinationLatitude) : null,
        destinationLongitude: destinationLongitude ? parseFloat(destinationLongitude) : null,
        recipientName,
        recipientPhone,
        packageDescription,
        packageCategory: packageCategory || 'Colis Général',
        packageWeight: packageWeight ? parseFloat(packageWeight) : null,
        packageQuantity: packageQuantity ? parseInt(packageQuantity, 10) : 1,
        packageSize: packageSize || null,
        requestedDate: requestedDate ? new Date(requestedDate) : new Date(),
        requestedTime: requestedTime || null,
        additionalInstructions: additionalInstructions || null,
        status: 'searching_driver',
      },
    });

    return NextResponse.json({
      success: true,
      deliveryRequest,
      message: 'Votre demande est maintenant visible par les livreurs disponibles.',
    });
  } catch (error: any) {
    console.error('Erreur création livraison:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de la demande' }, { status: 500 });
  }
}
