import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: true,
      },
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des notifications' }, { status: 500 });
  }
}
