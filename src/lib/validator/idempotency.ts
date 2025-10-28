import { createHash } from 'crypto';
import { prisma } from '@/lib/db/prisma';

export interface IdempotencyResult<T = unknown> {
  isNew: boolean;
  result?: T;
  resultHash?: string;
}

/**
 * Ensure idempotent operation execution
 * @param key - Idempotency key (UUIDv4)
 * @param scope - Operation scope (e.g., 'hcs_events', 'settlements', 'documents_anchor')
 * @param fn - Function to execute if operation is new
 * @returns Result with isNew flag and cached result if exists
 */
export async function ensureIdempotent<T>(
  key: string,
  scope: string,
  fn: () => Promise<T>
): Promise<IdempotencyResult<T>> {
  try {
    // Check if operation already exists
    const existing = await prisma.idempotency.findUnique({
      where: {
        key: `${scope}:${key}`
      }
    });

    if (existing) {
      if (existing.status === 'completed' && existing.resultHash) {
        // Return cached result
        return {
          isNew: false,
          result: existing.resultJson ? JSON.parse(existing.resultJson) as T : (null as unknown as T),
          resultHash: existing.resultHash
        };
      } else if (existing.status === 'processing') {
        // Operation is still in progress, wait or return error
        throw new Error('Operation already in progress');
      } else if (existing.status === 'failed') {
        // Previous operation failed, allow retry
        await prisma.idempotency.delete({
          where: { id: existing.id }
        });
      }
    }

    // Create new idempotency record with processing status
    await prisma.idempotency.create({
      data: {
        key: `${scope}:${key}`,
        scope,
        status: 'processing'
      }
    });

    try {
      // Execute the operation
      const result = await fn();
      
      // Generate result hash
      const resultHash = createHash('sha256')
        .update(JSON.stringify(result, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        ))
        .digest('hex');

      // Update idempotency record with completed status
      await prisma.idempotency.update({
        where: {
          key: `${scope}:${key}`
        },
        data: {
          status: 'completed',
          resultJson: JSON.stringify(result, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          ),
          resultHash
        }
      });

      return {
        isNew: true,
        result,
        resultHash
      };
    } catch (error) {
      // Mark operation as failed
      await prisma.idempotency.update({
        where: {
          key: `${scope}:${key}`
        },
        data: {
          status: 'failed'
        }
      });
      
      throw error;
    }
  } catch (error) {
    console.error('Idempotency check failed:', error);
    throw error;
  }
}

/**
 * Clean up old idempotency records (older than specified days)
 * @param daysOld - Number of days to keep records
 */
export async function cleanupIdempotencyRecords(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.idempotency.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });

  return result.count;
}

/**
 * Get idempotency record status
 * @param key - Idempotency key
 * @param scope - Operation scope
 */
export async function getIdempotencyStatus(
  key: string,
  scope: string
): Promise<{ status: string; resultHash: string | null } | null> {
  const record = await prisma.idempotency.findUnique({
    where: {
        key: `${scope}:${key}`
      },
    select: {
      status: true,
      resultHash: true
    }
  });

  return record;
}

/**
 * Wrapper for idempotent operations with different return format
 * @param key - Idempotency key
 * @param scope - Operation scope
 * @param fn - Function to execute
 * @returns Result with isExisting flag and result
 */
export async function withIdempotency<T>(
  key: string,
  scope: string,
  fn: () => Promise<T>
): Promise<{ isExisting: boolean; result: T }> {
  const idempotencyResult = await ensureIdempotent(key, scope, fn);
  
  return {
    isExisting: !idempotencyResult.isNew,
    result: idempotencyResult.result as T
  };
}