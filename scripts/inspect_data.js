const { Client } = require('pg');

const connectionString = "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function checkData() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('--- PLATFORM SETTINGS ---');
  const settings = await client.query('SELECT * FROM public.platform_settings');
  console.table(settings.rows);

  console.log('--- PROFILES ---');
  const profiles = await client.query('SELECT id, full_name, email, phone, role, account_status FROM public.profiles');
  console.table(profiles.rows);

  console.log('--- DRIVER PROFILES ---');
  const drivers = await client.query('SELECT id, user_id, vehicle_type, verification_status FROM public.driver_profiles');
  console.table(drivers.rows);

  console.log('--- PAYMENTS ---');
  const payments = await client.query('SELECT * FROM public.payments');
  console.table(payments.rows);

  console.log('--- SUBSCRIPTIONS ---');
  const subs = await client.query('SELECT * FROM public.subscriptions');
  console.table(subs.rows);

  await client.end();
}

checkData();
