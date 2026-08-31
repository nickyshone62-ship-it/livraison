import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    // Purge operational tables with CASCADE order
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.messages CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.conversations CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_tracking CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_status_history CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_assignments CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_offers CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.reviews CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.reports CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.notifications CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.admin_actions CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.delivery_requests CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.driver_documents CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.vehicles CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.subscriptions CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.payments CASCADE;`);
    await db.$executeRawUnsafe(`TRUNCATE TABLE public.driver_profiles CASCADE;`);

    // Delete all non-admin profiles
    await db.$executeRawUnsafe(`DELETE FROM public.profiles WHERE role::text != 'admin';`);

    // Ensure Super Admin Profile exists
    const adminRows: any[] = await db.$queryRawUnsafe(`
      SELECT id FROM public.profiles WHERE role::text = 'admin' LIMIT 1;
    `);

    if (!adminRows || adminRows.length === 0) {
      await db.$executeRawUnsafe(`
        INSERT INTO public.profiles (id, role, full_name, phone, email, account_status, created_at, updated_at)
        VALUES (
          '3e60767a-fac7-4c5a-bca3-36bbba9b81d5'::uuid,
          'admin'::user_role,
          'Super Administrateur Nick',
          '+226 06 88 73 30',
          'nickyshone62@gmail.com',
          'active'::account_status,
          NOW(),
          NOW()
        );
      `);
    }

    return NextResponse.json({
      success: true,
      message: '🧹 La base de données a été remise à zéro avec succès ! Tous les comptes de test et livraisons ont été effacés.',
    });
  } catch (error: any) {
    console.error('Erreur reset database API:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la remise à zéro' }, { status: 500 });
  }
}
