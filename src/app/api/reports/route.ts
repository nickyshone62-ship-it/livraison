import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const role = (session.role || 'client').toLowerCase();
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const reports = await db.report.findMany({
      include: {
        reporter: true,
        reportedUser: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Erreur chargement signalements:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des signalements' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { reportedUserId, deliveryId, reason, description } = await req.json();
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Le motif du signalement est obligatoire.' }, { status: 400 });
    }

    const report = await db.report.create({
      data: {
        reporterId: session.userId,
        reportedUserId: reportedUserId || null,
        deliveryId: deliveryId || null,
        reason: reason.trim(),
        description: description || null,
        status: 'pending',
      },
    });

    // Notify admins
    const admins = await db.profile.findMany({ where: { role: 'admin' } });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map(a => ({
          userId: a.id,
          title: '🚨 Nouveau signalement reçu',
          message: `Un signalement concernant "${reason}" a été émis.`,
          type: 'report',
          relatedId: report.id,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Votre signalement a été transmis à l\'administration.',
    });
  } catch (error: any) {
    console.error('Erreur création signalement:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création du signalement' }, { status: 500 });
  }
}
