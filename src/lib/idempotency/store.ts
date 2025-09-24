import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { prisma } from '../db/prisma';

export interface IdempotencyResult {
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  requestHash?: string;
  resultHash?: string;
  result?: string;
  isNew: boolean;
}

export interface IdempotencyStore {
  get(key: string, scope: string): Promise<IdempotencyResult | null>;
  set(key: string, scope: string, status: 'PENDING' | 'SUCCEEDED' | 'FAILED', requestHash?: string, resultHash?: string, result?: string): Promise<void>;
  update(key: string, scope: string, status: 'SUCCEEDED' | 'FAILED', requestHash?: string, resultHash?: string, result?: string): Promise<void>;
}

/**
 * Creates a SHA256 hash of the given data
 */
export function createResultHash(data: any): string {
  const jsonString = JSON.stringify(data, null, 0);
  return createHash('sha256').update(jsonString, 'utf8').digest('hex');
}

/**
 * Prisma-based idempotency store implementation
 */
export class PrismaIdempotencyStore implements IdempotencyStore {
  constructor(private db: PrismaClient = prisma) {}

  async get(key: string, scope: string): Promise<IdempotencyResult | null> {
    const record = await this.db.idempotency.findUnique({
      where: {
        key_scope: {
          key,
          scope,
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      status: record.status as 'PENDING' | 'SUCCEEDED' | 'FAILED',
      requestHash: record.requestHash || undefined,
      resultHash: record.resultHash || undefined,
      result: record.result || undefined,
      isNew: false,
    };
  }

  async set(key: string, scope: string, status: 'PENDING' | 'SUCCEEDED' | 'FAILED', requestHash?: string, resultHash?: string, result?: string): Promise<void> {
    await this.db.idempotency.upsert({
      where: {
        key_scope: {
          key,
          scope,
        },
      },
      update: {
        status,
        requestHash,
        resultHash,
        result,
      },
      create: {
        key,
        scope,
        status,
        requestHash,
        resultHash,
        result,
      },
    });
  }

  async update(key: string, scope: string, status: 'SUCCEEDED' | 'FAILED', requestHash?: string, resultHash?: string, result?: string): Promise<void> {
    await this.db.idempotency.update({
      where: {
        key_scope: {
          key,
          scope,
        },
      },
      data: {
        status,
        requestHash,
        resultHash,
        result,
      },
    });
  }
}

/**
 * Default idempotency store instance
 */
export const idempotencyStore = new PrismaIdempotencyStore();

/**
 * Extracts idempotency key from request headers or body
 */
export function getIdempotencyKey(headers: Record<string, string | string[] | undefined>, body?: any): string | null {
  // First try to get from Idempotency-Key header
  const headerKey = headers['idempotency-key'] || headers['Idempotency-Key'];
  if (headerKey && typeof headerKey === 'string') {
    return headerKey;
  }

  // Fallback to messageId from body if available
  if (body && typeof body === 'object' && body.messageId && typeof body.messageId === 'string') {
    return body.messageId;
  }

  return null;
}

/**
 * Gets the scope (route pathname) for idempotency
 */
export function getIdempotencyScope(pathname: string): string {
  return pathname;
}