import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const payments = await db.payment.findMany({
      include: {
        user: {
          include: {
            driverProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Erreur admin payments GET:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des paiements' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const { paymentId, action, rejectionReason } = await req.json(); // action: 'approve', 'reject'
    if (!paymentId || !action) {
      return NextResponse.json({ error: 'ID du paiement et action requis.' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { user: { include: { driverProfile: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Paiement introuvable.' }, { status: 404 });
    }

    const newPaymentStatus = action === 'approve' ? 'approved' : 'rejected';

    // 1. Update Payment status
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: newPaymentStatus,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? (rejectionReason || 'Paiement non reçu ou référence invalide') : null,
      },
    });

    // 2. If approved registration payment -> activate user account
    if (action === 'approve') {
      if (payment.paymentType === 'registration') {
        await db.profile.update({
          where: { id: payment.userId },
          data: { accountStatus: 'active' },
        });

        if (payment.user.driverProfile) {
          await db.driverProfile.update({
            where: { id: payment.user.driverProfile.id },
            data: {
              verificationStatus: 'approved',
              approvedAt: new Date(),
              approvedBy: session.userId,
            },
          });
        }

        // Grant 30-day initial active subscription on registration approval
        const startsAt = new Date();
        const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db.subscription.create({
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            amount: payment.amount || 1000,
            currency: payment.currency || 'XOF',
            status: 'active',
            startsAt,
            expiresAt,
            approvedBy: session.userId,
            approvedAt: startsAt,
          },
        }).catch(console.error);
      }

      // 3. If approved monthly subscription payment -> create or renew subscription active for 30 days
      if (payment.paymentType === 'subscription') {
        const startsAt = new Date();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db.subscription.create({
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency || 'XOF',
            status: 'active',
            startsAt,
            expiresAt,
            approvedBy: session.userId,
            approvedAt: startsAt,
          },
        });
      }
    }

    // 4. Log Admin Action
    await db.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: `PAYMENT_${action.toUpperCase()}`,
        targetTable: 'payments',
        targetId: paymentId,
        oldData: { status: payment.status },
        newData: { status: newPaymentStatus },
      },
    });

    // 5. Send notification to user
    await db.notification.create({
      data: {
        userId: payment.userId,
        title: action === 'approve' ? '✅ Paiement Approuvé !' : '❌ Paiement Rejeté',
        message: action === 'approve'
          ? `Votre paiement de ${payment.amount} FCFA (${payment.paymentType}) réf: ${payment.transactionReference} a été vérifié et approuvé avec succès !`
          : `Votre paiement de ${payment.amount} FCFA réf: ${payment.transactionReference} a été rejeté. Motif: ${rejectionReason || 'Vérification non concluante.'}`,
        type: 'payment',
        relatedId: paymentId,
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: `Paiement ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès.`,
    });
  } catch (error: any) {
    console.error('Erreur admin payments PATCH:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du traitement du paiement' }, { status: 500 });
  }
}
