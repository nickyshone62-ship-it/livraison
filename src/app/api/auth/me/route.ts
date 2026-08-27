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
            p.city, 
            p.address, 
            p.account_status::text as "accountStatus", 
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
          profile = {
            id: r.id,
            role: r.role,
            fullName: r.fullName,
            phone: r.phone,
            email: r.email,
            avatarUrl: r.avatarUrl,
            city: r.city,
            address: r.address,
            accountStatus: r.accountStatus,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            driverProfile: r.driverProfileId ? {
              id: r.driverProfileId,
              verificationStatus: r.driverVerificationStatus,
              isAvailable: r.driverIsAvailable,
            } : null,
            subscriptions: [],
            payments: [],
          };
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
            isSubscriptionActive: true,
          },
        });
      }
      return NextResponse.json({ user: null }, { status: 404 });
    }

    const latestSub = profile.subscriptions[0] || null;
    const now = new Date();
    const isSubActive = latestSub && latestSub.status === 'active' && latestSub.expiresAt ? new Date(latestSub.expiresAt) > now : true;

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
        accountStatus: profile.accountStatus,
        driverProfile: profile.driverProfile,
        activeSubscription: latestSub,
        isSubscriptionActive: isSubActive,
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
    const { isAvailable, fullName, phone, city, address } = body;

    if (isAvailable !== undefined) {
      await db.$executeRaw`
        UPDATE public.driver_profiles
        SET is_available = ${Boolean(isAvailable)}, updated_at = NOW()
        WHERE user_id = ${session.userId}::uuid
      `;
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

    return NextResponse.json({
      success: true,
      message: 'Profil et statut mis à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur PATCH me route:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
