import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, generateTrackingNumber, validateActiveSubscription } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'open', 'my_requests', 'my_deliveries'

    if (session.role === 'ADMIN') {
      const deliveries = await db.deliveryRequest.findMany({
        include: {
          customer: { include: { profile: true } },
          proposals: { include: { driver: { include: { profile: true, driver: true } } } },
          delivery: { include: { driver: { include: { profile: true, driver: true } }, codes: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ deliveries });
    }

    if (session.role === 'LIVREUR') {
      if (filter === 'my_proposals') {
        const proposals = await db.deliveryProposal.findMany({
          where: { driverId: String(session.userId) },
          include: {
            deliveryRequest: { include: { customer: { include: { profile: true } } } },
            delivery: { include: { codes: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ proposals });
      }

      if (filter === 'my_deliveries') {
        const activeDeliveries = await db.delivery.findMany({
          where: { driverId: String(session.userId) },
          include: {
            deliveryRequest: true,
            customer: { include: { profile: true } },
            codes: true,
            reviews: true,
          },
          orderBy: { updatedAt: 'desc' },
        });
        return NextResponse.json({ deliveries: activeDeliveries });
      }

      // Default for driver: available open requests in Ouagadougou
      const openRequests = await db.deliveryRequest.findMany({
        where: {
          status: { in: ['DEMANDE_PUBLIEE', 'PROPOSITIONS_RECUES'] },
        },
        include: {
          customer: { include: { profile: true } },
          proposals: {
            where: { driverId: String(session.userId) },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ requests: openRequests });
    }

    // Customer roles: PARTICULIER, COMMERCANT, ENTREPRISE
    const customerRequests = await db.deliveryRequest.findMany({
      where: { customerId: String(session.userId) },
      include: {
        proposals: {
          include: {
            driver: {
              include: {
                profile: true,
                driver: { include: { vehicles: true } },
              },
            },
          },
        },
        delivery: {
          include: {
            driver: {
              include: {
                profile: true,
                driver: { include: { vehicles: true } },
              },
            },
            codes: true,
            reviews: true,
            disputes: true,
          },
        },
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
    if (!session || session.role === 'LIVREUR') {
      return NextResponse.json({ error: 'Non autorisé ou seuls les clients peuvent créer une livraison' }, { status: 403 });
    }

    // Strict subscription active check
    const subCheck = await validateActiveSubscription(String(session.userId), session.role);
    if (!subCheck.active) {
      return NextResponse.json({
        error: subCheck.message,
        subscriptionExpired: true,
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      pickupAddress,
      parcels, // Optional array for multiple parcels in single request
      dropoffAddress,
      packageType,
      description,
      quantity,
      urgencyLevel,
      scheduledDate,
      scheduledTime,
      additionalNotes,
      recipientName,
      recipientPhone,
    } = body;

    if (!pickupAddress) {
      return NextResponse.json({ error: 'Veuillez renseigner l\'adresse / lieu de ramassage (Point A)' }, { status: 400 });
    }

    const userId = String(session.userId);
    const createdRequests = [];

    // If multi-parcel request array passed
    if (Array.isArray(parcels) && parcels.length > 0) {
      for (const p of parcels) {
        if (!p.dropoffAddress || !p.description) continue;

        const trackingNumber = generateTrackingNumber();
        const combinedNotes = [
          p.recipientName ? `Destinataire : ${p.recipientName}` : null,
          p.recipientPhone ? `Tél Destinataire : ${p.recipientPhone}` : null,
          p.additionalNotes || null,
        ].filter(Boolean).join(' • ');

        const reqEntry = await db.deliveryRequest.create({
          data: {
            trackingNumber,
            customerId: userId,
            pickupAddress,
            dropoffAddress: p.dropoffAddress,
            packageType: p.packageType || 'Colis / Marchandise',
            description: p.description,
            quantity: p.quantity ? parseInt(p.quantity) : 1,
            urgencyLevel: p.urgencyLevel || 'NORMAL',
            scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
            scheduledTime: scheduledTime || 'Immédiat',
            additionalNotes: combinedNotes || null,
            status: 'DEMANDE_PUBLIEE',
          },
        });
        createdRequests.push(reqEntry);
      }

      if (createdRequests.length === 0) {
        return NextResponse.json({ error: 'Veuillez remplir au moins 1 colis valide avec destination et description' }, { status: 400 });
      }

      await db.auditLog.create({
        data: {
          userId,
          action: 'MULTI_DELIVERY_REQUESTS_CREATED',
          targetEntity: 'DeliveryRequest',
          detailsJson: JSON.stringify({ count: createdRequests.length, pickupAddress }),
        },
      });

      return NextResponse.json({ success: true, count: createdRequests.length, deliveryRequests: createdRequests });
    }

    // Single parcel fallback
    if (!dropoffAddress || !description) {
      return NextResponse.json({ error: 'Veuillez remplir la destination et la description du colis' }, { status: 400 });
    }

    const trackingNumber = generateTrackingNumber();
    const combinedNotes = [
      recipientName ? `Destinataire : ${recipientName}` : null,
      recipientPhone ? `Tél Destinataire : ${recipientPhone}` : null,
      additionalNotes || null,
    ].filter(Boolean).join(' • ');

    const deliveryRequest = await db.deliveryRequest.create({
      data: {
        trackingNumber,
        customerId: userId,
        pickupAddress,
        dropoffAddress,
        packageType: packageType || 'Colis / Marchandise',
        description,
        quantity: quantity ? parseInt(quantity) : 1,
        urgencyLevel: urgencyLevel || 'NORMAL',
        scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: scheduledTime || 'Immédiat',
        additionalNotes: combinedNotes || null,
        status: 'DEMANDE_PUBLIEE',
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: 'DELIVERY_REQUEST_CREATED',
        targetEntity: 'DeliveryRequest',
        targetId: deliveryRequest.id,
        detailsJson: JSON.stringify({ trackingNumber, packageType }),
      },
    });

    return NextResponse.json({ success: true, deliveryRequest });
  } catch (error: any) {
    console.error('Error creating delivery request:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la livraison' }, { status: 500 });
  }
}
