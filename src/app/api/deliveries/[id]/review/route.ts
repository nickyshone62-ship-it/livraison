import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { rating, punctualityRating, communicationRating, packageConditionRating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Note entre 1 et 5 requise' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: { delivery: { include: { driver: { include: { driver: true } } } } },
    });

    if (!deliveryRequest || !deliveryRequest.delivery) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    const delivery = deliveryRequest.delivery;

    // Check if user already reviewed this delivery
    const existingReview = await db.review.findFirst({
      where: {
        deliveryId: delivery.id,
        reviewerId: String(session.userId),
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Vous avez déjà évalué cette livraison' }, { status: 400 });
    }

    const revieweeId = session.userId === delivery.customerId ? delivery.driverId : delivery.customerId;

    const review = await db.review.create({
      data: {
        deliveryId: delivery.id,
        reviewerId: String(session.userId),
        revieweeId,
        rating: parseInt(rating),
        punctualityRating: punctualityRating ? parseInt(punctualityRating) : null,
        communicationRating: communicationRating ? parseInt(communicationRating) : null,
        packageConditionRating: packageConditionRating ? parseInt(packageConditionRating) : null,
        comment: comment || null,
      },
    });

    // Update driver overall rating average if review is for a driver
    const driverRecord = await db.driver.findUnique({ where: { userId: revieweeId } });
    if (driverRecord) {
      const allDriverReviews = await db.review.findMany({
        where: { revieweeId },
      });
      const avg = allDriverReviews.reduce((acc, r) => acc + r.rating, 0) / allDriverReviews.length;
      await db.driver.update({
        where: { id: driverRecord.id },
        data: {
          ratingAvg: Math.round(avg * 10) / 10,
          ratingCount: allDriverReviews.length,
        },
      });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de l\'évaluation' }, { status: 500 });
  }
}
