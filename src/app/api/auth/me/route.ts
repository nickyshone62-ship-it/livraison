import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let profile: any = null;

    if (isUUID(session.userId)) {
      try {
        const rows: any[] = await db.$queryRaw`
          SELECT 
            p.id, 
            p.role::text as role, 
            p.full_name as "fullName", 
            p.phone, 
            p.email, 
            p.avatar_url as "avatarUrl", 
            p.cni_recto_url as "cniRectoUrl", 
            p.cni_verso_url as "cniVersoUrl", 
            p.city, 
            p.address, 
            p.account_status::text as "accountStatus", 
            COALESCE(p.rejection_reason, dp.rejection_reason) as "rejectionReason",
            p.created_at as "createdAt", 
            p.updated_at as "updatedAt",
            dp.id as "driverProfileId",
            dp.verification_status::text as "driverVerificationStatus",
            dp.is_available as "driverIsAvailable"
          FROM public.profiles p
          LEFT JOIN public.driver_profiles dp ON dp.user_id = p.id
          WHERE p.id = ${session.userId}::uuid
          LIMIT 1
        `;
        if (rows && rows.length > 0) {
          const r = rows[0];
          
          let driverDocs: any[] = [];
          let vehiclePhotoUrl: string | null = null;

          if (r.driverProfileId) {
            try {
              driverDocs = await db.driverDocument.findMany({
                where: { driverId: r.driverProfileId },
                orderBy: { createdAt: 'desc' },
              });
              const vehDoc = driverDocs.find(d => d.documentType === 'vehicle_photo');
              if (vehDoc) vehiclePhotoUrl = vehDoc.fileUrl;
            } catch (eDoc) {}
          }

          profile = {
            id: r.id,
            role: r.role,
            fullName: r.fullName,
            phone: r.phone,
            email: r.email,
            avatarUrl: r.avatarUrl,
            cniRectoUrl: r.cniRectoUrl,
            cniVersoUrl: r.cniVersoUrl,
            vehiclePhotoUrl,
            city: r.city,
            address: r.address,
            accountStatus: r.accountStatus,
            rejectionReason: r.rejectionReason || null,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            driverProfile: r.driverProfileId ? {
              id: r.driverProfileId,
              verificationStatus: r.driverVerificationStatus,
              isAvailable: r.driverIsAvailable,
              rejectionReason: r.rejectionReason || null,
              documents: driverDocs,
            } : null,
            subscriptions: [],
            payments: [],
          };

          // Fetch user subscriptions
          const userSubs = await db.subscription.findMany({
            where: { userId: profile.id },
            orderBy: { createdAt: 'desc' },
          });
          profile.subscriptions = userSubs;
        }
      } catch (e) {
        console.warn('Profile findUnique failed:', e);
      }
    }

    if (!profile) {
      if ((session.role || '').toLowerCase() === 'admin') {
        return NextResponse.json({
          user: {
            id: session.userId || '3e60767a-fac7-4c5a-bca3-36bbba9b81d5',
            phone: session.phone || '+226 06 88 73 30',
            email: session.email || 'nickyshone62@gmail.com',
            role: 'admin',
            accountStatus: 'active',
            fullName: session.fullName || 'Super Administrateur Nick',
            driverProfile: null,
            activeSubscription: null,
            isPaymentApproved: true,
            isSubscriptionActive: true,
            canUsePlatform: true,
          },
        });
      }
      return NextResponse.json({ user: null }, { status: 404 });
    }

    const activeSub = profile.subscriptions.find(
      (s: any) => s.status === 'active' && s.expiresAt && new Date(s.expiresAt) > new Date()
    ) || null;

    const isAdmin = (profile.role || '').toLowerCase() === 'admin';
    const isPaymentApproved = isAdmin || profile.accountStatus === 'active' || profile.accountStatus === 'approved';
    const isSubscriptionActive = isAdmin || !!activeSub;
    const canUsePlatform = isAdmin || (isPaymentApproved && isSubscriptionActive);

    const res = NextResponse.json({
      user: {
        id: profile.id,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName,
        city: profile.city,
        address: profile.address,
        avatarUrl: profile.avatarUrl,
        cniRectoUrl: profile.cniRectoUrl,
        cniVersoUrl: profile.cniVersoUrl,
        vehiclePhotoUrl: profile.vehiclePhotoUrl,
        accountStatus: profile.accountStatus,
        rejectionReason: profile.rejectionReason || null,
        driverProfile: profile.driverProfile,
        activeSubscription: activeSub || profile.subscriptions[0] || null,
        isPaymentApproved,
        isSubscriptionActive,
        canUsePlatform,
        payments: profile.payments,
      },
    });

    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  } catch (error: any) {
    console.error('Erreur me route:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du profil' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { isAvailable, fullName, phone, city, address, avatarUrl, cniRectoUrl, cniVersoUrl, vehiclePhotoUrl } = body;

    if (isAvailable !== undefined) {
      await db.$executeRaw`
        UPDATE public.driver_profiles
        SET is_available = ${Boolean(isAvailable)}, updated_at = NOW()
        WHERE user_id = ${session.userId}::uuid
      `;
    }

    const updates: string[] = [];
    if (fullName !== undefined) updates.push(`full_name = ${fullName ? `'${fullName.replace(/'/g, "''")}'` : 'NULL'}`);
    if (phone !== undefined) updates.push(`phone = ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'}`);
    if (city !== undefined) updates.push(`city = ${city ? `'${city.replace(/'/g, "''")}'` : 'NULL'}`);
    if (address !== undefined) updates.push(`address = ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'}`);

    if (avatarUrl !== undefined) {
      await db.profile.update({
        where: { id: session.userId },
        data: { avatarUrl: avatarUrl || null },
      }).catch(async () => {
        await db.$executeRaw`UPDATE public.profiles SET avatar_url = ${avatarUrl || null} WHERE id = ${session.userId}::uuid`;
      });
    }

    if (cniRectoUrl !== undefined) {
      await db.profile.update({
        where: { id: session.userId },
        data: { cniRectoUrl: cniRectoUrl || null },
      }).catch(async () => {
        await db.$executeRaw`UPDATE public.profiles SET cni_recto_url = ${cniRectoUrl || null} WHERE id = ${session.userId}::uuid`;
      });
    }

    if (cniVersoUrl !== undefined) {
      await db.profile.update({
        where: { id: session.userId },
        data: { cniVersoUrl: cniVersoUrl || null },
      }).catch(async () => {
        await db.$executeRaw`UPDATE public.profiles SET cni_verso_url = ${cniVersoUrl || null} WHERE id = ${session.userId}::uuid`;
      });
    }

    if (fullName || phone || city || address) {
      await db.$executeRaw`
        UPDATE public.profiles
        SET 
          full_name = COALESCE(${fullName || null}, full_name),
          phone = COALESCE(${phone || null}, phone),
          city = COALESCE(${city || null}, city),
          address = COALESCE(${address || null}, address),
          updated_at = NOW()
        WHERE id = ${session.userId}::uuid
      `;
    }

    // Vehicle photo update for drivers
    if (vehiclePhotoUrl !== undefined) {
      let driverProfile = await db.driverProfile.findUnique({
        where: { userId: session.userId },
      });

      if (!driverProfile) {
        driverProfile = await db.driverProfile.create({
          data: { userId: session.userId, isAvailable: true },
        });
      }

      if (driverProfile) {
        const existingDoc = await db.driverDocument.findFirst({
          where: { driverId: driverProfile.id, documentType: 'vehicle_photo' },
        });

        if (existingDoc) {
          await db.driverDocument.update({
            where: { id: existingDoc.id },
            data: { fileUrl: vehiclePhotoUrl, status: 'pending', updatedAt: new Date() },
          });
        } else {
          await db.driverDocument.create({
            data: {
              driverId: driverProfile.id,
              documentType: 'vehicle_photo',
              fileUrl: vehiclePhotoUrl,
              status: 'pending',
            },
          });
        }
      }
    }

    // Flag re-submitted documents for pending/rejected accounts
    if (cniRectoUrl || cniVersoUrl || vehiclePhotoUrl || avatarUrl) {
      await db.$executeRaw`
        UPDATE public.profiles
        SET is_resubmitted = true, document_updated_at = NOW(), updated_at = NOW()
        WHERE id = ${session.userId}::uuid AND (account_status = 'pending'::account_status OR account_status = 'rejected'::account_status)
      `.catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Profil, photos et documents mis à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur PATCH me route:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
