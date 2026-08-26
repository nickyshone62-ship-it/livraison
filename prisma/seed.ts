import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 database seed setup for Supabase...');

  // Initialize Platform Settings if missing
  const defaultSettings = [
    { settingKey: 'client_registration_fee', settingValue: 2000, description: 'Frais d\'inscription client (FCFA)' },
    { settingKey: 'driver_registration_fee', settingValue: 1500, description: 'Frais d\'inscription livreur (FCFA)' },
    { settingKey: 'monthly_subscription_fee', settingValue: 1000, description: 'Frais d\'abonnement mensuel (FCFA)' },
    { settingKey: 'delivery_commission', settingValue: 0, description: 'Commission de la plateforme (0 FCFA)' },
    { settingKey: 'orange_money_number', settingValue: '06887330', description: 'Numéro d\'encaissement Orange Money' },
    { settingKey: 'moov_money_number', settingValue: '62017878', description: 'Numéro d\'encaissement Moov Money' },
    { settingKey: 'wave_number', settingValue: '06887330', description: 'Numéro d\'encaissement Wave' },
  ];

  for (const s of defaultSettings) {
    const existing = await prisma.platformSetting.findFirst({
      where: { settingKey: s.settingKey },
    });
    if (!existing) {
      await prisma.platformSetting.create({
        data: s,
      });
    }
  }

  console.log('✅ Paramètres de plateforme initialisés avec succès.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
