import { prisma } from "@/lib/db/prisma";

/**
 * Cursor management for Mirror Node sync
 * Tracks the last consensusTime processed per topic to enable incremental sync
 */

interface TopicCursor {
  topicId: string;
  lastConsensusTime: string;
  lastSequenceNumber?: bigint;
  updatedAt: Date;
}

/**
 * Get the last cursor for a topic
 * @param topicId - The Hedera topic ID
 * @returns The last consensus timestamp or null if no cursor exists
 */
export async function getTopicCursor(topicId: string): Promise<string | null> {
  try {
    // First try to get from the most recent HcsEvent for this topic
    const lastEvent = await prisma.hcsEvent.findFirst({
      where: {
        well: {
          topicId: topicId
        },
        consensusTime: {
          not: null
        }
      },
      orderBy: {
        consensusTime: 'desc'
      },
      select: {
        consensusTime: true
      }
    });

    if (lastEvent?.consensusTime) {
      // Convert to nanoseconds timestamp format expected by Mirror API
      return (lastEvent.consensusTime.getTime() * 1_000_000).toString();
    }

    return null;
  } catch (error) {
    console.error('Failed to get topic cursor:', error);
    return null;
  }
}

/**
 * Update the cursor for a topic based on processed messages
 * @param topicId - The Hedera topic ID
 * @param consensusTime - The latest consensus timestamp processed
 * @param sequenceNumber - The latest sequence number processed
 */
export async function updateTopicCursor(
  topicId: string,
  consensusTime: string,
  sequenceNumber?: bigint
): Promise<void> {
  try {
    // The cursor is implicitly updated when we upsert HcsEvents with consensusTime
    // This function serves as a placeholder for explicit cursor management if needed
    console.log(`Updated cursor for topic ${topicId} to ${consensusTime}`);
  } catch (error) {
    console.error('Failed to update topic cursor:', error);
    throw error;
  }
}

/**
 * Get all topics that need syncing (have wells but may be missing recent events)
 * @returns Array of topic IDs that should be synced
 */
export async function getTopicsForSync(): Promise<string[]> {
  try {
    const wells = await prisma.well.findMany({
      select: {
        topicId: true
      },
      distinct: ['topicId']
    });

    return wells.map(well => well.topicId);
  } catch (error) {
    console.error('Failed to get topics for sync:', error);
    return [];
  }
}

/**
 * Calculate the next timestamp to query from Mirror Node
 * @param topicId - The Hedera topic ID
 * @returns Timestamp string for Mirror API query or null to start from beginning
 */
export async function getNextSyncTimestamp(topicId: string): Promise<string | null> {
  const cursor = await prisma.hcsEvent.findFirst({
    where: {
      wellId: { equals: null },
      messageId: {
        startsWith: `cursor:${topicId}:`
      }
    },
    orderBy: {
      consensusTime: 'desc'
    }
  });

  if (!cursor?.consensusTime) {
    return null;
  }

  // Convert to Hedera timestamp format and add 1 nanosecond
  const timestamp = dateToConsensusTimestamp(cursor.consensusTime);
  const [seconds, nanos] = timestamp.split('.').map(Number);
  const nextNanos = nanos + 1;
  
  if (nextNanos >= 1_000_000_000) {
    return `${seconds + 1}.000000001`;
  }
  
  return `${seconds}.${nextNanos.toString().padStart(9, '0')}`;
}

/**
 * Update the sync cursor for a topic with the latest consensus timestamp
 */
export async function updateSyncCursor(topicId: string, consensusTimestamp: string): Promise<void> {
  const consensusTime = consensusTimestampToDate(consensusTimestamp);
  const messageId = `cursor:${topicId}:${consensusTimestamp}`;

  await prisma.hcsEvent.upsert({
    where: {
      messageId
    },
    update: {
      consensusTime,
      payloadJson: JSON.stringify({ type: 'SYNC_CURSOR', topicId, timestamp: consensusTimestamp })
    },
    create: {
      type: 'SYNC_CURSOR',
      messageId,
      consensusTime,
      sequenceNumber: BigInt(0),
      payloadJson: JSON.stringify({ type: 'SYNC_CURSOR', topicId, timestamp: consensusTimestamp })
    }
  });
}

/**
 * Validate consensus timestamp format
 * @param timestamp - Timestamp string to validate
 * @returns True if valid format
 */
export function isValidConsensusTimestamp(timestamp: string): boolean {
  // Hedera consensus timestamps are in format: seconds.nanoseconds
  const timestampRegex = /^\d+\.\d{9}$/;
  return timestampRegex.test(timestamp);
}

/**
 * Convert consensus timestamp to Date object
 * @param consensusTimestamp - Hedera consensus timestamp (seconds.nanoseconds)
 * @returns Date object
 */
export function consensusTimestampToDate(consensusTimestamp: string): Date {
  if (!isValidConsensusTimestamp(consensusTimestamp)) {
    throw new Error(`Invalid consensus timestamp format: ${consensusTimestamp}`);
  }

  const [seconds, nanoseconds] = consensusTimestamp.split('.');
  const milliseconds = parseInt(seconds) * 1000 + Math.floor(parseInt(nanoseconds) / 1_000_000);
  return new Date(milliseconds);
}

/**
 * Convert Date to consensus timestamp format
 * @param date - Date object
 * @returns Consensus timestamp string (seconds.nanoseconds)
 */
export function dateToConsensusTimestamp(date: Date): string {
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = (date.getTime() % 1000) * 1_000_000;
  return `${seconds}.${nanoseconds.toString().padStart(9, '0')}`;
}