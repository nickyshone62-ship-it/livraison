import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Discussion introuvable' }, { status: 404 });
    }

    // Security check
    if (conversation.clientId !== session.userId && conversation.driverId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Mark unread messages as read
    await db.message.updateMany({
      where: {
        conversationId: params.id,
        senderId: { not: session.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages: conversation.messages });
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

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Le contenu du message ne peut pas être vide.' }, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({ where: { id: params.id } });
    if (!conversation) {
      return NextResponse.json({ error: 'Discussion introuvable' }, { status: 404 });
    }

    if (conversation.clientId !== session.userId && conversation.driverId !== session.userId && session.role !== 'admin') {
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
    const recipientId = session.userId === conversation.clientId ? conversation.driverId : conversation.clientId;
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
