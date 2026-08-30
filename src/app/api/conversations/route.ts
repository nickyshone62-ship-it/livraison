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

    // Trouve le DriverProfile s'il existe pour ce userId
    const driverProfile = await db.driverProfile.findUnique({ where: { userId } });
    const driverProfileId = driverProfile?.id;

    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { clientId: userId },
          ...(driverProfileId ? [{ driverId: driverProfileId }] : []),
          { driverId: userId },
        ],
      },
      include: {
        delivery: true,
        driver: {
          include: {
            profile: true,
          },
        },
        client: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Récupération des profils des participants
    const participantIds = new Set<string>();
    conversations.forEach(c => {
      if (c.clientId) participantIds.add(c.clientId);
      if (c.driverId) participantIds.add(c.driverId);
      if (c.driver?.userId) participantIds.add(c.driver.userId);
    });

    const profiles = await db.profile.findMany({
      where: { id: { in: Array.from(participantIds) } },
    });
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Regroupement par interlocuteur unique (pour regrouper tous les messages sous un seul fil)
    const groupedMap = new Map<string, any>();

    for (const c of conversations) {
      const isDriverUser = c.driverId === driverProfileId || c.driverId === userId || c.driver?.userId === userId;
      let otherProfile = null;

      if (isDriverUser) {
        otherProfile = c.client || profileMap.get(c.clientId);
      } else {
        otherProfile = c.driver?.profile || profileMap.get(c.driverId) || (c.driver?.userId ? profileMap.get(c.driver.userId) : null);
      }

      const participantKey = otherProfile?.id || (isDriverUser ? c.clientId : c.driverId);
      if (!participantKey) continue;

      if (!groupedMap.has(participantKey)) {
        groupedMap.set(participantKey, {
          ...c,
          otherParticipant: otherProfile || { fullName: 'Interlocuteur', phone: '' },
        });
      } else {
        const existing = groupedMap.get(participantKey);
        const existingMsgDate = existing.messages[0]?.createdAt ? new Date(existing.messages[0].createdAt).getTime() : 0;
        const currentMsgDate = c.messages[0]?.createdAt ? new Date(c.messages[0].createdAt).getTime() : 0;
        if (currentMsgDate > existingMsgDate) {
          groupedMap.set(participantKey, {
            ...c,
            otherParticipant: otherProfile || { fullName: 'Interlocuteur', phone: '' },
          });
        }
      }
    }

    const result = Array.from(groupedMap.values());

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
        driverId = delivery.assignments[0].driverId;
      }
    } else if (targetUserId) {
      if (session.role === 'driver') {
        const dp = await db.driverProfile.findUnique({ where: { userId: session.userId } });
        driverId = dp ? dp.id : session.userId;
        clientId = targetUserId;
      } else {
        clientId = session.userId;
        const dp = await db.driverProfile.findFirst({
          where: { OR: [{ id: targetUserId }, { userId: targetUserId }] },
        });
        driverId = dp ? dp.id : targetUserId;
      }
    }

    if (!clientId || !driverId) {
      return NextResponse.json({ error: 'Impossible de déterminer les deux participants de la discussion.' }, { status: 400 });
    }

    // Récupérer tous les identifiants possibles du livreur
    const driverProfile = await db.driverProfile.findFirst({
      where: { OR: [{ id: driverId }, { userId: driverId }] },
    });
    const possibleDriverIds = [driverId];
    if (driverProfile) {
      if (driverProfile.id) possibleDriverIds.push(driverProfile.id);
      if (driverProfile.userId) possibleDriverIds.push(driverProfile.userId);
    }

    // Rechercher si la conversation existe déjà
    let conversation = await db.conversation.findFirst({
      where: {
        clientId,
        driverId: { in: possibleDriverIds },
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
