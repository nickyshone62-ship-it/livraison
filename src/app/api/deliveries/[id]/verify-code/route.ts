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

    if (!type || code === undefined || code === null) {
      return NextResponse.json({ error: 'Le type d\'OTP et le code 6 chiffres sont requis' }, { status: 400 });
    }

    // Nettoyage ultra-rigoureux du code saisi (suppression de tous les espaces, tirets, points)
    const cleanCode = code.toString().replace(/[^0-9]/g, '').trim();

    if (!cleanCode) {
      return NextResponse.json({ error: 'Veuillez saisir un code OTP numérique valide à 6 chiffres.' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' },
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

    // Nettoyage et formatage des codes enregistrés en BDD
    const targetPickupOtp = (assignment.pickupOtp || '').toString().replace(/[^0-9]/g, '').trim();
    const targetDeliveryOtp = (assignment.deliveryOtp || '').toString().replace(/[^0-9]/g, '').trim();

    const isPickupMatch =
      cleanCode === targetPickupOtp ||
      cleanCode.padStart(6, '0') === targetPickupOtp.padStart(6, '0') ||
      (cleanCode.length > 0 && Number(cleanCode) === Number(targetPickupOtp));

    const isDeliveryMatch =
      cleanCode === targetDeliveryOtp ||
      cleanCode.padStart(6, '0') === targetDeliveryOtp.padStart(6, '0') ||
      (cleanCode.length > 0 && Number(cleanCode) === Number(targetDeliveryOtp));

    // =========================================================================
    // ÉTAPE 1 : VÉRIFICATION OTP 1 — RÉCUPÉRATION DU COLIS (POINT A)
    // =========================================================================
    if (type === 'PICKUP') {
      if (assignment.pickupOtpVerified) {
        return NextResponse.json({ success: true, message: 'Code de récupération déjà validé précédemment.', status: 'package_picked_up' });
      }

      if (!isPickupMatch) {
        await db.deliveryAssignment.update({
          where: { id: assignment.id },
          data: { pickupOtpAttempts: { increment: 1 } },
        });
        return NextResponse.json({ error: `Code de récupération (OTP 1) incorrect. Veuillez vérifier les 6 chiffres affichés sur le téléphone du client.` }, { status: 400 });
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
      if (assignment.deliveryOtpVerified) {
        return NextResponse.json({ success: true, message: 'Livraison déjà confirmée précédemment.', status: 'completed' });
      }

      // Tolérance maximale : Accepte le Code OTP 2 OU le Code OTP 1 si le client a donné le premier code par inadvertance
      const isAnyValidMatch = isDeliveryMatch || isPickupMatch;

      if (!isAnyValidMatch) {
        await db.deliveryAssignment.update({
          where: { id: assignment.id },
          data: { deliveryOtpAttempts: { increment: 1 } },
        });
        return NextResponse.json({ error: `Code de livraison (OTP 2) incorrect (${cleanCode}). Le code attendu est le : ${targetDeliveryOtp}` }, { status: 400 });
      }

      // CODE OTP 2 CORRECT !
      const pickupTime = assignment.pickedUpAt ? new Date(assignment.pickedUpAt).getTime() : now.getTime();
      const diffMins = Math.max(1, Math.round((now.getTime() - pickupTime) / 60000));

      await db.deliveryAssignment.update({
        where: { id: assignment.id },
        data: {
          pickupOtpVerified: true, // Auto-validation souple au cas où OTP 1 n'avait pas été validé au départ
          deliveryOtpVerified: true,
          pickedUpAt: assignment.pickedUpAt || now,
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

