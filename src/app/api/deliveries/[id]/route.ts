import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        offers: {
          include: {
            driver: {
              include: {
                profile: true,
                vehicles: true,
              },
            },
          },
          orderBy: { proposedPrice: 'asc' },
        },
        assignments: {
          include: {
            driver: {
              include: {
                profile: true,
                vehicles: true,
              },
            },
          },
        },
        statusHistory: true,
        reviews: true,
      },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    return NextResponse.json({ request: deliveryRequest });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
