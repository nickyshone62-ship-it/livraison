import { db } from './db';

export interface PaymentInitiateParams {
  userId: string;
  paymentType: 'client_registration' | 'driver_registration' | 'monthly_subscription' | string;
  amount: number;
  paymentMethod: 'orange_money' | 'moov_money' | 'wave' | string;
  recipientPhone?: string;
  transactionReference?: string;
  notes?: string;
}

export async function getPlatformSettings() {
  const settingsRows = await db.platformSetting.findMany();
  const settings: Record<string, any> = {
    client_registration_fee: 2000,
    driver_registration_fee: 1500,
    monthly_subscription_fee: 1000,
    delivery_commission: 0,
    orange_money_number: '06887330',
    orange_money_ussd: '*144*2*1*06887330*{montant}#',
    moov_money_number: '62017878',
    moov_money_ussd: '*555*2*1*62017878*{montant}#',
    wave_number: '06887330',
  };

  for (const s of settingsRows) {
    settings[s.settingKey] = s.settingValue;
  }

  return settings;
}

export function generateTransactionRef(prefix: string = 'PAY'): string {
  const dateStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
}

export async function initiateUserPayment(params: PaymentInitiateParams) {
  const ref = params.transactionReference || generateTransactionRef();

  const pType = (params.paymentType.includes('registration') ? 'registration' : 'subscription') as any;
  const pMethod = (['orange_money', 'moov_money', 'wave'].includes(params.paymentMethod) ? params.paymentMethod : 'orange_money') as any;

  // Mandatory: Payment ALWAYS created with status 'pending' until Admin verifies
  const payment = await db.payment.create({
    data: {
      userId: params.userId,
      paymentType: pType,
      amount: params.amount,
      currency: 'XOF',
      paymentMethod: pMethod,
      recipientPhone: params.recipientPhone || null,
      transactionReference: ref,
      status: 'pending',
      notes: params.notes || null,
    },
  });

  // Notify Admins in notifications table
  const admins = await db.profile.findMany({ where: { role: 'admin' } });
  if (admins.length > 0) {
    await db.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        title: '💳 Nouveau paiement à vérifier',
        message: `Paiement de ${params.amount} FCFA (${params.paymentType}, ${params.paymentMethod}) réf ${ref} soumis par un utilisateur.`,
        type: 'payment',
        relatedId: payment.id,
      })),
    });
  }

  return {
    success: true,
    payment,
    transactionReference: ref,
    message: 'Paiement enregistré avec succès. Il est en attente de vérification par un administrateur.',
  };
}

export async function processMobileMoneyPayment(params: {
  userId: string;
  type: string;
  amountFcfa: number;
  paymentMethod: string;
  planId?: string;
}) {
  return initiateUserPayment({
    userId: params.userId,
    paymentType: params.type,
    amount: params.amountFcfa,
    paymentMethod: params.paymentMethod,
  });
}
