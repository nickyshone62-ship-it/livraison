import { db } from './db';

export interface PaymentInitiateParams {
  userId: string;
  type: 'SUBSCRIPTION' | 'DRIVER_VERIFICATION_FEE' | 'DELIVERY_COMMISSION';
  amountFcfa: number;
  paymentMethod: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE' | 'CASH';
  planId?: string;
}

export const PAYMENT_USSD_CONFIG = {
  ORANGE_MONEY: {
    merchantNumber: '06887330',
    ussdTemplate: (amount: number) => `*144*2*1*06887330*${amount}#`,
  },
  MOOV_MONEY: {
    merchantNumber: '62017878',
    ussdTemplate: (amount: number) => `*555*2*1*62017878*${amount}#`,
  },
  WAVE: {
    merchantNumber: '06887330',
  },
};

export function generateTransactionRef(prefix: string = 'PAY'): string {
  const dateStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
}

export async function processMobileMoneyPayment(params: PaymentInitiateParams) {
  const transactionReference = generateTransactionRef();

  // Create payment record in database
  const payment = await db.payment.create({
    data: {
      userId: params.userId,
      type: params.type,
      amountFcfa: params.amountFcfa,
      paymentMethod: params.paymentMethod,
      transactionReference,
      status: 'COMPLETED', // Auto-completed in demo mode / mobile money integration ready
    },
  });

  // If subscription payment, activate subscription for 30 days
  if (params.type === 'SUBSCRIPTION' && params.planId) {
    const plan = await db.subscriptionPlan.findUnique({ where: { id: params.planId } });
    if (plan) {
      // Cancel previous active subscriptions
      await db.subscription.updateMany({
        where: { userId: params.userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      const endsAt = new Date(Date.now() + (plan.durationDays || 30) * 24 * 60 * 60 * 1000);
      await db.subscription.create({
        data: {
          userId: params.userId,
          planId: plan.id,
          status: 'ACTIVE',
          startsAt: new Date(),
          endsAt,
          paymentId: payment.id,
        },
      });

      await db.notification.create({
        data: {
          userId: params.userId,
          title: '🎉 Abonnement Activé !',
          message: `Votre abonnement ${plan.name} a été activé avec succès par ${params.paymentMethod}. Valable jusqu'au ${endsAt.toLocaleDateString('fr-FR')}.`,
          type: 'PAYMENT',
        },
      });
    }
  }

  // If driver verification fee payment, update driver status to EN_VERIFICATION
  if (params.type === 'DRIVER_VERIFICATION_FEE') {
    const driver = await db.driver.findUnique({ where: { userId: params.userId } });
    if (driver) {
      await db.driver.update({
        where: { id: driver.id },
        data: { verificationStatus: 'EN_VERIFICATION' },
      });

      await db.notification.create({
        data: {
          userId: params.userId,
          title: '💳 Frais de vérification reçus !',
          message: `Votre paiement de ${params.amountFcfa} FCFA par ${params.paymentMethod} a été validé. Votre dossier est en cours de révision par l'administration.`,
          type: 'PAYMENT',
        },
      });
    }
  }

  // Audit Log
  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: `PAYMENT_${params.type}`,
      targetEntity: 'Payment',
      targetId: payment.id,
      detailsJson: JSON.stringify({ amountFcfa: params.amountFcfa, paymentMethod: params.paymentMethod, transactionReference }),
    },
  });

  return {
    success: true,
    payment,
    transactionReference,
  };
}
