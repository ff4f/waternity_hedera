import { prisma } from "@/lib/db/prisma";

/**
 * Get the last consensus timestamp cursor for a topic
 * @param topicId - Hedera topic ID
 * @returns Last consensus timestamp or null if no cursor exists
 */
export async function getCursor(topicId: string): Promise<string | null> {
  const cursor = await prisma.mirrorCursor.findUnique({
    where: { topicId },
  });
  
  return cursor?.lastConsensusTime || null;
}

/**
 * Save/update the consensus timestamp cursor for a topic
 * @param topicId - Hedera topic ID
 * @param consensusTimestamp - Consensus timestamp in "seconds.nanos" format
 */
export async function saveCursor(
  topicId: string, 
  consensusTimestamp: string
): Promise<void> {
  await prisma.mirrorCursor.upsert({
    where: { topicId },
    create: {
      topicId,
      lastConsensusTime: consensusTimestamp,
    },
    update: {
      lastConsensusTime: consensusTimestamp,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get all cursors for monitoring/debugging
 * @returns Array of all cursor records
 */
export async function getAllCursors() {
  return await prisma.mirrorCursor.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Delete cursor for a topic (useful for reset/cleanup)
 * @param topicId - Hedera topic ID
 */
export async function deleteCursor(topicId: string): Promise<void> {
  await prisma.mirrorCursor.delete({
    where: { topicId },
  }).catch(() => {
    // Ignore if cursor doesn't exist
  });
}

/**
 * Initialize cursor with earliest timestamp (for full sync)
 * @param topicId - Hedera topic ID
 * @param startTimestamp - Starting timestamp (defaults to "0.0")
 */
export async function initializeCursor(
  topicId: string, 
  startTimestamp: string = "0.0"
): Promise<void> {
  await saveCursor(topicId, startTimestamp);
}