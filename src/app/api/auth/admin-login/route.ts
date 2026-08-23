import { NextResponse } from 'next/server';
import { hashPassword, comparePassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { code, pin, password } = await req.json().catch(() => ({}));
    const secretInput = String(code || pin || password || '').trim();

    if (!secretInput) {
      return NextResponse.json({ error: 'Veuillez saisir votre code secret administrateur' }, { status: 400 });
    }

    // Master secret code check (case insensitive 'nick2004' or custom env ADMIN_SECRET_CODE)
    const masterCode = (process.env.ADMIN_SECRET_CODE || 'Nick2004').trim();
    let isValid = secretInput.toLowerCase() === masterCode.toLowerCase();

    let adminUserId = 'super-admin-nick2004';
    let adminFullName = 'Super Administrateur Nick';
    let adminPhone = '+226 70 00 00 00';

    try {
      let dbAdmin = await db.user.findFirst({
        where: {
          OR: [
            { role: 'ADMIN' },
            { phone: '+226 70 00 00 00' },
            { phone: '+226 06 88 73 30' },
          ],
        },
        include: { profile: true },
      });

      // Also check against admin user's hashed password in the database
      if (dbAdmin && dbAdmin.passwordHash) {
        const dbPassMatch = await comparePassword(secretInput, dbAdmin.passwordHash);
        if (dbPassMatch) {
          isValid = true;
        }
      }

      if (!isValid) {
        return NextResponse.json({ error: '⚠️ Code Administrateur Incorrect ! Veuillez vérifier votre code secret.' }, { status: 401 });
      }

      if (!dbAdmin) {
        const adminHash = await hashPassword('Nick2004');
        dbAdmin = await db.user.create({
          data: {
            phone: '+226 70 00 00 00',
            email: 'admin@livraison-ouaga.bf',
            passwordHash: adminHash,
            role: 'ADMIN',
            isActive: true,
            isEmailVerified: true,
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

      if (dbAdmin) {
        adminUserId = dbAdmin.id;
        adminPhone = dbAdmin.phone;
        if (dbAdmin.profile?.fullName) {
          adminFullName = dbAdmin.profile.fullName;
        }
      }
    } catch (e) {
      console.warn('DB lookup skipped for admin login:', e);
      if (!isValid) {
        return NextResponse.json({ error: '⚠️ Code Administrateur Incorrect' }, { status: 401 });
      }
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
    return NextResponse.json({ error: 'Erreur lors de la vérification du code administrateur' }, { status: 500 });
  }
}
