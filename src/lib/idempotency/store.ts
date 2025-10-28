import { prisma } from '@/lib/db/prisma';
import { sha256Hex } from '../hash';

// Helper to safely stringify values (handles bigint)
function safeStringify(value: unknown): string {
  return JSON.stringify(value, (key, val) => (typeof val === 'bigint' ? val.toString() : val));
}

/**
 * Ensure idempotent execution backed by Prisma store.
 * New signature: (key, scope, payloadHash, fn) => { reused, result }
 */
export async function ensureIdempotent<T>(
  key: string,
  scope: string,
  payloadHash: string,
  fn: () => Promise<T>
): Promise<{ reused: boolean; result: T }> {
  const dbKey = `${scope}:${key}`;

  // Check existing record
  const existing = await prisma.idempotency.findUnique({
    where: { key: dbKey },
    select: { resultJson: true, resultHash: true }
  });

  if (existing) {
    // If stored result hash matches current payload hash, reuse cached result
    if ((existing.resultHash || '') === (payloadHash || '')) {
      const parsed = existing.resultJson ? JSON.parse(existing.resultJson) : null;
      return {
        reused: true,
        result: parsed as T
      };
    }

    // Conflict: same key/scope but different payload
    const conflictError = new Error('Idempotency key conflict: different payload for same key');
    (conflictError as { status?: number }).status = 409;
    throw conflictError;
  }

  // Execute operation and persist result
  const executed = await fn();
  const resultJson = safeStringify(executed);
  const resultHash = sha256Hex(resultJson);

  // Upsert record (create if not exists, update if concurrently created)
  await prisma.idempotency.upsert({
    where: { key: dbKey },
    create: {
      key: dbKey,
      scope,
      status: 'completed',
      resultJson: resultJson,
      resultHash: resultHash
    },
    update: {
      status: 'completed',
      resultJson: resultJson,
      resultHash: resultHash
    }
  });

  return {
    reused: false,
    result: executed
  };
}

/**
 * Clear all idempotency records (useful for testing)
 */
export async function clearIdempotencyStore(): Promise<void> {
  await prisma.idempotency.deleteMany({});
}

/**
 * Get idempotency record for debugging
 */
export async function getIdempotencyRecord(key: string, scope: string) {
  return prisma.idempotency.findUnique({
    where: { key: `${scope}:${key}` }
  });
}