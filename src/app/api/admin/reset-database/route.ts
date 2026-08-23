import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const deleteSafe = async (model: any) => {
      try {
        if (model && typeof model.deleteMany === 'function') {
          await model.deleteMany({});
        }
      } catch (e) {
        // Ignore
      }
    };

    await deleteSafe(prisma.deliveryStatusHistory);
    await deleteSafe(prisma.deliveryCode);
    await deleteSafe(prisma.deliveryProposal);
    await deleteSafe(prisma.delivery);
    await deleteSafe(prisma.deliveryRequest);
    await deleteSafe(prisma.dispute);
    await deleteSafe(prisma.review);
    await deleteSafe(prisma.notification);
    await deleteSafe(prisma.auditLog);
    await deleteSafe(prisma.payment);
    await deleteSafe(prisma.subscription);
    await deleteSafe(prisma.verificationDocument);
    await deleteSafe(prisma.vehicle);
    await deleteSafe(prisma.driver);

    // 2. Delete non-admin test users and profiles
    await prisma.profile.deleteMany({
      where: {
        user: {
          role: { not: 'ADMIN' }
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        role: { not: 'ADMIN' }
      }
    });

    // 3. Ensure Master Admin Account Exists
    const adminPhone = '+226 06 88 73 30';
    const adminPassHash = await bcrypt.hash('Nick2004', 10);

    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: adminPhone },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          phone: adminPhone,
          passwordHash: adminPassHash,
          role: 'ADMIN',
          isActive: true,
          profile: {
            create: {
              fullName: 'Direction Administrateur Central',
              city: 'Ouagadougou',
              address: 'Centre-Ville Ouagadougou'
            }
          }
        }
      });
    } else {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          phone: adminPhone,
          passwordHash: adminPassHash,
          role: 'ADMIN',
          isActive: true
        }
      });
    }

    // 4. Record initial Audit Log entry for Database Reset
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'DATABASE_RESET_TO_ZERO',
        targetEntity: 'System',
        targetId: 'ALL',
        detailsJson: 'Réinitialisation complète à zéro de la plateforme effectuée par l\'administrateur pour le démarrage réel des activités.'
      }
    });

    return NextResponse.json({
      success: true,
      message: '✅ Remise à zéro complète effectuée avec succès ! Toutes les données de démonstration ont été effacées et l\'espace administrateur est prêt pour le lancement réel.'
    });

  } catch (error: any) {
    console.error('Database Reset Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la remise à zéro' }, { status: 500 });
  }
}
