import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  let url =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=10";

  // If using PgBouncer pooler (port 6543), append pgbouncer=true if not present
  if (url.includes(':6543') && !url.includes('pgbouncer=')) {
    url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true&connection_limit=10&pool_timeout=10';
  }
  return url;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = db;
}

