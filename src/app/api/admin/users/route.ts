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

    let newApprovalStatus = user.approvalStatus;
    let newIsActive = user.isActive;
    let responseMessage = '';

    if (action === 'APPROVE') {
      newApprovalStatus = 'APPROVED';
      newIsActive = true;
      responseMessage = 'Utilisateur approuvé avec succès.';
    } else if (action === 'REJECT') {
      newApprovalStatus = 'REJECTED';
      newIsActive = false;
      responseMessage = 'Utilisateur refusé.';
    } else {
      newIsActive = !user.isActive;
      newApprovalStatus = newIsActive ? 'APPROVED' : user.approvalStatus;
      responseMessage = newIsActive ? 'Utilisateur activé avec succès.' : 'Utilisateur désactivé.';
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: newApprovalStatus,
        isActive: newIsActive,
      },
      include: { profile: true },
    });

    // If user is a driver, update driver verification status
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
          : `Votre compte a été refusé ou désactivé par l'administrateur. Motif : ${reason || 'Vérification de dossier'}`,
        type: 'SYSTEM',
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: String(session.userId),
        action: `USER_REGISTRATION_${newApprovalStatus}`,
        targetEntity: 'User',
        targetId: userId,
        detailsJson: JSON.stringify({ approvalStatus: newApprovalStatus, newIsActive, phone: user.phone, role: user.role }),
      },
    });

    return NextResponse.json({ success: true, message: responseMessage, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user registration approval:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, { status: 500 });
  }
}
