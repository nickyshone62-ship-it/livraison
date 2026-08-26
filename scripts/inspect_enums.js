const { Client } = require('pg');
const connectionString = "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function inspectEnums() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('--- SUPABASE ENUM TYPES & ALLOWED VALUES ---');
  const res = await client.query(`
    SELECT t.typname AS enum_name, e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY enum_name, e.enumsortorder;
  `);

  const enums = {};
  for (const r of res.rows) {
    if (!enums[r.enum_name]) enums[r.enum_name] = [];
    enums[r.enum_name].push(r.enum_value);
  }

  console.log(JSON.stringify(enums, null, 2));
  await client.end();
}

inspectEnums();
