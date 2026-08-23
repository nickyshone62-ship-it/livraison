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
        customer: { include: { profile: true } },
        proposals: {
          include: {
            driver: {
              include: {
                profile: true,
                driver: { include: { vehicles: true, documents: true } },
              },
            },
          },
          orderBy: { proposedPriceFcfa: 'asc' },
        },
        delivery: {
          include: {
            driver: {
              include: {
                profile: true,
                driver: { include: { vehicles: true } },
              },
            },
            codes: true,
            statusHistory: {
              include: { changedByUser: { include: { profile: true } } },
              orderBy: { createdAt: 'asc' },
            },
            reviews: { include: { reviewer: { include: { profile: true } } } },
            disputes: true,
          },
        },
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
