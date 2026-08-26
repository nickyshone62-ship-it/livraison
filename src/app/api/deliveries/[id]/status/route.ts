import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { status, note } = await req.json();
    if (!status) {
      return NextResponse.json({ error: 'Le nouveau statut est requis' }, { status: 400 });
    }

    const validStatuses = [
      'pending',
      'searching_driver',
      'driver_selected',
      'driver_accepted',
      'driver_arriving',
      'package_picked_up',
      'in_transit',
      'delivered',
      'completed',
      'cancelled',
      'failed',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut de livraison invalide' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: { assignments: true },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    const role = (session.role || 'client').toLowerCase();
    const assignment = deliveryRequest.assignments[0];

    // PROTECTION SERVEUR ANTI-CONTOURNEMENT DES OTP
    if (role !== 'admin' && assignment) {
      if (status === 'package_picked_up' && !assignment.pickupOtpVerified) {
        return NextResponse.json({
          error: 'Le statut ne peut pas être modifié vers "Colis récupéré" sans la saisie et validation du code OTP 1.'
        }, { status: 400 });
      }

      if ((status === 'delivered' || status === 'completed') && !assignment.deliveryOtpVerified) {
        return NextResponse.json({
          error: 'La livraison ne peut pas être clôturée sans la saisie et validation du code OTP 2.'
        }, { status: 400 });
      }
    }

    // Update delivery_request status
    const updatedRequest = await db.deliveryRequest.update({
      where: { id: params.id },
      data: { status },
    });

    // Update assignment timestamps if driver assignment exists
    if (assignment) {
      const now = new Date();
      const updateData: any = {};

      if (status === 'driver_accepted') updateData.acceptedAt = now;
      if (status === 'driver_arriving') updateData.startedAt = now;
      if (status === 'package_picked_up') updateData.pickedUpAt = now;
      if (status === 'delivered') updateData.deliveredAt = now;
      if (status === 'completed') updateData.completedAt = now;

      if (Object.keys(updateData).length > 0) {
        await db.deliveryAssignment.update({
          where: { id: assignment.id },
          data: updateData,
        });
      }

      // If status is final (completed, cancelled, failed), mark driver as available again!
      if (['completed', 'cancelled', 'failed'].includes(status)) {
        await db.driverProfile.update({
          where: { id: assignment.driverId },
          data: { isAvailable: true },
        });
      }
    }


    // Record in delivery_status_history
    await db.deliveryStatusHistory.create({
      data: {
        deliveryId: params.id,
        status,
        changedBy: session.userId,
        note: note || `Statut mis à jour vers '${status}' par l'utilisateur.`,
      },
    });

    // Notify client or driver
    const recipientId = session.userId === deliveryRequest.clientId ? assignment?.driverId : deliveryRequest.clientId;
    if (recipientId) {
      const statusLabels: Record<string, string> = {
        driver_accepted: 'Le livreur a accepté la livraison.',
        driver_arriving: 'Le livreur est en route vers le point de ramassage.',
        package_picked_up: 'Le colis a été récupéré par le livreur.',
        in_transit: 'Le livreur est en cours d\'acheminement vers le destinataire.',
        delivered: 'Le colis a été livré !',
        completed: 'Livraison clôturée et terminée.',
        cancelled: 'La livraison a été annulée.',
      };

      await db.notification.create({
        data: {
          userId: recipientId,
          title: '📍 Mise à jour de votre livraison',
          message: statusLabels[status] || `Le statut de votre livraison est maintenant : ${status}`,
          type: 'delivery',
          relatedId: params.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deliveryRequest: updatedRequest,
      message: 'Statut de livraison mis à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur mise à jour statut livraison:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour du statut' }, { status: 500 });
  }
}
