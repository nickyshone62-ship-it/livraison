import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
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
    return NextResponse.json({ error: 'Erreur lors du chargement des litiges' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { reportId, status, resolutionNote } = await req.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: 'ID du signalement et statut requis' }, { status: 400 });
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: {
        status,
        resolutionNote: resolutionNote || null,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
      },
    });

    await db.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: `REPORT_${status.toUpperCase()}`,
        targetTable: 'reports',
        targetId: reportId,
        newData: { status, resolutionNote },
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du litige' }, { status: 500 });
  }
}
