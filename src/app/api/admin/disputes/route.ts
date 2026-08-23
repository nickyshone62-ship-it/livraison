import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const disputes = await db.dispute.findMany({
      include: {
        openedByUser: { include: { profile: true } },
        delivery: {
          include: {
            deliveryRequest: true,
            customer: { include: { profile: true } },
            driver: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ disputes });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors du chargement des litiges' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { disputeId, status, resolutionNotes } = await req.json(); // status: 'EN_ANALYSE' | 'RESOLU' | 'REJETE'

    if (!disputeId || !status) {
      return NextResponse.json({ error: 'ID du litige et statut requis' }, { status: 400 });
    }

    const dispute = await db.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolutionNotes: resolutionNotes || null,
        assignedAdminId: String(session.userId),
      },
    });

    await db.auditLog.create({
      data: {
        userId: String(session.userId),
        action: `DISPUTE_${status}`,
        targetEntity: 'Dispute',
        targetId: disputeId,
        detailsJson: JSON.stringify({ status, resolutionNotes }),
      },
    });

    return NextResponse.json({ success: true, dispute });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du litige' }, { status: 500 });
  }
}
