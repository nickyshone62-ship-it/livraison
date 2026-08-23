import { NextResponse } from 'next/server';
import { signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { code, pin, password } = await req.json().catch(() => ({}));
    const secretInput = String(code || pin || password || '').trim();

    if (secretInput !== 'Nick2004') {
      return NextResponse.json({ error: '⚠️ Code Administrateur Incorrect' }, { status: 401 });
    }

    // Try finding or upserting an admin record safely, but NEVER crash if DB has an issue
    let adminUserId = 'super-admin-nick2004';
    let adminFullName = 'Super Administrateur Nick';
    let adminPhone = '+226 06 88 73 30';

    try {
      let dbAdmin = await db.user.findFirst({
        where: { role: 'ADMIN' },
        include: { profile: true },
      });

      if (!dbAdmin) {
        // Try creating or updating first user to ADMIN
        const firstUser = await db.user.findFirst();
        if (firstUser) {
          dbAdmin = await db.user.update({
            where: { id: firstUser.id },
            data: { role: 'ADMIN', isActive: true },
            include: { profile: true },
          });
        }
      }

      if (dbAdmin) {
        adminUserId = dbAdmin.id;
        adminPhone = dbAdmin.phone;
        if (dbAdmin.profile?.fullName) {
          adminFullName = dbAdmin.profile.fullName;
        }
      }
    } catch (e) {
      console.warn('DB lookup skipped for master admin login:', e);
    }

    const tokenPayload = {
      userId: adminUserId,
      phone: adminPhone,
      role: 'ADMIN',
      fullName: adminFullName,
    };

    const token = signToken(tokenPayload);

    const res = NextResponse.json({
      success: true,
      user: tokenPayload,
      redirectUrl: '/admin',
      message: '🎉 Connexion Administrateur réussie !',
    });

    res.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la connexion administrateur' }, { status: 500 });
  }
}
