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

    // Fetch raw profile fields to ensure new columns (is_resubmitted, previous_rejection_reason, etc.) are included
    const profilesRaw = ((await db.$queryRaw`
      SELECT id, 
             is_resubmitted as "isResubmitted", 
             document_updated_at as "documentUpdatedAt", 
             previous_rejection_reason as "previousRejectionReason",
             rejection_reason as "rejectionReason"
      FROM public.profiles
    `.catch(() => [])) || []) as any[];

    const resubmittedMap = new Map();
    (profilesRaw || []).forEach((p) => {
      resubmittedMap.set(p.id, p);
    });

    const users = await db.profile.findMany({
      where: roleFilter ? { role: roleFilter as any } : undefined,
      include: {
        driverProfile: {
          include: {
            vehicles: true,
            documents: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enhancedUsers = users.map((u: any) => {
      const extra = resubmittedMap.get(u.id) || {};
      let driverProfile = u.driverProfile;

      if (driverProfile) {
        const existingDocs = driverProfile.documents || [];
        const synthesizedDocs = [...existingDocs];

        if (u.cniRectoUrl && !synthesizedDocs.some((d: any) => d.documentType === 'identity_card_recto')) {
          synthesizedDocs.push({
            id: `recto_${u.id}`,
            driverId: driverProfile.id,
            documentType: 'identity_card_recto',
            fileUrl: u.cniRectoUrl,
            status: 'pending',
            createdAt: u.createdAt,
          });
        }

        if (u.cniVersoUrl && !synthesizedDocs.some((d: any) => d.documentType === 'identity_card_verso')) {
          synthesizedDocs.push({
            id: `verso_${u.id}`,
            driverId: driverProfile.id,
            documentType: 'identity_card_verso',
            fileUrl: u.cniVersoUrl,
            status: 'pending',
            createdAt: u.createdAt,
          });
        }

        if (u.avatarUrl && !synthesizedDocs.some((d: any) => d.documentType === 'photo')) {
          synthesizedDocs.push({
            id: `avatar_${u.id}`,
            driverId: driverProfile.id,
            documentType: 'photo',
            fileUrl: u.avatarUrl,
            status: 'pending',
            createdAt: u.createdAt,
          });
        }

        driverProfile = {
          ...driverProfile,
          documents: synthesizedDocs,
        };
      }

      return {
        ...u,
        driverProfile,
        isResubmitted: Boolean(extra.isResubmitted),
        documentUpdatedAt: extra.documentUpdatedAt || null,
        previousRejectionReason: extra.previousRejectionReason || u.rejectionReason || null,
        rejectionReason: u.rejectionReason || extra.rejectionReason || null,
      };
    });

    return NextResponse.json({ users: enhancedUsers });
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
    const rejectionReasonText = reason && String(reason).trim() ? String(reason).trim() : 'Document non conforme ou informations incomplètes.';

    if (action === 'approve') {
      newAccountStatus = 'active';

      // Grant 1 month free active subscription starting from approval date
      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      await db.subscription.create({
        data: {
          userId,
          amount: 1000,
          currency: 'XOF',
          status: 'active',
          startsAt,
          expiresAt,
          approvedBy: session.userId,
          approvedAt: startsAt,
        },
      }).catch(console.error);

    } else if (action === 'reject') {
      newAccountStatus = 'rejected';
    } else if (action === 'suspend') {
      newAccountStatus = 'suspended';
    } else if (action === 'reactivate') {
      newAccountStatus = 'active';
    }

    if (action === 'reject') {
      await db.$executeRaw`
        UPDATE public.profiles
        SET account_status = 'rejected'::account_status,
            rejection_reason = ${rejectionReasonText},
            is_resubmitted = false,
            updated_at = NOW()
        WHERE id = ${userId}::uuid
      `;
    } else {
      await db.$executeRaw`
        UPDATE public.profiles
        SET account_status = ${newAccountStatus}::account_status,
            rejection_reason = NULL,
            is_resubmitted = false,
            updated_at = NOW()
        WHERE id = ${userId}::uuid
      `;
    }

    // Also update driver profile if driver
    if (profile.role === 'driver') {
      const driverVerificationStatus = newAccountStatus === 'active' ? 'approved' : newAccountStatus === 'suspended' ? 'suspended' : 'rejected';
      await db.$executeRaw`
        UPDATE public.driver_profiles
        SET verification_status = ${driverVerificationStatus}::driver_verification_status,
            rejection_reason = ${action === 'reject' ? rejectionReasonText : null},
            updated_at = NOW()
        WHERE user_id = ${userId}::uuid
      `;
    }

    // If rejected, create user notification
    if (action === 'reject') {
      await db.notification.create({
        data: {
          userId: userId,
          title: '❌ Demande d\'inscription rejetée',
          message: `Votre demande d'inscription a été rejetée par l'administration. Motif : ${rejectionReasonText}`,
          type: 'system',
          relatedId: userId,
        },
      }).catch(console.error);
    }

    // Log admin action in admin_actions
    await db.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: `USER_${action.toUpperCase()}`,
        targetTable: 'profiles',
        targetId: userId,
        oldData: { accountStatus: profile.accountStatus },
        newData: { accountStatus: newAccountStatus, reason: rejectionReasonText },
      },
    });

    return NextResponse.json({
      success: true,
      message: action === 'reject' 
        ? `L'utilisateur a été rejeté avec le motif: "${rejectionReasonText}"` 
        : `Action ${action} effectuée avec succès sur l'utilisateur.`,
    });
  } catch (error: any) {
    console.error('Erreur admin users PATCH:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la modification' }, { status: 500 });
  }
}
