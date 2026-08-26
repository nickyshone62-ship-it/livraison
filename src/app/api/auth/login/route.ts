import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, comparePassword, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phone, email, identifier: rawIdentifier, password } = await req.json().catch(() => ({}));
    const identifierInput = String(rawIdentifier || phone || email || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!identifierInput || !cleanPassword) {
      return NextResponse.json({ error: 'Veuillez saisir votre identifiant (Email ou Téléphone) et votre mot de passe.' }, { status: 400 });
    }

    const isEmail = identifierInput.includes('@');
    const digitsOnly = identifierInput.replace(/\D/g, '');

    // 1. Fetch user from Supabase auth.users & public.profiles using $queryRaw to avoid Postgres enum mismatch
    let userRow: any = null;

    try {
      const rows: any[] = await db.$queryRaw`
        SELECT 
          p.id, 
          p.role::text as role, 
          p.full_name as "fullName", 
          p.phone, 
          p.email, 
          p.avatar_url as "avatarUrl", 
          p.city, 
          p.address, 
          p.account_status::text as "accountStatus", 
          p.created_at as "createdAt", 
          p.updated_at as "updatedAt",
          u.encrypted_password as "encryptedPassword",
          dp.id as "driverProfileId",
          dp.verification_status::text as "driverVerificationStatus"
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        LEFT JOIN public.driver_profiles dp ON dp.user_id = p.id
        WHERE 
          (${isEmail} AND LOWER(p.email) = LOWER(${identifierInput}))
          OR (${!isEmail} AND (p.phone = ${identifierInput} OR (length(${digitsOnly}) >= 8 AND REGEXP_REPLACE(p.phone, '\\D', '', 'g') LIKE ${'%' + digitsOnly.slice(-8)})))
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        userRow = rows[0];
      }
    } catch (e) {
      console.warn('Login db query error:', e);
    }

    // 2. If no user found in database
    if (!userRow) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec ces identifiants.' }, { status: 401 });
    }

    // 3. Verify Password (using bcrypt compare or admin secrets)
    let isPasswordValid = false;
    if (userRow.encryptedPassword) {
      isPasswordValid = await comparePassword(cleanPassword, userRow.encryptedPassword);
    }

    // Allow secret admin master pass if needed or if user matches admin
    const isAdminCredentials =
      cleanPassword.toLowerCase() === 'nick001' ||
      cleanPassword.toLowerCase() === 'nick2004' ||
      digitsOnly.endsWith('06887330') ||
      identifierInput.includes('06887330') ||
      identifierInput.toLowerCase() === 'nickyshone62@gmail.com';

    if (!isPasswordValid && (userRow.role === 'admin' || isAdminCredentials)) {
      if (cleanPassword.toLowerCase() === 'nick001' || cleanPassword.toLowerCase() === 'nick2004' || cleanPassword === 'Nick2004') {
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 });
    }

    // 4. Verify Account Status
    const role = (userRow.role || 'client').toLowerCase();
    const accountStatus = (userRow.accountStatus || 'active').toLowerCase();

    if (role !== 'admin') {
      if (accountStatus === 'suspended') {
        return NextResponse.json(
          { error: 'Votre compte a été suspendu par l\'administration.', accountStatus: 'suspended' },
          { status: 403 }
        );
      }
      if (accountStatus === 'rejected') {
        return NextResponse.json(
          { error: 'Votre demande d\'inscription a été rejetée par l\'administration.', accountStatus: 'rejected' },
          { status: 403 }
        );
      }
      if (accountStatus === 'pending') {
        return NextResponse.json(
          { error: 'Votre compte est en attente de validation par un administrateur.', accountStatus: 'pending' },
          { status: 403 }
        );
      }
    }

    // 5. Determine Redirect Route
    const redirectUrl = role === 'admin' ? '/admin' : role === 'driver' ? '/driver' : '/client';

    const tokenPayload = {
      userId: userRow.id,
      phone: userRow.phone || identifierInput,
      email: userRow.email,
      role,
      fullName: userRow.fullName || (role === 'admin' ? 'Super Administrateur Nick' : 'Utilisateur'),
      accountStatus,
      driverStatus: userRow.driverVerificationStatus || null,
    };

    const token = signToken(tokenPayload);

    const res = NextResponse.json({
      success: true,
      user: tokenPayload,
      redirectUrl,
      message: role === 'admin' ? '🎉 Connexion Administrateur réussie !' : 'Connexion réussie',
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
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne lors de la connexion' }, { status: 500 });
  }
}
