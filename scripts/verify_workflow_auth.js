const { Client } = require('pg');
const connectionString = "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function testWithAuthUsers() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('===========================================================');
  console.log('🚀 TEST BOUT EN BOUT AVEC INSCRIPTION AUTH.USERS SUPABASE');
  console.log('===========================================================\n');

  try {
    const timestamp = Date.now();
    const clientEmail = `client_${timestamp}@test.bf`;
    const driverEmail = `driver_${timestamp}@test.bf`;
    const clientPhone = `+22676${Math.floor(100000 + Math.random() * 900000)}`;
    const driverPhone = `+22678${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. INSCRIPTION CLIENT DANS AUTH.USERS
    console.log('1️⃣ Insertion Client dans auth.users...');
    const resAuthClient = await client.query(`
      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
      VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', $1, crypt('Password123!', gen_salt('bf')), NOW(), $2, NOW(), NOW(), 'authenticated', 'authenticated')
      RETURNING id;
    `, [clientEmail, JSON.stringify({ role: 'client', full_name: 'Client Supabase Test', phone: clientPhone })]);

    const clientId = resAuthClient.rows[0].id;
    console.log('  ✅ Client inséré dans auth.users ID:', clientId);

    // Vérification de la création automatique par le trigger handle_new_user()
    const resProfileClient = await client.query('SELECT * FROM public.profiles WHERE id = $1', [clientId]);
    console.log('  ✅ Profil créé automatiquement via Trigger:', resProfileClient.rows[0].full_name, 'Statut:', resProfileClient.rows[0].account_status);

    // 2. SOUMISSION PAIEMENT CLIENT (2000 FCFA -> pending)
    console.log('\n2️⃣ Soumission Paiement Inscription Client (2000 FCFA)...');
    const resPaymentClient = await client.query(`
      INSERT INTO public.payments (user_id, payment_type, amount, currency, payment_method, transaction_reference, status)
      VALUES ($1, 'registration', 2000, 'XOF', 'orange_money', $2, 'pending')
      RETURNING id, status;
    `, [clientId, `REF-CLI-${timestamp}`]);
    console.log('  ✅ Paiement client enregistré en statut:', resPaymentClient.rows[0].status);

    // 3. INSCRIPTION DRIVER DANS AUTH.USERS
    console.log('\n3️⃣ Insertion Driver dans auth.users...');
    const resAuthDriver = await client.query(`
      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
      VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', $1, crypt('Password123!', gen_salt('bf')), NOW(), $2, NOW(), NOW(), 'authenticated', 'authenticated')
      RETURNING id;
    `, [driverEmail, JSON.stringify({ role: 'driver', full_name: 'Livreur Supabase Test', phone: driverPhone, vehicle_type: 'motorcycle', vehicle_brand: 'Yamaha', vehicle_registration: '11-KK-900' })]);

    const driverId = resAuthDriver.rows[0].id;
    console.log('  ✅ Driver inséré dans auth.users ID:', driverId);

    // Ensure driver_profiles entry exists
    let resDriverProfile = await client.query('SELECT * FROM public.driver_profiles WHERE user_id = $1', [driverId]);
    if (resDriverProfile.rows.length === 0) {
      resDriverProfile = await client.query(`
        INSERT INTO public.driver_profiles (user_id, verification_status, is_available)
        VALUES ($1, 'pending', true)
        RETURNING *;
      `, [driverId]);
    }

    const driverProfileId = resDriverProfile.rows[0].id;
    console.log('  ✅ Fiche Livreur (driver_profiles) ID:', driverProfileId, 'Statut verification:', resDriverProfile.rows[0]?.verification_status || 'pending');

    // 4. PAIEMENT DRIVER (1500 FCFA -> pending)
    console.log('\n4️⃣ Soumission Paiement Inscription Driver (1500 FCFA)...');
    const resPaymentDriver = await client.query(`
      INSERT INTO public.payments (user_id, payment_type, amount, currency, payment_method, transaction_reference, status)
      VALUES ($1, 'registration', 1500, 'XOF', 'moov_money', $2, 'pending')
      RETURNING id, status;
    `, [driverId, `REF-DRV-${timestamp}`]);
    console.log('  ✅ Paiement driver enregistré en statut:', resPaymentDriver.rows[0].status);

    // 5. VALIDATION ADMIN DES PAIEMENTS & APPROBATION COMPTES
    console.log('\n5️⃣ Validation par l\'Admin des paiements et approbation...');
    await client.query("UPDATE public.payments SET status = 'approved' WHERE id = $1", [resPaymentClient.rows[0].id]);
    await client.query("UPDATE public.profiles SET account_status = 'active' WHERE id = $1", [clientId]);

    await client.query("UPDATE public.payments SET status = 'approved' WHERE id = $1", [resPaymentDriver.rows[0].id]);
    await client.query("UPDATE public.profiles SET account_status = 'active' WHERE id = $1", [driverId]);
    await client.query("UPDATE public.driver_profiles SET verification_status = 'approved' WHERE user_id = $1", [driverId]);
    console.log('  ✅ Comptes et profils approuvés par l\'Admin !');

    // 6. CRÉATION DEMANDE LIVRAISON
    console.log('\n6️⃣ Publication d\'une demande de livraison par le client...');
    const resReq = await client.query(`
      INSERT INTO public.delivery_requests (
        client_id, pickup_address, pickup_city, destination_address, destination_city,
        recipient_name, recipient_phone, package_description, package_category, package_quantity, status
      ) VALUES ($1, 'Zogona, rue de la chance', 'Ouagadougou', 'Koulouba, face Poste', 'Ouagadougou', 'Awa Traoré', '+22670998877', 'Sac d''ordinateurs portable', 'High-tech', 1, 'searching_driver')
      RETURNING id, status;
    `, [clientId]);
    const deliveryId = resReq.rows[0].id;
    console.log('  ✅ Livraison créée ID:', deliveryId, 'Statut initial:', resReq.rows[0].status);

    // 7. PROPOSITION LIVREUR
    console.log('\n7️⃣ Soumission d\'une proposition par le livreur...');
    const resOffer = await client.query(`
      INSERT INTO public.delivery_offers (delivery_id, driver_id, proposed_price, estimated_duration, message, status)
      VALUES ($1, $2, 2000, 20, 'Moto prête, départ immédiat !', 'pending')
      RETURNING id, proposed_price;
    `, [deliveryId, driverProfileId]);
    const offerId = resOffer.rows[0].id;
    console.log('  ✅ Offre soumise ID:', offerId, 'Prix:', resOffer.rows[0].proposed_price, 'FCFA');

    // 8. SELECTION DU LIVREUR PAR LE CLIENT
    console.log('\n8️⃣ Sélection du livreur par le client...');
    await client.query("UPDATE public.delivery_offers SET status = 'accepted' WHERE id = $1", [offerId]);
    await client.query("UPDATE public.delivery_requests SET status = 'driver_selected' WHERE id = $1", [deliveryId]);
    const resAssignment = await client.query(`
      INSERT INTO public.delivery_assignments (delivery_id, driver_id, offer_id)
      VALUES ($1, $2, $3) RETURNING id;
    `, [deliveryId, driverProfileId, offerId]);
    console.log('  ✅ Attribution créée ID:', resAssignment.rows[0].id);

    // 9. WORKFLOW DES STATUTS DE LIVRAISON
    console.log('\n9️⃣ Évolutions des statuts de livraison...');
    const statuses = ['driver_accepted', 'driver_arriving', 'package_picked_up', 'in_transit', 'delivered', 'completed'];
    for (const st of statuses) {
      await client.query("UPDATE public.delivery_requests SET status = $1 WHERE id = $2", [st, deliveryId]);
      await client.query("INSERT INTO public.delivery_status_history (delivery_id, status, changed_by) VALUES ($1, $2, $3)", [deliveryId, st, clientId]);
      console.log(`  -> Statut mis à jour vers: [${st}]`);
    }

    // 10. AVIS CLIENT
    console.log('\n🔟 Soumission d\'un avis 5 étoiles post-livraison...');
    await client.query(`
      INSERT INTO public.reviews (delivery_id, reviewer_id, reviewed_driver_id, rating, comment)
      VALUES ($1, $2, $3, 5, 'Service impeccable, rapide et poli !');
    `, [deliveryId, clientId, driverProfileId]);
    console.log('  ✅ Avis post-livraison enregistré avec succès !');

    console.log('\n===========================================================');
    console.log('🎉 TEST BOUT EN BOUT SUPABASE 100% SUCCÈS !');
    console.log('===========================================================');

  } catch (err) {
    console.error('❌ Erreur durant le test:', err);
  } finally {
    await client.end();
  }
}

testWithAuthUsers();
