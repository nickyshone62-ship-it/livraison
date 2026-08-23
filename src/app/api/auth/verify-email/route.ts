import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token) {
      return NextResponse.json({ error: 'Token de vérification d\'email manquant' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        emailVerifyToken: token,
        ...(email ? { email: email.toLowerCase().trim() } : {}),
      },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Lien de vérification invalide ou expiré' }, { status: 404 });
    }

    // Activate email verification
    await db.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    // Create confirmation notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: '📧 Email Confirmé avec Succès !',
        message: 'Votre adresse e-mail a été vérifiée avec succès. Bienvenue sur LivraisonOuaga !',
        type: 'SYSTEM',
      },
    });

    return NextResponse.json({
      success: true,
      message: '🎉 Votre adresse e-mail a été validée avec succès !',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Erreur lors de la validation de l\'adresse email' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { token, email } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token de vérification manquant' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        emailVerifyToken: token,
        ...(email ? { email: email.toLowerCase().trim() } : {}),
      },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Lien de vérification invalide ou expiré' }, { status: 404 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: '🎉 Adresse email vérifiée avec succès !',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
