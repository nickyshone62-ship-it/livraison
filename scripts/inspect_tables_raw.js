const { Client } = require('pg');
const fs = require('fs');

const connectionString = "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function dumpFullAudit() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tableNames = resTables.rows.map(r => r.table_name);
    const fullAudit = {};

    for (const table of tableNames) {
      const resCols = await client.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      const resCount = await client.query(`SELECT COUNT(*) FROM public."${table}"`);
      const rowCount = parseInt(resCount.rows[0].count, 10);

      fullAudit[table] = {
        rowCount,
        columns: resCols.rows
      };
    }

    fs.writeFileSync('supabase_audit_result.json', JSON.stringify(fullAudit, null, 2));
    console.log('✅ Audit saved to supabase_audit_result.json. Tables count:', tableNames.length);

  } catch (err) {
    console.error('❌ Error during full dump:', err);
  } finally {
    await client.end();
  }
}

dumpFullAudit();
