/**
 * Re-export of the canonical Prisma client from ../prisma.ts
 * This ensures both @/lib/prisma and @/lib/db/prisma resolve to the same singleton
 */
export { prisma, prisma as default } from '../prisma';