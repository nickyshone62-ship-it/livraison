const fs = require('fs');

const audit = JSON.parse(fs.readFileSync('supabase_audit_result.json', 'utf8'));

console.log('=====================================================');
console.log('AUDIT EXHAUSTIF DES 18 TABLES SUPABASE EXISTANTES');
console.log('=====================================================\n');

for (const [tableName, tableInfo] of Object.entries(audit)) {
  console.log(`📌 TABLE: [${tableName}] (Rangs: ${tableInfo.rowCount})`);
  const cols = tableInfo.columns.map(c => `${c.column_name} (${c.data_type}${c.udt_name ? ' / ' + c.udt_name : ''}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.column_default ? ' DEFAULT ' + c.column_default : ''})`);
  console.log('  Colonnes:', cols.join('\n  - '));
  console.log('-----------------------------------------------------\n');
}
