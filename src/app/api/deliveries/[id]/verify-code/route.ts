import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type } = await req.json();

    const deliveryRequest = await db.deliveryRequest.findUnique({
      where: { id: params.id },
    });

    if (!deliveryRequest) {
      return NextResponse.json({ error: 'Livraison introuvable' }, { status: 404 });
    }

    const nextStatus = type === 'PICKUP' ? 'package_picked_up' : 'delivered';

    await db.deliveryRequest.update({
      where: { id: params.id },
      data: { status: nextStatus },
    });

    await db.deliveryStatusHistory.create({
      data: {
        deliveryId: params.id,
        status: nextStatus,
        changedBy: session.userId,
      },
    });

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
  }
}
