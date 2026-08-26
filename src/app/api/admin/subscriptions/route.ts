import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const subscriptions = await db.subscription.findMany({
      include: {
        user: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors du chargement des abonnements' }, { status: 500 });
  }
}
