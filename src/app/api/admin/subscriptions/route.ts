import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      orderBy: { priceFcfa: 'asc' },
    });
    const driverFee = await db.systemSetting.findUnique({
      where: { key: 'DRIVER_VERIFICATION_FEE_FCFA' },
    });
    return NextResponse.json({ plans, driverFeeFcfa: driverFee?.value || '5000' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { planId, priceFcfa, maxActiveRequests, driverVerificationFeeFcfa } = await req.json();

    if (planId && priceFcfa !== undefined) {
      const plan = await db.subscriptionPlan.update({
        where: { id: planId },
        data: {
          priceFcfa: parseInt(priceFcfa),
          ...(maxActiveRequests !== undefined ? { maxActiveRequests: parseInt(maxActiveRequests) } : {}),
        },
      });

      await db.auditLog.create({
        data: {
          userId: String(session.userId),
          action: 'UPDATE_SUBSCRIPTION_PLAN_PRICE',
          targetEntity: 'SubscriptionPlan',
          targetId: planId,
          detailsJson: JSON.stringify({ newPriceFcfa: priceFcfa }),
        },
      });
    }

    if (driverVerificationFeeFcfa !== undefined) {
      await db.systemSetting.upsert({
        where: { key: 'DRIVER_VERIFICATION_FEE_FCFA' },
        update: { value: String(driverVerificationFeeFcfa) },
        create: { key: 'DRIVER_VERIFICATION_FEE_FCFA', value: String(driverVerificationFeeFcfa), description: 'Frais uniques d\'inscription livreur' },
      });

      await db.auditLog.create({
        data: {
          userId: String(session.userId),
          action: 'UPDATE_DRIVER_VERIFICATION_FEE',
          targetEntity: 'SystemSetting',
          detailsJson: JSON.stringify({ newFee: driverVerificationFeeFcfa }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pricing:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des prix' }, { status: 500 });
  }
}
