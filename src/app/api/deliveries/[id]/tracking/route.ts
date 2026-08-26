import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: { assignments: true },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    const role = (session.role || 'client').toLowerCase();
    const assignment = deliveryRequest.assignments[0];

    // Security check: only client, assigned driver, or admin can access GPS tracking
    const isAuthorized =
      role === 'admin' ||
      deliveryRequest.clientId === session.userId ||
      (assignment && assignment.driverId === session.userId);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Accès non autorisé au suivi GPS de cette livraison.' }, { status: 403 });
    }

    const logs = await db.deliveryTracking.findMany({
      where: { deliveryId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      currentLocation: logs[0] || null,
      history: logs,
    });
  } catch (error: any) {
    console.error('Erreur récupération GPS:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de la position' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const role = (session.role || 'client').toLowerCase();
    if (role !== 'driver') {
      return NextResponse.json({ error: 'Seul le livreur attribué peut émettre sa position GPS.' }, { status: 403 });
    }

    const body = await req.json();
    const { latitude, longitude, accuracy } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Coordonnées latitude et longitude requises.' }, { status: 400 });
    }

    const trackingLog = await db.deliveryTracking.create({
      data: {
        deliveryId: params.id,
        driverId: session.userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
      },
    });

    return NextResponse.json({ success: true, trackingLog });
  } catch (error: any) {
    console.error('Erreur émission GPS:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la position GPS' }, { status: 500 });
  }
}
