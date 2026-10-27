import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error Prisma query event typing
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug({ query: e.query, durationMs: e.duration }, 'Prisma Query');
  });
}
