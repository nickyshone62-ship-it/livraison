import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Base de données Supabase conservée avec succès.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur lors de la remise à zéro' }, { status: 500 });
  }
}
