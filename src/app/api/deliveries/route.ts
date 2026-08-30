import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, validateActiveSubscription } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'open', 'my_requests', 'my_offers', 'my_deliveries'
    const role = (session.role || 'client').toLowerCase();
    const userId = session.userId;

    if (role !== 'admin') {
      const subCheck = await validateActiveSubscription(userId, role);
      if (!subCheck.active) {
        return NextResponse.json({ error: subCheck.message, code: subCheck.code }, { status: 403 });
      }
    }

    if (role === 'admin') {
      const requests = await db.deliveryRequest.findMany({
        take: 200,
        include: {
          client: true,
          offers: { include: { driver: { include: { profile: true, vehicles: true } } } },
          assignments: { include: { driver: { include: { profile: true } } } },
          reviews: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ requests });
    }

    if (role === 'driver') {
      let driverProfile = await db.driverProfile.findUnique({
        where: { userId },
      });

      if (!driverProfile) {
        try {
          // Fetch main profile to check status
          const userProfiles: any[] = await db.$queryRaw`
            SELECT account_status::text as "accountStatus" FROM public.profiles WHERE id = ${userId}::uuid LIMIT 1
          `;
          const accountStatus = userProfiles && userProfiles.length > 0 ? userProfiles[0].accountStatus : 'active';
          const verificationStatus = accountStatus === 'active' || accountStatus === 'approved' ? 'approved' : 'pending';

          driverProfile = await db.driverProfile.create({
            data: {
              userId,
              verificationStatus: verificationStatus as any,
              isAvailable: true,
            },
          });
        } catch (errProfile) {
          console.warn('Création automatique du DriverProfile:', errProfile);
        }
      }

      const driverProfileId = driverProfile ? driverProfile.id : userId;

      if (filter === 'my_offers') {
        const offers = await db.deliveryOffer.findMany({
          where: { driverId: driverProfileId },
          include: {
            deliveryRequest: { include: { client: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ offers });
      }

      if (filter === 'my_deliveries') {
        const assignments = await db.deliveryAssignment.findMany({
          where: { driverId: driverProfileId },
          include: {
            delivery: { include: { client: true, offers: true, reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Masquer impérativement les OTP pour le livreur
        const sanitizedAssignments = assignments.map((a) => ({
          ...a,
          pickupOtp: undefined,
          deliveryOtp: undefined,
        }));

        return NextResponse.json({ assignments: sanitizedAssignments });
      }

      // Tout nouveau livreur inscrit doit pouvoir voir TOUTES les demandes de livraison ouvertes
      const openRequests = await db.deliveryRequest.findMany({
        where: {
          status: { in: ['searching_driver', 'pending'] },
        },
        include: {
          client: true,
          offers: {
            where: { driverId: driverProfileId },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ requests: openRequests });
    }

    // Client space: my requests
    const customerRequests = await db.deliveryRequest.findMany({
      where: { clientId: userId },
      include: {
        offers: {
          include: {
            driver: {
              include: {
                profile: true,
                vehicles: true,
                documents: true,
              },
            },
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            driver: {
              include: {
                profile: true,
                vehicles: true,
              },
            },
          },
        },
        reviews: true,
        reports: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests: customerRequests });
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des livraisons' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const role = (session.role || 'client').toLowerCase();
    if (role === 'driver') {
      return NextResponse.json({ error: 'Seuls les clients peuvent émettre des demandes de livraison.' }, { status: 403 });
    }

    const subCheck = await validateActiveSubscription(session.userId, role);
    if (!subCheck.active) {
      return NextResponse.json({ error: subCheck.message, code: subCheck.code }, { status: 403 });
    }

    const body = await req.json();
    const {
      pickupAddress,
      pickupCity,
      pickupInstructions,
      pickupLatitude,
      pickupLongitude,
      destinationAddress,
      destinationCity,
      destinationInstructions,
      destinationLatitude,
      destinationLongitude,
      recipientName,
      recipientPhone,
      packageDescription,
      packageCategory,
      packageWeight,
      packageQuantity,
      packageSize,
      requestedDate,
      requestedTime,
      additionalInstructions,
    } = body;

    if (!pickupAddress || !destinationAddress || !recipientName || !recipientPhone || !packageDescription) {
      return NextResponse.json({ error: 'Veuillez remplir les informations obligatoires (Départ, Destination, Destinataire, Description colis).' }, { status: 400 });
    }

    const id = require('crypto').randomUUID();
    const pLat = pickupLatitude ? parseFloat(pickupLatitude) : null;
    const pLng = pickupLongitude ? parseFloat(pickupLongitude) : null;
    const dLat = destinationLatitude ? parseFloat(destinationLatitude) : null;
    const dLng = destinationLongitude ? parseFloat(destinationLongitude) : null;
    const pWeight = packageWeight ? parseFloat(packageWeight) : null;
    const pQty = packageQuantity ? parseInt(packageQuantity, 10) : 1;
    const reqDate = requestedDate ? new Date(requestedDate) : new Date();

    const generateSecureOtp = () => {
      const forbidden = ['123456', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '654321'];
      let code = '';
      do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      } while (forbidden.includes(code));
      return code;
    };

    const initialPickupOtp = generateSecureOtp();
    let initialDeliveryOtp = generateSecureOtp();
    while (initialDeliveryOtp === initialPickupOtp) {
      initialDeliveryOtp = generateSecureOtp();
    }

    let deliveryRequest;
    try {
      deliveryRequest = await db.deliveryRequest.create({
        data: {
          clientId: session.userId,
          pickupAddress,
          pickupCity: pickupCity || 'Ouagadougou',
          pickupInstructions: pickupInstructions || null,
          pickupLatitude: pLat,
          pickupLongitude: pLng,
          destinationAddress,
          destinationCity: destinationCity || 'Ouagadougou',
          destinationInstructions: destinationInstructions || null,
          destinationLatitude: dLat,
          destinationLongitude: dLng,
          recipientName,
          recipientPhone,
          packageDescription,
          packageCategory: packageCategory || 'Colis Général',
          packageWeight: pWeight,
          packageQuantity: pQty,
          packageSize: packageSize || null,
          requestedDate: reqDate,
          requestedTime: requestedTime || null,
          additionalInstructions: additionalInstructions || null,
          status: 'searching_driver',
        },
      });
    } catch (createErr: any) {
      console.warn('Prisma create failed, executing raw SQL fallback:', createErr.message);

      await db.$executeRaw`
        INSERT INTO public.delivery_requests (
          id, client_id, pickup_address, pickup_city, pickup_instructions,
          pickup_latitude, pickup_longitude, destination_address, destination_city,
          destination_instructions, destination_latitude, destination_longitude,
          recipient_name, recipient_phone, package_description, package_category,
          package_weight, package_quantity, package_size, requested_date,
          requested_time, additional_instructions, status, created_at, updated_at
        ) VALUES (
          ${id}::uuid, ${session.userId}::uuid, ${pickupAddress}, ${pickupCity || 'Ouagadougou'}, ${pickupInstructions || null},
          ${pLat}, ${pLng}, ${destinationAddress}, ${destinationCity || 'Ouagadougou'},
          ${destinationInstructions || null}, ${dLat}, ${dLng},
          ${recipientName}, ${recipientPhone}, ${packageDescription}, ${packageCategory || 'Colis Général'},
          ${pWeight}, ${pQty}, ${packageSize || null}, ${reqDate},
          ${requestedTime || null}::time, ${additionalInstructions || null}, 'searching_driver'::public.delivery_status, NOW(), NOW()
        );
      `;

      deliveryRequest = { id, pickupAddress, destinationAddress, recipientName, recipientPhone, status: 'searching_driver' };
    }

    return NextResponse.json({
      success: true,
      deliveryRequest: {
        ...deliveryRequest,
        initialPickupOtp,
        initialDeliveryOtp,
      },
      message: 'Votre demande est publiée. Vos codes OTP 1 (Récupération Point A) et OTP 2 (Livraison Point B) sont réservés.',
    });
  } catch (error: any) {
    console.error('Erreur création livraison:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de la demande' }, { status: 500 });
  }
}
