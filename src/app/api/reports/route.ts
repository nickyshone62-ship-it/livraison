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

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const { reportId, action, resolutionNote } = await req.json(); // action: 'investigate', 'resolve', 'reject'
    if (!reportId || !action) {
      return NextResponse.json({ error: 'L\'ID du signalement et l\'action sont requis.' }, { status: 400 });
    }

    const report = await db.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return NextResponse.json({ error: 'Signalement introuvable.' }, { status: 404 });
    }

    let newStatus = report.status;
    if (action === 'investigate') newStatus = 'investigating';
    else if (action === 'resolve') newStatus = 'resolved';
    else if (action === 'reject') newStatus = 'rejected';

    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
        resolutionNote: resolutionNote || null,
      },
    });

    // Log admin action in admin_actions
    await db.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: `REPORT_${action.toUpperCase()}`,
        targetTable: 'reports',
        targetId: reportId,
        oldData: { status: report.status },
        newData: { status: newStatus, resolutionNote: resolutionNote || null },
      },
    });

    // Notify reporter
    await db.notification.create({
      data: {
        userId: report.reporterId,
        title: '🛡️ Mise à jour de votre signalement',
        message: action === 'resolve'
          ? 'Votre signalement a été examiné et résolu par notre équipe d\'administration.'
          : action === 'reject'
          ? 'Votre signalement a été examiné. Aucune infraction n\'a été retenue.'
          : 'Votre signalement est actuellement en cours d\'investigation par notre équipe.',
        type: 'report',
        relatedId: reportId,
      },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: `Signalement ${newStatus} avec succès.`,
    });
  } catch (error: any) {
    console.error('Erreur admin reports PATCH:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du traitement du signalement' }, { status: 500 });
  }
}
