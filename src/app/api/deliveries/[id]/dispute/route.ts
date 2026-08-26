import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { category, description } = await req.json();

    if (!category || !description) {
      return NextResponse.json({ error: 'Catégorie et description requises' }, { status: 400 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    const report = await db.report.create({
      data: {
        reporterId: session.userId,
        deliveryId: params.id,
        reason: category,
        description,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error opening dispute:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'ouverture du signalement' }, { status: 500 });
  }
}
