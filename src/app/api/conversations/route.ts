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
