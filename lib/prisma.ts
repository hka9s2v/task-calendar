import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// NeonDB用の接続設定
const createPrismaClient = () => {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // 本番環境（NeonDB）の場合は接続プーリング設定を追加
  const databaseUrl = process.env.NODE_ENV === 'production' && baseUrl.includes('neon.tech')
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}connection_limit=1&pool_timeout=20`
    : baseUrl;

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 