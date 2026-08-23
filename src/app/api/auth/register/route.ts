import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      phone,
      password,
      role,
      fullName,
      firstName,
      lastName,
      companyName,
      taxId,
      photoUrl,
      idCardNumber,
      idCardFileUrl,
      vehicleType,
      brand,
      model,
      licensePlate,
      color,
      preferredZones,
      drivingLicenseUrl,
      vehicleDocUrl,
    } = body;

    const computedFullName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : (fullName || 'Utilisateur');

    if (!phone || !password || !computedFullName || !role) {
      return NextResponse.json({ error: 'Veuillez remplir tous les champs obligatoires' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { phone } });
    if (existingUser) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà enregistré' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Format preferred zones string
    const formattedZones = Array.isArray(preferredZones) ? preferredZones.join(', ') : (preferredZones || 'Ouaga-Centre, Ouaga 2000');

    const user = await db.user.create({
      data: {
        phone,
        passwordHash,
        role,
        isActive: role === 'ADMIN', // Require admin validation for non-admin accounts
        profile: {
          create: {
            fullName: computedFullName,
            avatarUrl: photoUrl || idCardFileUrl || null,
            companyName: companyName || computedFullName || null,
            taxId: idCardNumber || taxId || null,
            legalInfo: JSON.stringify({ idCardNumber: idCardNumber || null, idCardFileUrl: idCardFileUrl || null }),
            city: 'Ouagadougou',
          },
        },
        ...(role === 'LIVREUR'
          ? {
              driver: {
                create: {
                  verificationStatus: 'EN_ATTENTE',
                  idCardNumber: idCardNumber || 'Fichier pièce transmis',
                  preferredZones: formattedZones,
                  vehicles: {
                    create: {
                      vehicleType: vehicleType || 'MOTO',
                      brand: brand || 'Moto',
                      model: model || null,
                      licensePlate: licensePlate || null,
                      color: color || null,
                      photoUrl: body.vehiclePhotoUrl || photoUrl || null,
                    },
                  },
                  documents: {
                    create: [
                      ...(idCardFileUrl ? [{ docType: 'PIECE_RECTO_VERSO_PASSPORT', fileUrl: idCardFileUrl, status: 'EN_ATTENTE' }] : []),
                      ...(body.vehiclePhotoUrl ? [{ docType: 'PHOTO_MOTO_VEHICULE', fileUrl: body.vehiclePhotoUrl, status: 'EN_ATTENTE' }] : []),
                    ],
                  },
                },
              },
            }
          : {}),
      },
      include: {
        profile: true,
        driver: {
          include: {
            vehicles: true,
            documents: true,
          },
        },
      },
    });

    // Notify all Admin users about new registration awaiting validation
    const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } });
    const userRoleLabel = role === 'LIVREUR' ? 'Livreur' : role === 'COMMERCANT' ? 'Boutique / Commerçant' : 'Client Particulier';

    if (adminUsers.length > 0) {
      await db.notification.createMany({
        data: adminUsers.map((admin) => ({
          userId: admin.id,
          title: '📢 NOUVELLE INSCRIPTION À APPROUVER !',
          message: `L'utilisateur ${computedFullName} (${userRoleLabel}, Tél: ${phone}) s'est inscrit et attend la validation de son compte par l'administration.`,
          type: 'SYSTEM',
        })),
      });
    }

    // Auto-create default 1st month free subscription for both Livreur & Boutique
    if (role !== 'ADMIN') {
      const planCode = role === 'LIVREUR' ? 'LIVREUR' : 'COMMERCANT';
      let defaultPlan = await db.subscriptionPlan.findFirst({
        where: { code: planCode },
      });

      if (!defaultPlan) {
        defaultPlan = await db.subscriptionPlan.create({
          data: {
            code: planCode,
            name: role === 'LIVREUR' ? 'Plan Livreur Mensuel' : 'Plan Boutique Mensuel',
            priceFcfa: 1000,
            durationDays: 30,
          },
        });
      }

      await db.subscription.create({
        data: {
          userId: user.id,
          planId: defaultPlan.id,
          status: 'ACTIVE',
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const tokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      fullName: user.profile?.fullName || fullName,
    };

    const token = signToken(tokenPayload);

    const res = NextResponse.json({ success: true, user: tokenPayload });
    res.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'inscription' }, { status: 500 });
  }
}
