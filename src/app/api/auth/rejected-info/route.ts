import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneInput = searchParams.get('phone');
    const session = await getAuthSession();

    let targetUserId = session?.userId;
    let cleanPhone = phoneInput ? phoneInput.trim() : null;

    let row: any = null;

    if (targetUserId) {
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
          p.cni_recto_url as "cniRectoUrl",
          p.cni_verso_url as "cniVersoUrl",
          p.account_status::text as "accountStatus", 
          COALESCE(p.rejection_reason, dp.rejection_reason) as "rejectionReason"
        FROM public.profiles p
        LEFT JOIN public.driver_profiles dp ON dp.user_id = p.id
        WHERE p.id = ${targetUserId}::uuid
        LIMIT 1
      `;
      if (rows && rows.length > 0) row = rows[0];
    }

    if (!row && cleanPhone) {
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
          p.cni_recto_url as "cniRectoUrl",
          p.cni_verso_url as "cniVersoUrl",
          p.account_status::text as "accountStatus", 
          COALESCE(p.rejection_reason, dp.rejection_reason) as "rejectionReason"
        FROM public.profiles p
        LEFT JOIN public.driver_profiles dp ON dp.user_id = p.id
        WHERE p.phone = ${cleanPhone}
        LIMIT 1
      `;
      if (rows && rows.length > 0) row = rows[0];
    }

    if (!row) {
      return NextResponse.json({ exists: false });
    }

    const status = (row.accountStatus || '').toLowerCase();
    if (status === 'active' || status === 'approved' || status === 'suspended') {
      return NextResponse.json({
        exists: true,
        isApproved: true,
        error: 'Ce numéro de téléphone appartient déjà à un compte actif ou validé. Vous ne pouvez pas créer un nouveau compte avec ce numéro.',
      });
    }

    return NextResponse.json({
      exists: true,
      isRejected: status === 'rejected',
      user: {
        id: row.id,
        role: row.role,
        fullName: row.fullName,
        phone: row.phone,
        email: row.email,
        city: row.city,
        address: row.address,
        avatarUrl: row.avatarUrl,
        cniRectoUrl: row.cniRectoUrl,
        cniVersoUrl: row.cniVersoUrl,
        accountStatus: row.accountStatus,
        rejectionReason: row.rejectionReason,
      },
    });
  } catch (error: any) {
    console.error('Erreur GET rejected-info:', error);
    return NextResponse.json({ error: error.message || 'Erreur d\'information' }, { status: 500 });
  }
}
