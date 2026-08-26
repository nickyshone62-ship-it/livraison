import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role'); // 'client', 'driver', 'admin'

    let users: any[] = [];
    if (roleFilter) {
      users = await db.$queryRaw`
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
          dp.verification_status::text as "driverVerificationStatus"
        FROM public.profiles p
        LEFT JOIN public.driver_profiles dp ON dp.user_id = p.id
        WHERE p.role::text = ${roleFilter}
        ORDER BY p.created_at DESC
      `;
    } else {
      users = await db.$queryRaw`
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
          dp.verification_status::text as "driverVerificationStatus"
        FROM public.profiles p
        LEFT JOIN public.driver_profiles dp ON dp.user_id = p.id
        ORDER BY p.created_at DESC
      `;
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Erreur admin users GET:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des utilisateurs' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const { userId, action, reason } = await req.json(); // action: 'approve', 'reject', 'suspend', 'reactivate'
    if (!userId || !action) {
      return NextResponse.json({ error: 'L\'utilisateur et l\'action sont requis' }, { status: 400 });
    }

    const profiles: any[] = await db.$queryRaw`
      SELECT id, role::text as role, account_status::text as "accountStatus"
      FROM public.profiles
      WHERE id = ${userId}::uuid
      LIMIT 1
    `;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const profile = profiles[0];
    let newAccountStatus = profile.accountStatus;

    if (action === 'approve') {
      newAccountStatus = 'active';
    } else if (action === 'reject') {
      newAccountStatus = 'rejected';
    } else if (action === 'suspend') {
      newAccountStatus = 'suspended';
    } else if (action === 'reactivate') {
      newAccountStatus = 'active';
    }

    await db.$executeRaw`
      UPDATE public.profiles
      SET account_status = ${newAccountStatus}::account_status, updated_at = NOW()
      WHERE id = ${userId}::uuid
    `;

    // Also update driver profile if driver
    if (profile.role === 'driver') {
      const driverVerificationStatus = newAccountStatus === 'active' ? 'approved' : newAccountStatus === 'suspended' ? 'suspended' : 'rejected';
      await db.$executeRaw`
        UPDATE public.driver_profiles
        SET verification_status = ${driverVerificationStatus}::driver_verification_status, updated_at = NOW()
        WHERE user_id = ${userId}::uuid
      `;
    }

    // Log admin action in admin_actions
    await db.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: `USER_${action.toUpperCase()}`,
        targetTable: 'profiles',
        targetId: userId,
        oldData: { accountStatus: profile.accountStatus },
        newData: { accountStatus: newAccountStatus, reason: reason || null },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Action ${action} effectuée avec succès sur l'utilisateur.`,
    });
  } catch (error: any) {
    console.error('Erreur admin users PATCH:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la modification' }, { status: 500 });
  }
}
