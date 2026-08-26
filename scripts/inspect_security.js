const { Client } = require('pg');
const fs = require('fs');

const connectionString = "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function inspectSecurity() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('--- RLS POLICIES ---');
  const policies = await client.query(`
    SELECT tablename, policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public';
  `);
  console.table(policies.rows);

  console.log('\n--- TRIGGERS IN PUBLIC & AUTH ---');
  const triggers = await client.query(`
    SELECT trigger_name, event_object_schema, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema IN ('public', 'auth');
  `);
  console.table(triggers.rows);

  console.log('\n--- STORAGE BUCKETS ---');
  const buckets = await client.query(`
    SELECT id, name, public, owner, created_at
    FROM storage.buckets;
  `);
  console.table(buckets.rows);

  await client.end();
}

inspectSecurity();
