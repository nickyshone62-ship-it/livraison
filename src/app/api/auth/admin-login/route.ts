import { NextResponse } from 'next/server';
import { signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { code, pin, password } = await req.json().catch(() => ({}));
    const secretInput = String(code || pin || password || '').trim().toLowerCase();

    if (!secretInput) {
      return NextResponse.json({ error: 'Veuillez saisir votre code secret administrateur' }, { status: 400 });
    }

    const validCodes = ['nick001', 'nick2004', (process.env.ADMIN_SECRET_CODE || 'nick2004').toLowerCase()];
    const isValid = validCodes.includes(secretInput);

    if (!isValid) {
      return NextResponse.json({ error: '⚠️ Code Administrateur Incorrect !' }, { status: 401 });
    }

    let adminProfile: any = null;
    try {
      const rawResult: any[] = await db.$queryRaw`
        SELECT id, role::text as role, full_name as "fullName", phone, email, account_status::text as "accountStatus"
        FROM public.profiles
        WHERE role::text = 'admin'
        LIMIT 1
      `;
      if (rawResult && rawResult.length > 0) {
        adminProfile = rawResult[0];
      }
    } catch (e) {
      console.warn('Admin queryRaw warning:', e);
    }

    const tokenPayload = {
      userId: adminProfile?.id || '3e60767a-fac7-4c5a-bca3-36bbba9b81d5',
      phone: adminProfile?.phone || '+22606887330',
      email: adminProfile?.email || 'nickyshone62@gmail.com',
      role: 'admin',
      fullName: adminProfile?.fullName || 'Super Administrateur Nick',
      accountStatus: 'active',
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
    return NextResponse.json({ error: 'Erreur lors de la vérification du code' }, { status: 500 });
  }
}
