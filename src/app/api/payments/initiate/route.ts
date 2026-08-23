import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { processMobileMoneyPayment } from '@/lib/payments';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type, amountFcfa, paymentMethod, planId } = await req.json();

    if (!type || !amountFcfa || !paymentMethod) {
      return NextResponse.json({ error: 'Informations de paiement incomplètes' }, { status: 400 });
    }

    const result = await processMobileMoneyPayment({
      userId: String(session.userId),
      type,
      amountFcfa: parseInt(amountFcfa),
      paymentMethod,
      planId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement du paiement Mobile Money' }, { status: 500 });
  }
}
