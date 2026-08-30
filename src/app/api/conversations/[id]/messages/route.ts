import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, validateActiveSubscription } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id: params.id },
      include: {
        driver: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Discussion introuvable' }, { status: 404 });
    }

    const driverProfile = await db.driverProfile.findUnique({ where: { userId: session.userId } });
    const driverProfileId = driverProfile?.id;
    const driverUserId = conversation.driver?.userId;

    const isClient = conversation.clientId === session.userId;
    const isDriver = conversation.driverId === session.userId || (driverProfileId && conversation.driverId === driverProfileId) || (driverUserId && driverUserId === session.userId);
    const isAdmin = session.role === 'admin';

    // Security check
    if (!isClient && !isDriver && !isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer toutes les conversations associées au même couple (clientId, driverId)
    const relatedConvs = await db.conversation.findMany({
      where: {
        clientId: conversation.clientId,
        driverId: conversation.driverId,
      },
      select: { id: true },
    });
    const convIds = Array.from(new Set([params.id, ...relatedConvs.map((c) => c.id)]));

    const messages = await db.message.findMany({
      where: {
        conversationId: { in: convIds },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await db.message.updateMany({
      where: {
        conversationId: { in: convIds },
        senderId: { not: session.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Erreur messages:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des messages' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const subCheck = await validateActiveSubscription(session.userId, session.role);
    if (!subCheck.active) {
      return NextResponse.json({ error: subCheck.message, code: subCheck.code }, { status: 403 });
    }

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Le contenu du message ne peut pas être vide.' }, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id: params.id },
      include: { driver: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: 'Discussion introuvable' }, { status: 404 });
    }

    const driverProfile = await db.driverProfile.findUnique({ where: { userId: session.userId } });
    const driverProfileId = driverProfile?.id;
    const driverUserId = conversation.driver?.userId;

    const isClient = conversation.clientId === session.userId;
    const isDriver = conversation.driverId === session.userId || (driverProfileId && conversation.driverId === driverProfileId) || (driverUserId && driverUserId === session.userId);
    const isAdmin = session.role === 'admin';

    if (!isClient && !isDriver && !isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const message = await db.message.create({
      data: {
        conversationId: params.id,
        senderId: session.userId,
        content: content.trim(),
        isRead: false,
      },
    });

    // Notify recipient
    let recipientId = conversation.clientId;
    if (session.userId === conversation.clientId) {
      recipientId = driverUserId || conversation.driverId;
    }

    await db.notification.create({
      data: {
        userId: recipientId,
        title: '💬 Nouveau message',
        message: content.trim().slice(0, 100),
        type: 'chat',
        relatedId: params.id,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Erreur envoi message:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du message' }, { status: 500 });
  }
}
