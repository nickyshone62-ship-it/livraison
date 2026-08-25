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

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true, driver: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable dans la base de données' }, { status: 404 });
    }

    // Approve and activate user account
    await db.user.update({
      where: { id: userId },
      data: { approvalStatus: 'APPROVED', isActive: true },
    });

    // If driver, update driver KYC verification status to VERIFIE
    if (user.driver) {
      await db.driver.update({
        where: { id: user.driver.id },
        data: { verificationStatus: 'VERIFIE' },
      });
    }

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'ADMIN_APPROVE_USER_VIA_EMAIL',
        targetEntity: 'USER',
        targetId: user.id,
        detailsJson: JSON.stringify({
          fullName: user.profile?.fullName,
          phone: user.phone,
          approvedAt: new Date().toISOString(),
          source: 'EMAIL_1_CLICK_LINK',
        }),
      },
    });

    // Create Notification for the user
    await db.notification.create({
      data: {
        userId: user.id,
        title: '🎉 COMPTE APPROUVÉ ET ACTIVÉ !',
        message: 'Félicitations ! Votre compte a été validé par la direction. Vous pouvez maintenant utiliser la plateforme.',
        type: 'SYSTEM',
      },
    });

    // Return HTML confirmation page for 1-click email approval
    const userName = user.profile?.fullName || user.phone;
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Compte Approuvé avec Succès - LivraisonOuaga</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #004D40; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .card { background: white; color: #004D40; border-radius: 2rem; padding: 40px; max-width: 480px; width: 100%; shadow: 0 20px 40px rgba(0,0,0,0.3); border: 4px border #009688; }
          .badge { background: #E6FFFA; color: #00796B; padding: 6px 16px; border-radius: 999px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 16px; border: 1px solid #B2DFDB; }
          h1 { font-size: 24px; font-weight: 900; margin: 8px 0; }
          p { font-size: 14px; color: #475569; font-weight: 600; line-height: 1.6; }
          .btn { display: inline-block; background: linear-gradient(135deg, #00E5D9, #009688); color: #004D40; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 999px; margin-top: 24px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✓ APPROBATION EFFECTUÉE EN 1 CLIC</div>
          <h1>Compte Activé !</h1>
          <p>Le compte de <strong>${userName}</strong> (${user.role}) a été approuvé et activé avec succès sur LivraisonOuaga.</p>
          <a href="/admin" class="btn">🚀 Accéder au Panneau Administrateur</a>
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
