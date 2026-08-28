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

    let targetProfileId: string | null = null;

    // Check duplicate phone
    const existingPhoneRows: any[] = await db.$queryRaw`
      SELECT id, account_status::text as "accountStatus" 
      FROM public.profiles 
      WHERE phone = ${cleanPhone} 
      LIMIT 1
    `;

    if (existingPhoneRows && existingPhoneRows.length > 0) {
      const existingStatus = (existingPhoneRows[0].accountStatus || '').toLowerCase();
      if (existingStatus === 'active' || existingStatus === 'approved' || existingStatus === 'suspended') {
        return NextResponse.json(
          { error: 'Ce numéro de téléphone est déjà associé à un compte validé ou actif. Vous ne pouvez pas créer un nouveau compte avec ce numéro.' },
          { status: 400 }
        );
      }
      // If rejected or pending, allow user to reuse & update their profile!
      targetProfileId = existingPhoneRows[0].id;
    }

    // Check duplicate email
    if (cleanEmail) {
      const existingEmailRows: any[] = await db.$queryRaw`
        SELECT id, account_status::text as "accountStatus" 
        FROM public.profiles 
        WHERE LOWER(email) = LOWER(${cleanEmail}) 
        LIMIT 1
      `;
      if (existingEmailRows && existingEmailRows.length > 0) {
        const existingEmailUser = existingEmailRows[0];
        const existingStatus = (existingEmailUser.accountStatus || '').toLowerCase();
        if (existingEmailUser.id !== targetProfileId) {
          if (existingStatus === 'active' || existingStatus === 'approved' || existingStatus === 'suspended') {
            return NextResponse.json(
              { error: 'Cette adresse email est déjà enregistrée pour un compte actif.' },
              { status: 400 }
            );
          } else {
            targetProfileId = existingEmailUser.id;
          }
        }
      }
    }

    // Mandatory photos validation for Driver & Client
    const rectoPhoto = idCardRectoUrl || idCardFileUrl;
    const versoPhoto = idCardVersoUrl;
    const enginPhoto = vehiclePhotoUrl || vehicleDocUrl;
    const profilePhoto = photoUrl;

    if (role === 'driver') {
      if (!profilePhoto && !targetProfileId) {
        return NextResponse.json({ error: 'La photo de profil est obligatoire pour le livreur.' }, { status: 400 });
      }
      if ((!rectoPhoto || !versoPhoto) && !targetProfileId) {
        return NextResponse.json({ error: 'La pièce d\'identité (Recto ET Verso) est obligatoire pour le livreur.' }, { status: 400 });
      }
      if (!enginPhoto && !targetProfileId) {
        return NextResponse.json({ error: 'La photo de l\'engin (véhicule) est obligatoire pour le livreur.' }, { status: 400 });
      }
    }

    if (role === 'client') {
      if ((!rectoPhoto || !versoPhoto) && !targetProfileId) {
        return NextResponse.json({ error: 'La pièce d\'identité (Recto ET Verso) est obligatoire pour le client.' }, { status: 400 });
      }
    }

    const passwordHash = await hashPassword(password);
    const settings = await getPlatformSettings();
    const registrationFee = role === 'driver' 
      ? Number(settings.driver_registration_fee || 1500) 
      : Number(settings.client_registration_fee || 2000);

    const crypto = require('crypto');
    const profileId = targetProfileId || crypto.randomUUID();
    const userEmail = cleanEmail || `${cleanPhone}@livraisonouaga.bf`;

    // Ensure columns exist on profiles table
    await db.$executeRaw`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_updated_at timestamp with time zone;`.catch(() => {});
    await db.$executeRaw`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS previous_rejection_reason text;`.catch(() => {});
    await db.$executeRaw`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_resubmitted boolean DEFAULT false;`.catch(() => {});

    // Check if previous account was rejected
    let previousRejectionReason: string | null = null;
    let wasRejected = false;
    if (targetProfileId) {
      const prevRows = (await db.$queryRaw`
        SELECT account_status::text as "accountStatus", rejection_reason as "rejectionReason"
        FROM public.profiles
        WHERE id = ${targetProfileId}::uuid
        LIMIT 1
      `) as any[];
      if (prevRows && prevRows.length > 0 && prevRows[0].accountStatus === 'rejected') {
        wasRejected = true;
        previousRejectionReason = prevRows[0].rejectionReason || 'Non conforme';
      }
    }

    // 1. Upsert into auth.users (Met à jour le mot de passe si réutilisation d'un compte rejeté)
    await db.$executeRaw`
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
      VALUES (${profileId}::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', ${userEmail}, ${passwordHash}, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET 
        encrypted_password = EXCLUDED.encrypted_password,
        updated_at = NOW();
    `;

    // 2. Upsert into public.profiles (Réinitialise account_status à 'pending', enregistre la ré-soumission)
    if (wasRejected) {
      await db.$executeRaw`
        INSERT INTO public.profiles (id, role, full_name, phone, email, avatar_url, city, address, cni_recto_url, cni_verso_url, account_status, rejection_reason, previous_rejection_reason, is_resubmitted, document_updated_at, created_at, updated_at)
        VALUES (${profileId}::uuid, ${role}::user_role, ${fullName.trim()}, ${cleanPhone}, ${cleanEmail}, ${profilePhoto || null}, ${city || 'Ouagadougou'}, ${address || null}, ${rectoPhoto || null}, ${versoPhoto || null}, 'pending'::account_status, NULL, ${previousRejectionReason}, true, NOW(), NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          role = EXCLUDED.role,
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
          city = EXCLUDED.city,
          address = EXCLUDED.address,
          cni_recto_url = COALESCE(EXCLUDED.cni_recto_url, public.profiles.cni_recto_url),
          cni_verso_url = COALESCE(EXCLUDED.cni_verso_url, public.profiles.cni_verso_url),
          account_status = 'pending'::account_status,
          previous_rejection_reason = ${previousRejectionReason},
          rejection_reason = NULL,
          is_resubmitted = true,
          document_updated_at = NOW(),
          updated_at = NOW();
      `;

      // Notify Admins about resubmitted documents
      try {
        const admins = await db.profile.findMany({ where: { role: 'admin' } });
        for (const admin of admins) {
          await db.notification.create({
            data: {
              userId: admin.id,
              title: '📄 Pièce mise à jour (Re-soumission)',
              message: `L'utilisateur ${fullName.trim()} (${cleanPhone}) a mis à jour ses pièces justificatives suite au rejet de son compte ("${previousRejectionReason}"). À vérifier par l'admin.`,
              type: 'system',
              relatedId: profileId,
            },
          }).catch(() => {});
        }
      } catch (errNotif) {}
    } else {
      await db.$executeRaw`
        INSERT INTO public.profiles (id, role, full_name, phone, email, avatar_url, city, address, cni_recto_url, cni_verso_url, account_status, rejection_reason, created_at, updated_at)
        VALUES (${profileId}::uuid, ${role}::user_role, ${fullName.trim()}, ${cleanPhone}, ${cleanEmail}, ${profilePhoto || null}, ${city || 'Ouagadougou'}, ${address || null}, ${rectoPhoto || null}, ${versoPhoto || null}, 'pending'::account_status, NULL, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          role = EXCLUDED.role,
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
          city = EXCLUDED.city,
          address = EXCLUDED.address,
          cni_recto_url = COALESCE(EXCLUDED.cni_recto_url, public.profiles.cni_recto_url),
          cni_verso_url = COALESCE(EXCLUDED.cni_verso_url, public.profiles.cni_verso_url),
          account_status = 'pending'::account_status,
          rejection_reason = NULL,
          updated_at = NOW();
      `;
    }

    const profile = {
      id: profileId,
      role,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      avatarUrl: profilePhoto || null,
      cniRectoUrl: rectoPhoto || null,
      cniVersoUrl: versoPhoto || null,
      city: city || 'Ouagadougou',
      address: address || null,
      accountStatus: 'pending',
    };

    // If driver, upsert driver_profile, vehicle, and driver_documents
    let driverProfile = null;
    if (role === 'driver') {
      await db.$executeRaw`
        INSERT INTO public.driver_profiles (user_id, verification_status, rejection_reason, is_available, created_at, updated_at)
        VALUES (${profile.id}::uuid, 'pending'::driver_verification_status, NULL, false, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          verification_status = 'pending'::driver_verification_status,
          rejection_reason = NULL,
          updated_at = NOW();
      `;

      try {
        await db.vehicle.create({
          data: {
            driverId: (await db.driverProfile.findUnique({ where: { userId: profile.id } }))?.id || profile.id,
            vehicleType: (vehicleType === 'moto' || !vehicleType) ? 'motorcycle' : (vehicleType as any),
            brand: brand || null,
            model: model || null,
            color: color || null,
            year: year ? parseInt(year, 10) : null,
            isPrimary: true,
          },
        });
      } catch (eVeh) {}

      driverProfile = { verificationStatus: 'pending' };
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
