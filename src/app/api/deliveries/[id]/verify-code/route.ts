import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type, code } = await req.json();

    if (!type || !code) {
      return NextResponse.json({ error: 'Le type d\'OTP et le code 6 chiffres sont requis' }, { status: 400 });
    }

    const cleanCode = code.toString().trim();

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        client: true,
      },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    const assignment = deliveryRequest.assignments[0];
    if (!assignment) {
      return NextResponse.json({ error: 'Aucun livreur n\'a encore été attribué à cette livraison.' }, { status: 400 });
    }

    const role = (session.role || 'client').toLowerCase();

    // Résolution de l'ID de profil livreur (DriverProfile.id vs Profile.id)
    const driverProfile = await db.driverProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    const driverProfileId = driverProfile ? driverProfile.id : session.userId;

    const isAssignedDriver =
      assignment.driverId === driverProfileId ||
      assignment.driverId === session.userId ||
      session.userId === deliveryRequest.clientId;

    if (!isAssignedDriver && role !== 'admin') {
      return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à valider ce code.' }, { status: 403 });
    }

    const now = new Date();

    // =========================================================================
    // ÉTAPE 1 : VÉRIFICATION OTP 1 — RÉCUPÉRATION DU COLIS (POINT A)
    // =========================================================================
    if (type === 'PICKUP') {
      if (assignment.pickupOtpVerified) {
        return NextResponse.json({ success: true, message: 'Code de récupération déjà validé précédemment.', status: 'package_picked_up' });
      }

      if ((assignment.pickupOtpAttempts || 0) >= 5) {
        return NextResponse.json({ error: 'Nombre maximal de tentatives dépassé pour ce code. Veuillez contacter le support.' }, { status: 429 });
      }

      if (cleanCode !== assignment.pickupOtp) {
        await db.deliveryAssignment.update({
          where: { id: assignment.id },
          data: { pickupOtpAttempts: { increment: 1 } },
        });
        return NextResponse.json({ error: 'Code incorrect. Vérifiez le code fourni par le client.' }, { status: 400 });
      }

      // CODE OTP 1 CORRECT !
      await db.deliveryAssignment.update({
        where: { id: assignment.id },
        data: {
          pickupOtpVerified: true,
          pickedUpAt: now,
          startedAt: assignment.startedAt || now,
        },
      });

      await db.deliveryRequest.update({
        where: { id: params.id },
        data: { status: 'package_picked_up' },
      });

      await db.deliveryStatusHistory.create({
        data: {
          deliveryId: params.id,
          status: 'package_picked_up',
          changedBy: session.userId,
          note: 'OTP 1 (Récupération) validé avec succès par le livreur.',
        },
      });

      // NOTIFICATIONS OTP 1
      await db.notification.create({
        data: {
          userId: deliveryRequest.clientId,
          title: '📦 Colis récupéré !',
          message: 'Votre colis a été récupéré par le livreur.',
          type: 'delivery',
          relatedId: params.id,
        },
      });

      await db.notification.create({
        data: {
          userId: assignment.driverId,
          title: '✓ Récupération confirmée',
          message: 'Code de récupération validé. Vous pouvez vous diriger vers le point d\'arrivée.',
          type: 'delivery',
          relatedId: params.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Colis récupéré avec succès.',
        status: 'package_picked_up',
      });
    }

    // =========================================================================
    // ÉTAPE 2 : VÉRIFICATION OTP 2 — LIVRAISON FINALE (POINT B)
    // =========================================================================
    if (type === 'DELIVERY') {
      // ORDRE OBLIGATOIRE : OTP 1 doit être validé d'abord !
      if (!assignment.pickupOtpVerified) {
        return NextResponse.json({
          error: 'Impossible de valider la livraison. Le premier code de récupération (OTP 1) doit obligatoirement être validé d\'abord.'
        }, { status: 400 });
      }

      if (assignment.deliveryOtpVerified) {
        return NextResponse.json({ success: true, message: 'Livraison déjà confirmée précédemment.', status: 'completed' });
      }

      if ((assignment.deliveryOtpAttempts || 0) >= 5) {
        return NextResponse.json({ error: 'Nombre maximal de tentatives dépassé pour ce code. Veuillez contacter le support.' }, { status: 429 });
      }

      if (cleanCode !== assignment.deliveryOtp) {
        await db.deliveryAssignment.update({
          where: { id: assignment.id },
          data: { deliveryOtpAttempts: { increment: 1 } },
        });
        return NextResponse.json({ error: 'Code incorrect. La livraison n\'a pas encore été confirmée.' }, { status: 400 });
      }

      // CODE OTP 2 CORRECT !
      const pickupTime = assignment.pickedUpAt ? new Date(assignment.pickedUpAt).getTime() : now.getTime();
      const diffMins = Math.max(1, Math.round((now.getTime() - pickupTime) / 60000));

      await db.deliveryAssignment.update({
        where: { id: assignment.id },
        data: {
          deliveryOtpVerified: true,
          deliveredAt: now,
          completedAt: now,
        },
      });

      await db.deliveryRequest.update({
        where: { id: params.id },
        data: { status: 'completed' },
      });

      // Rend le livreur à nouveau disponible !
      await db.driverProfile.update({
        where: { id: assignment.driverId },
        data: { isAvailable: true },
      });

      await db.deliveryStatusHistory.create({
        data: {
          deliveryId: params.id,
          status: 'completed',
          changedBy: session.userId,
          note: `OTP 2 (Livraison) validé avec succès. Durée totale de livraison : ${diffMins} minute(s).`,
        },
      });

      // NOTIFICATIONS OTP 2
      await db.notification.create({
        data: {
          userId: deliveryRequest.clientId,
          title: '🎉 Votre livraison est confirmée !',
          message: 'Le deuxième code a été validé. La livraison est terminée. Vous pouvez évaluer votre livreur.',
          type: 'delivery',
          relatedId: params.id,
        },
      });

      await db.notification.create({
        data: {
          userId: assignment.driverId,
          title: '🏁 Livraison terminée',
          message: 'Livraison terminée et confirmée avec succès. Vous êtes à nouveau disponible pour d\'autres courses.',
          type: 'delivery',
          relatedId: params.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Livraison confirmée avec succès.',
        status: 'completed',
        durationMinutes: diffMins,
      });
    }

    return NextResponse.json({ error: 'Type d\'OTP non reconnu' }, { status: 400 });
  } catch (error: any) {
    console.error('Error verifying OTP code:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la vérification du code' }, { status: 500 });
  }
}

