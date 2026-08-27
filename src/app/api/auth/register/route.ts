import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { initiateUserPayment, getPlatformSettings } from '@/lib/payments';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      city,
      address,
      password,
      role: rawRole,
      vehicleType,
      brand,
      model,
      color,
      year,
      photoUrl,
      idCardRectoUrl,
      idCardVersoUrl,
      vehiclePhotoUrl,
      idCardFileUrl,
      driverLicenseUrl,
      vehicleDocUrl,
      paymentMethod,
      transactionReference,
    } = body;

    const role = (rawRole || 'client').toLowerCase() === 'driver' || (rawRole || '').toUpperCase() === 'LIVREUR' ? 'driver' : 'client';

    if (!phone || !password || !fullName) {
      return NextResponse.json({ error: 'Veuillez remplir tous les champs obligatoires (nom, téléphone, mot de passe).' }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // Check duplicate phone or email
    const existingPhoneRows: any[] = await db.$queryRaw`SELECT id FROM public.profiles WHERE phone = ${cleanPhone} LIMIT 1`;
    if (existingPhoneRows && existingPhoneRows.length > 0) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé par un autre compte.' }, { status: 400 });
    }

    if (cleanEmail) {
      const existingEmailRows: any[] = await db.$queryRaw`SELECT id FROM public.profiles WHERE email = ${cleanEmail} LIMIT 1`;
      if (existingEmailRows && existingEmailRows.length > 0) {
        return NextResponse.json({ error: 'Cette adresse email est déjà enregistrée.' }, { status: 400 });
      }
    }

    // Mandatory driver photos validation
    const rectoPhoto = idCardRectoUrl || idCardFileUrl;
    const versoPhoto = idCardVersoUrl;
    const enginPhoto = vehiclePhotoUrl || vehicleDocUrl;
    const profilePhoto = photoUrl;

    if (role === 'driver') {
      if (!profilePhoto) {
        return NextResponse.json({ error: 'La photo de profil est obligatoire pour le livreur.' }, { status: 400 });
      }
      if (!rectoPhoto || !versoPhoto) {
        return NextResponse.json({ error: 'La pièce d\'identité (Recto ET Verso) est obligatoire pour le livreur.' }, { status: 400 });
      }
      if (!enginPhoto) {
        return NextResponse.json({ error: 'La photo de l\'engin (véhicule) est obligatoire pour le livreur.' }, { status: 400 });
      }
    }

    const passwordHash = await hashPassword(password);
    const settings = await getPlatformSettings();
    const registrationFee = role === 'driver' 
      ? Number(settings.driver_registration_fee || 1500) 
      : Number(settings.client_registration_fee || 2000);

    // Create user profile ID (UUID)
    const crypto = require('crypto');
    const profileId = crypto.randomUUID();
    const userEmail = cleanEmail || `${cleanPhone}@livraisonouaga.bf`;

    // 1. Insert into auth.users first to satisfy foreign key constraint
    await db.$executeRaw`
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
      VALUES (${profileId}::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', ${userEmail}, ${passwordHash}, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    // 2. Upsert into public.profiles
    await db.$executeRaw`
      INSERT INTO public.profiles (id, role, full_name, phone, email, avatar_url, city, address, account_status, created_at, updated_at)
      VALUES (${profileId}::uuid, ${role}::user_role, ${fullName.trim()}, ${cleanPhone}, ${cleanEmail}, ${profilePhoto || null}, ${city || 'Ouagadougou'}, ${address || null}, 'pending'::account_status, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        account_status = EXCLUDED.account_status,
        updated_at = NOW();
    `;

    const profile = {
      id: profileId,
      role,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      avatarUrl: profilePhoto || null,
      city: city || 'Ouagadougou',
      address: address || null,
      accountStatus: 'pending',
    };

    // If driver, create driver_profile, vehicle, and driver_documents
    let driverProfile = null;
    if (role === 'driver') {
      driverProfile = await db.driverProfile.create({
        data: {
          userId: profile.id,
          verificationStatus: 'pending',
          isAvailable: false,
          vehicles: {
            create: {
              vehicleType: (vehicleType === 'moto' || !vehicleType) ? 'motorcycle' : (vehicleType as any),
              brand: brand || null,
              model: model || null,
              color: color || null,
              year: year ? parseInt(year, 10) : null,
              isPrimary: true,
            },
          },
          documents: {
            create: [
              ...(rectoPhoto ? [{ documentType: 'identity_card_recto', fileUrl: rectoPhoto, status: 'pending' as const }] : []),
              ...(versoPhoto ? [{ documentType: 'identity_card_verso', fileUrl: versoPhoto, status: 'pending' as const }] : []),
              ...(enginPhoto ? [{ documentType: 'vehicle_photo', fileUrl: enginPhoto, status: 'pending' as const }] : []),
              ...(profilePhoto ? [{ documentType: 'photo', fileUrl: profilePhoto, status: 'pending' as const }] : []),
              ...(driverLicenseUrl ? [{ documentType: 'driver_license', fileUrl: driverLicenseUrl, status: 'pending' as const }] : []),
            ],
          },
        },
      });
    }

    // Initiate Registration Payment (ALWAYS status 'pending' awaiting Admin verification)
    const selectedMethod = (paymentMethod || 'orange_money').toLowerCase();
    await initiateUserPayment({
      userId: profile.id,
      paymentType: role === 'driver' ? 'driver_registration' : 'client_registration',
      amount: registrationFee,
      paymentMethod: selectedMethod,
      transactionReference: transactionReference || undefined,
      notes: `Paiement d'inscription (${role === 'driver' ? 'Livreur' : 'Client'})`,
    });

    // Sign session token
    const token = signToken({
      userId: profile.id,
      phone: profile.phone || '',
      email: profile.email,
      role: profile.role,
      fullName: profile.fullName || 'Utilisateur',
      accountStatus: 'pending',
      driverStatus: driverProfile ? driverProfile.verificationStatus : undefined,
    });

    const response = NextResponse.json({
      success: true,
      accountStatus: 'pending',
      message: 'Compte créé avec succès. Votre paiement est en attente de vérification par un administrateur.',
      user: {
        id: profile.id,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
        accountStatus: 'pending',
      },
    });

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'inscription' }, { status: 500 });
  }
}
