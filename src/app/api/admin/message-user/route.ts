import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const { userId, title, message, deliveryId } = await req.json();

    if (!userId || !message || !message.trim()) {
      return NextResponse.json({ error: 'L\'utilisateur destinataire et le message sont requis.' }, { status: 400 });
    }

    const recipient = await db.profile.findUnique({ where: { id: userId } });
    if (!recipient) {
      return NextResponse.json({ error: 'Utilisateur destinataire introuvable.' }, { status: 404 });
    }

    // 1. Création de la notification instantanée pour l'utilisateur
    const notification = await db.notification.create({
      data: {
        userId,
        title: title && title.trim() ? title.trim() : '💬 Message de l\'Administration',
        message: message.trim(),
        type: 'admin_message',
        relatedId: deliveryId || null,
      },
    });

    // 2. Traçabilité dans le journal d'actions administrateur
    await db.adminAction.create({
      data: {
        adminId: session.userId,
        action: 'send_message',
        targetUserId: userId,
        details: `Message envoyé à ${recipient.fullName || recipient.phone || recipient.email || userId}: ${message.trim().slice(0, 100)}`,
      },
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: `Message envoyé avec succès à ${recipient.fullName || 'l\'utilisateur'}.`,
      notification,
    });
  } catch (error: any) {
    console.error('Erreur envoi message admin:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du message' }, { status: 500 });
  }
}
