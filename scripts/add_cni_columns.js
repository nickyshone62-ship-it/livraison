const { Client } = require('pg');

const connectionString = "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB...');

    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS cni_recto_url TEXT,
      ADD COLUMN IF NOT EXISTS cni_verso_url TEXT;
    `);

    console.log('✅ Successfully added cni_recto_url and cni_verso_url to public.profiles table');
  } catch (err) {
    console.error('❌ Error adding columns:', err);
  } finally {
    await client.end();
  }
}

run();
