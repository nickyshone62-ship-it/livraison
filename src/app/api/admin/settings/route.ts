import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await db.platformSetting.findMany({
      orderBy: { settingKey: 'asc' },
    });
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Erreur settings GET:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des paramètres' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }

    const { settings } = await req.json(); // Array of { key, value, description }
    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'Format de paramètres invalide' }, { status: 400 });
    }

    for (const item of settings) {
      if (!item.settingKey) continue;

      const existing = await db.platformSetting.findFirst({
        where: { settingKey: item.settingKey },
      });

      if (existing) {
        await db.platformSetting.update({
          where: { id: existing.id },
          data: {
            settingValue: item.settingValue,
            description: item.description || existing.description,
            updatedBy: session.userId,
            updatedAt: new Date(),
          },
        });
      } else {
        await db.platformSetting.create({
          data: {
            settingKey: item.settingKey,
            settingValue: item.settingValue,
            description: item.description || null,
            updatedBy: session.userId,
          },
        });
      }
    }

    // Log admin action
    await db.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: 'UPDATE_PLATFORM_SETTINGS',
        targetTable: 'platform_settings',
        newData: { settingsCount: settings.length },
      },
    });

    return NextResponse.json({ success: true, message: 'Paramètres mis à jour avec succès.' });
  } catch (error: any) {
    console.error('Erreur settings PUT:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour des paramètres' }, { status: 500 });
  }
}
