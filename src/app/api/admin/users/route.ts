import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const users = await db.user.findMany({
      where: {
        role: { not: 'ADMIN' },
      },
      include: {
        profile: true,
        driver: {
          include: {
            vehicles: true,
            documents: true,
          },
        },
        subscriptions: {
          orderBy: { endsAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des utilisateurs' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { userId, action, reason } = await req.json(); // action: 'APPROVE' | 'REJECT' | 'TOGGLE_STATUS'

    if (!userId || !action) {
      return NextResponse.json({ error: 'ID utilisateur et action requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { driver: true, profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const newIsActive = action === 'APPROVE' ? true : action === 'REJECT' ? false : !user.isActive;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive: newIsActive },
      include: { profile: true },
    });

    // If user is a driver and action is APPROVE, update driver verification status to VERIFIE
    if (user.driver) {
      await db.driver.update({
        where: { userId },
        data: { verificationStatus: newIsActive ? 'VERIFIE' : 'REJETE' },
      });
    }

    // Send notification to user
    await db.notification.create({
      data: {
        userId: user.id,
        title: newIsActive ? '🎉 Compte Validé par l\'Administrateur !' : '⚠️ Statut de votre compte mis à jour',
        message: newIsActive
          ? 'Votre inscription a été vérifiée et approuvée par l\'administrateur. Vous avez désormais un accès complet à la plateforme LivraisonOuaga !'
          : `Votre compte a été suspendu ou désactivé par l'administrateur. Motif : ${reason || 'Vérification de sécurité'}`,
        type: 'SYSTEM',
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: String(session.userId),
        action: `USER_REGISTRATION_${newIsActive ? 'APPROVED' : 'REJECTED'}`,
        targetEntity: 'User',
        targetId: userId,
        detailsJson: JSON.stringify({ newIsActive, phone: user.phone, role: user.role }),
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user registration approval:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, { status: 500 });
  }
}
