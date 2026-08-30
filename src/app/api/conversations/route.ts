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

    const userId = session.userId;
    const role = (session.role || 'client').toLowerCase();

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { clientId: userId },
          { driverId: userId },
        ],
      },
      include: {
        delivery: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch participant profiles manually
    const participantIds = new Set<string>();
    conversations.forEach(c => {
      if (c.clientId) participantIds.add(c.clientId);
      if (c.driverId) participantIds.add(c.driverId);
    });

    const profiles = await db.profile.findMany({
      where: { id: { in: Array.from(participantIds) } },
    });
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const result = conversations.map(c => {
      const otherId = c.clientId === userId ? c.driverId : c.clientId;
      const otherProfile = profileMap.get(otherId);
      return {
        ...c,
        otherParticipant: otherProfile || { fullName: 'Interlocuteur', phone: '' },
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (error: any) {
    console.error('Erreur liste conversations:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des conversations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { deliveryId, targetUserId } = await req.json();

    let clientId: string | null = null;
    let driverId: string | null = null;

    if (deliveryId) {
      const delivery = await db.deliveryRequest.findUnique({
        where: { id: deliveryId },
        include: {
          assignments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!delivery) {
        return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
      }

      clientId = delivery.clientId;
      if (delivery.assignments.length > 0) {
        // Obtenir le userId correspondant au driverProfile
        const dId = delivery.assignments[0].driverId;
        const driverProfile = await db.driverProfile.findUnique({ where: { id: dId } });
        driverId = driverProfile ? driverProfile.userId : dId;
      }
    } else if (targetUserId) {
      if (session.role === 'driver') {
        driverId = session.userId;
        clientId = targetUserId;
      } else {
        clientId = session.userId;
        driverId = targetUserId;
      }
    }

    if (!clientId || !driverId) {
      return NextResponse.json({ error: 'Impossible de déterminer les deux participants de la discussion.' }, { status: 400 });
    }

    // Rechercher si la conversation existe déjà
    let conversation = await db.conversation.findFirst({
      where: {
        clientId,
        driverId,
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          clientId,
          driverId,
          deliveryId: deliveryId || null,
        },
      });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    console.error('Erreur création conversation:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de la discussion' }, { status: 500 });
  }
}
