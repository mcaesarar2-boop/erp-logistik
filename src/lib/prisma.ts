import { PrismaClient } from '@prisma/client';

function getEffectiveDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Supabase connection pooler port 5432 (Session mode) memiliki limit ketat 15 koneksi (EMAXCONNSESSION).
  // Otomatis arahkan ke port 6543 (Transaction mode) dengan pgbouncer=true agar serverless function tidak crash.
  if (url.includes('.pooler.supabase.com:5432')) {
    url = url.replace('.pooler.supabase.com:5432', '.pooler.supabase.com:6543');
    if (!url.includes('pgbouncer=true')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}pgbouncer=true&connection_limit=1`;
    }
  }
  return url;
}

const prismaClientSingleton = () => {
  const effectiveUrl = getEffectiveDatabaseUrl();
  return new PrismaClient(
    effectiveUrl
      ? {
          datasources: {
            db: {
              url: effectiveUrl,
            },
          },
        }
      : undefined
  );
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;