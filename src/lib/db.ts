import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDirectDatabaseUrl(): string {
  let url =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres.vofydpjgavyegluebhek:Nick%4020044005@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

  // Force port 5432 (Direct Connection) to avoid PgBouncer 08P01 protocol errors in Prisma
  if (url.includes(':6543')) {
    url = url.replace(':6543', ':5432');
  }
  return url;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDirectDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
