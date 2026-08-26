const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectColumns() {
  console.log('=== COLONNES DE LA TABLE DELIVERY_REQUESTS ===\n');

  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'delivery_requests' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `;

  for (const c of cols) {
    console.log(` - ${c.column_name.padEnd(30)} : ${c.data_type}`);
  }
}

inspectColumns()
  .catch((e) => console.error('Error inspecting columns:', e))
  .finally(async () => await prisma.$disconnect());
