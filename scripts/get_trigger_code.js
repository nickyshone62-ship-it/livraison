const { Client } = require('pg');
const connectionString = "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function getTriggerCode() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const res = await client.query(`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE proname = 'handle_new_user';
  `);

  console.log(res.rows[0]?.prosrc);
  await client.end();
}

getTriggerCode();
