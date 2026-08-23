import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Téléphone et mot de passe requis' }, { status: 400 });
    }

    // MASTER ADMIN PASSCODE LOGIN ("Nick2004" / Master Admin Phone)
    const cleanPhone = String(phone).replace(/\s+/g, '');
    const isMasterAdminCode = 
      password === 'Nick2004' || 
      phone === 'Nick2004' || 
      cleanPhone === '06887330' || 
      cleanPhone === '+22606887330';

    if (isMasterAdminCode) {
      let adminUser = await db.user.findFirst({
        where: { role: 'ADMIN' },
        include: { profile: true },
      });

      if (!adminUser) {
        // Auto-create Master Admin Account with proper hashed password
        const adminPasswordHash = await hashPassword('Nick2004');
        adminUser = await db.user.create({
          data: {
            phone: '+226 06 88 73 30',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            isActive: true,
            profile: {
              create: {
                fullName: 'Super Administrateur Nick',
                city: 'Ouagadougou',
              },
            },
          },
          include: { profile: true },
        });
      }

      const tokenPayload = {
        userId: adminUser.id,
        phone: adminUser.phone,
        role: 'ADMIN',
        fullName: adminUser.profile?.fullName || 'Administrateur Principal',
      };

      const token = signToken(tokenPayload);

      const res = NextResponse.json({
        success: true,
        user: tokenPayload,
        redirectUrl: '/admin',
      });

      res.cookies.set(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    const user = await db.user.findUnique({
      where: { phone },
      include: { profile: true, driver: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Votre compte est suspendu. Veuillez contacter le support.' }, { status: 403 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      fullName: user.profile?.fullName || 'Utilisateur',
    };

    const token = signToken(tokenPayload);

    const res = NextResponse.json({
      success: true,
      user: tokenPayload,
      driverStatus: user.driver?.verificationStatus || null,
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
    return NextResponse.json({ error: 'Erreur de connexion' }, { status: 500 });
  }
}
