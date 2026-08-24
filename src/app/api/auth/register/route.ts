import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { sendAdminNewUserAlertEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      phone,
      email,
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
      paymentMethod,
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
        email: email ? email.toLowerCase().trim() : null,
        passwordHash,
        role,
        isActive: role === 'ADMIN',
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
    let adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } });
    if (adminUsers.length === 0) {
      const adminHash = await hashPassword('Nick2004');
      const defaultAdmin = await db.user.create({
        data: {
          phone: '+226 70 00 00 00',
          email: 'admin@livraison-ouaga.bf',
          passwordHash: adminHash,
          role: 'ADMIN',
          isActive: true,
          profile: { create: { fullName: 'Super Administrateur Nick', city: 'Ouagadougou' } },
        },
      });
      adminUsers = [defaultAdmin];
    }

    const userRoleLabel = role === 'LIVREUR' ? 'Livreur (KYC & Documents à vérifier)' : role === 'COMMERCANT' ? 'Boutique / Commerçant' : 'Client Particulier';

    await db.notification.createMany({
      data: adminUsers.map((admin) => ({
        userId: admin.id,
        title: role === 'LIVREUR' ? '🛵 NOUVEAU LIVREUR À VALIDER !' : '🏪 NOUVELLE BOUTIQUE INSCRITE !',
        message: `L'utilisateur ${computedFullName} (${userRoleLabel}, Tél: ${phone}) vient de s'inscrire et attend la validation de son compte.`,
        type: 'SYSTEM',
      })),
    });

    console.log(`📱 [SMS/WhatsApp envoyé à l'Admin (+226 70 00 00 00)] : ${role === 'LIVREUR' ? '🛵 NOUVEAU LIVREUR' : '🏪 NOUVELLE BOUTIQUE'} - ${computedFullName} (Tél: ${phone}) s'est inscrit et attend votre validation.`);

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

    // Trigger Admin Email Alert with candidate details and 1-click approval link
    await sendAdminNewUserAlertEmail({
      userId: user.id,
      fullName: computedFullName,
      phone,
      email: email || null,
      role,
      idCardNumber,
      idCardFileUrl,
      photoUrl,
      vehicleType,
      brand,
      preferredZones: formattedZones,
      paymentMethod,
    });

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
