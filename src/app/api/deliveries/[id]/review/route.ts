import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { rating, comment } = await req.json();
    const ratingVal = parseInt(rating, 10);

    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json({ error: 'La note doit être comprise entre 1 et 5 étoiles.' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: { assignments: true },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    if (deliveryRequest.status !== 'completed') {
      return NextResponse.json({ error: 'Une évaluation ne peut être soumise que pour une livraison réellement terminée.' }, { status: 400 });
    }

    if (deliveryRequest.clientId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Seul le client de la livraison peut soumettre une évaluation.' }, { status: 403 });
    }

    const assignment = deliveryRequest.assignments[0];
    if (!assignment || !assignment.driverId) {
      return NextResponse.json({ error: 'Aucun livreur n\'a été attribué à cette livraison.' }, { status: 400 });
    }

    // Check if review already exists
    const existingReview = await db.review.findFirst({
      where: {
        deliveryId: params.id,
        reviewerId: session.userId,
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Vous avez déjà évalué cette livraison.' }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        deliveryId: params.id,
        reviewerId: session.userId,
        reviewedDriverId: assignment.driverId,
        rating: ratingVal,
        comment: comment || null,
      },
    });

    // Update driver profile average rating and ratings count
    const driverProfile = await db.driverProfile.findUnique({
      where: { userId: assignment.driverId },
    });

    if (driverProfile) {
      const currentTotal = driverProfile.totalRatings || 0;
      const currentAvg = parseFloat(driverProfile.averageRating ? driverProfile.averageRating.toString() : '0');
      const newTotal = currentTotal + 1;
      const newAvg = ((currentAvg * currentTotal) + ratingVal) / newTotal;

      await db.driverProfile.update({
        where: { id: driverProfile.id },
        data: {
          totalRatings: newTotal,
          averageRating: newAvg,
        },
      });
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Merci ! Votre évaluation a été enregistrée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur soumission évaluation:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'enregistrement de l\'évaluation' }, { status: 500 });
  }
}
