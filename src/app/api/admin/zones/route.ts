import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const zones = await db.zone.findMany({
      include: { tariffs: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ zones });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { name, associatedQuartiers } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Arrondissement requis' }, { status: 400 });
    }

    const zone = await db.zone.create({
      data: {
        name,
        associatedQuartiers: associatedQuartiers || null,
        city: 'Ouagadougou',
      },
    });

    await db.auditLog.create({
      data: {
        userId: String(session.userId),
        action: 'CREATE_ZONE',
        targetEntity: 'Zone',
        targetId: zone.id,
        detailsJson: JSON.stringify({ name, associatedQuartiers }),
      },
    });

    return NextResponse.json({ success: true, zone });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la création de la zone' }, { status: 500 });
  }
}
