import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type, code } = await req.json(); // type: 'PICKUP' | 'DELIVERY', code: 4-digit string

    if (!type || !code) {
      return NextResponse.json({ error: 'Type de code et valeur du code requis' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: {
        delivery: {
          include: {
            codes: true,
            driver: { include: { driver: true } },
          },
        },
      },
    });

    if (!deliveryRequest || !deliveryRequest.delivery || !deliveryRequest.delivery.codes) {
      return NextResponse.json({ error: 'Livraison ou codes de sécurité introuvables' }, { status: 404 });
    }

    const delivery = deliveryRequest.delivery;
    const codes = delivery.codes;
    if (!codes) {
      return NextResponse.json({ error: 'Codes de sécurité introuvables' }, { status: 404 });
    }

    if (type === 'PICKUP') {
      if (codes.pickupCode !== code.trim()) {
        return NextResponse.json({ error: 'Code de récupération incorrect. Veuillez réessayer.' }, { status: 400 });
      }

      // Valid pickup code! Update status to COLIS_RECUPERE and EN_COURS_LIVRAISON
      await db.deliveryCode.update({
        where: { id: codes.id },
        data: { pickupVerifiedAt: new Date() },
      });

      await db.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'EN_COURS_LIVRAISON',
          pickedUpAt: new Date(),
        },
      });

      await db.deliveryRequest.update({
        where: { id: params.id },
        data: { status: 'EN_COURS_LIVRAISON' },
      });

      await db.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          previousStatus: delivery.status,
          newStatus: 'EN_COURS_LIVRAISON',
          changedByUserId: String(session.userId),
          note: 'Code OTP de récupération vérifié avec succès. Colis récupéré par le livreur.',
        },
      });

      await db.notification.create({
        data: {
          userId: delivery.customerId,
          title: '📦 Colis récupéré par le livreur !',
          message: `Le livreur a bien récupéré votre colis pour la livraison ${delivery.trackingNumber}. Le transport est en cours.`,
          type: 'DELIVERY',
        },
      });

      return NextResponse.json({ success: true, status: 'EN_COURS_LIVRAISON' });
    }

    if (type === 'DELIVERY') {
      if (codes.deliveryCode !== code.trim()) {
        return NextResponse.json({ error: 'Code de confirmation de livraison incorrect. Veuillez réessayer.' }, { status: 400 });
      }

      // Valid delivery code! Update status to LIVRE
      await db.deliveryCode.update({
        where: { id: codes.id },
        data: { deliveryVerifiedAt: new Date() },
      });

      await db.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'LIVRE',
          deliveredAt: new Date(),
        },
      });

      await db.deliveryRequest.update({
        where: { id: params.id },
        data: { status: 'LIVRE' },
      });

      // Update driver statistics
      const driverRecord = delivery.driver.driver;
      if (driverRecord) {
        const total = driverRecord.totalDeliveries + 1;
        const success = driverRecord.successfulDeliveries + 1;
        const rate = (success / total) * 100;

        await db.driver.update({
          where: { id: driverRecord.id },
          data: {
            totalDeliveries: total,
            successfulDeliveries: success,
            successRate: Math.round(rate * 10) / 10,
          },
        });
      }

      await db.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          previousStatus: 'EN_COURS_LIVRAISON',
          newStatus: 'LIVRE',
          changedByUserId: String(session.userId),
          note: 'Code OTP de confirmation vérifié avec succès. Livraison effectuée.',
        },
      });

      await db.notification.createMany({
        data: [
          {
            userId: delivery.customerId,
            title: '✅ Livraison terminée avec succès !',
            message: `Votre colis ${delivery.trackingNumber} a été livré. Merci de noter votre livreur !`,
            type: 'DELIVERY',
          },
          {
            userId: delivery.driverId,
            title: '🎉 Course confirmée !',
            message: `La livraison ${delivery.trackingNumber} a été validée par le destinataire. Revenu crédité.`,
            type: 'DELIVERY',
          },
        ],
      });

      return NextResponse.json({ success: true, status: 'LIVRE' });
    }

    return NextResponse.json({ error: 'Type de vérification inconnu' }, { status: 400 });
  } catch (error: any) {
    console.error('Error verifying OTP code:', error);
    return NextResponse.json({ error: 'Erreur lors de la vérification du code' }, { status: 500 });
  }
}
