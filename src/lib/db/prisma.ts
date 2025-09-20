import { PrismaClient } from '@prisma/client';
import { env } from '../env';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma Client with optimized configuration
export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

// Store Prisma Client in global scope in development to prevent hot reload issues
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Database connection helper
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Database health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Transaction helper with retry logic
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
        isolationLevel: 'ReadCommitted'
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown transaction error');
      
      if (attempt === maxRetries) {
        console.error(`Transaction failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
    }
  }
  
  throw lastError!;
}

// Batch operations helper
export async function batchUpsert<T extends Record<string, any>>(
  model: keyof PrismaClient,
  data: T[],
  uniqueFields: (keyof T)[],
  batchSize = 100
) {
  const results = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const where = uniqueFields.reduce((acc, field) => {
          acc[field as string] = item[field];
          return acc;
        }, {} as Record<string, any>);
        
        return (prisma[model] as any).upsert({
          where,
          update: item,
          create: item
        });
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

// Query optimization helpers
export const queryHelpers = {
  // Get wells with pagination and filtering
  async getWellsPaginated({
    page = 1,
    limit = 10,
    status,
    operatorId,
    search
  }: {
    page?: number;
    limit?: number;
    status?: string;
    operatorId?: string;
    search?: string;
  } = {}) {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(status && { status }),
      ...(operatorId && { operatorUserId: operatorId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { location: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };
    
    const [wells, total] = await Promise.all([
      prisma.well.findMany({
        where,
        skip,
        take: limit,
        include: {
          operator: { select: { id: true, name: true, walletEvm: true } },
          memberships: {
            include: {
              user: { select: { id: true, name: true, walletEvm: true } },
              role: { select: { name: true, description: true } }
            }
          },
          _count: {
            select: { events: true, documents: true, settlements: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.well.count({ where })
    ]);
    
    return {
      wells,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },
  
  // Get HCS events timeline for a well
  async getWellTimeline(wellId: string, limit = 50) {
    return prisma.hcsEvent.findMany({
      where: { wellId },
      take: limit,
      orderBy: [
        { consensusTime: 'desc' },
        { sequenceNumber: 'desc' }
      ],
      include: {
        well: { select: { code: true, name: true } }
      }
    });
  },
  
  // Get settlement reports for a period
  async getSettlementReports({
    wellId,
    startDate,
    endDate,
    status
  }: {
    wellId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  } = {}) {
    const where = {
      ...(wellId && { wellId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate }
      })
    };
    
    return prisma.settlement.findMany({
      where,
      include: {
        well: { select: { code: true, name: true } },
        payouts: {
          include: {
            recipientUser: { select: { name: true, walletEvm: true } }
          }
        },
        requestEvent: { select: { consensusTime: true, txId: true } },
        executeEvent: { select: { consensusTime: true, txId: true } }
      },
      orderBy: { periodStart: 'desc' }
    });
  }
};

// Export types
export type { PrismaClient } from '@prisma/client';
export type DatabaseHealth = Awaited<ReturnType<typeof checkDatabaseHealth>>;
export type WellsPaginated = Awaited<ReturnType<typeof queryHelpers.getWellsPaginated>>;
export type WellTimeline = Awaited<ReturnType<typeof queryHelpers.getWellTimeline>>;
export type SettlementReports = Awaited<ReturnType<typeof queryHelpers.getSettlementReports>>;