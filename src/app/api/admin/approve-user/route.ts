import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
    }

    const profile = await db.profile.findUnique({
      where: { id: userId },
      include: { driverProfile: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Utilisateur introuvable dans la base de données' }, { status: 404 });
    }

    // Approve and activate user account
    await db.profile.update({
      where: { id: userId },
      data: { accountStatus: 'active' },
    });

    // Create 30-day active subscription upon approval if not exists
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    await db.subscription.create({
      data: {
        userId: profile.id,
        amount: 1000,
        currency: 'XOF',
        status: 'active',
        startsAt,
        expiresAt,
        approvedAt: startsAt,
      },
    }).catch(console.error);

    // If driver, update driver KYC verification status to approved
    if (profile.driverProfile) {
      await db.driverProfile.update({
        where: { id: profile.driverProfile.id },
        data: { verificationStatus: 'approved', approvedAt: new Date() },
      });
    }

    // Create Notification for the user
    await db.notification.create({
      data: {
        userId: profile.id,
        title: '🎉 COMPTE APPROUVÉ ET ACTIVÉ !',
        message: 'Félicitations ! Votre compte a été validé par l\'administration. Vous pouvez maintenant utiliser la plateforme.',
        type: 'account',
      },
    });

    // Return HTML confirmation page for 1-click email approval
    const userName = profile.fullName || profile.phone || 'Utilisateur';
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Compte Approuvé avec Succès - LivraisonOuaga</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .card { background: #1e293b; color: white; border-radius: 1.5rem; padding: 40px; max-width: 480px; width: 100%; border: 1px solid #334155; }
          .badge { background: rgba(16, 185, 129, 0.1); color: #34d399; padding: 6px 16px; border-radius: 999px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 16px; border: 1px solid rgba(16, 185, 129, 0.2); }
          h1 { font-size: 24px; font-weight: 900; margin: 8px 0; }
          p { font-size: 14px; color: #94a3b8; font-weight: 500; line-height: 1.6; }
          .btn { display: inline-block; background: linear-gradient(to right, #f59e0b, #ea580c); color: white; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 999px; margin-top: 24px; font-size: 13px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✓ APPROBATION EFFECTUÉE</div>
          <h1>Compte Activé !</h1>
          <p>Le compte de <strong>${userName}</strong> (${profile.role}) a été approuvé et activé avec succès sur LivraisonOuaga.</p>
          <a href="/admin" class="btn">Accéder au Panneau Administrateur</a>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('Approve user via email error:', error);
    return NextResponse.json({ error: 'Erreur lors de la validation du compte' }, { status: 500 });
  }
}
