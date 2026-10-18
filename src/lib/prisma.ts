import { PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_URL = "postgresql://postgres.xqoubijpuusgtrsoeqdp:afianrahman2706@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

function getEffectiveDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

  // Supabase connection pooler port 5432 (Session mode) memiliki limit ketat 15 koneksi (EMAXCONNSESSION).
  // Otomatis arahkan ke port 6543 (Transaction mode) dengan pgbouncer=true agar serverless function tidak crash.
  if (url.includes(':5432')) {
    url = url.replace(':5432', ':6543');
  }
  if (!url.includes('pgbouncer=true')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}pgbouncer=true&connection_limit=1`;
  }
  return url;
}

const prismaClientSingleton = () => {
  const effectiveUrl = getEffectiveDatabaseUrl();
  return new PrismaClient({
    datasources: {
      db: {
        url: effectiveUrl,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;