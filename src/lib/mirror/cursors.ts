import { prisma } from "@/lib/db/prisma";

/**
 * Cursor management for Mirror Node sync using MirrorCursor model
 * Tracks the last consensusTime processed per topic to enable incremental sync
 */

/**
 * Get the cursor for a topic from MirrorCursor table
 * @param topicId - The Hedera topic ID
 * @returns The last consensus timestamp or null if no cursor exists
 */
export async function getCursor(topicId: string): Promise<string | null> {
  const cursor = await prisma.mirrorCursor.findUnique({
    where: { topicId }
  });
  return cursor?.lastConsensusTime || null;
}

/**
 * Save/update the cursor for a topic
 * @param topicId - The Hedera topic ID
 * @param ts - The consensus timestamp in seconds.nanos format
 */
export async function saveCursor(topicId: string, consensusTime: string): Promise<void> {
  await prisma.mirrorCursor.upsert({
    where: { topicId },
    update: { lastConsensusTime: consensusTime },
    create: {
      topicId,
      lastConsensusTime: consensusTime
    }
  });
}

/**
 * Pull messages from Mirror Node and upsert them into local HcsEvent table
 * @param params - Object containing topicId and optional wellId
 * @returns Object with count of messages processed and last consensus time
 */
export async function pullAndUpsert({ topicId, wellId }: { topicId: string; wellId?: string }): Promise<{ pulled: number; lastConsensusTime: string | null }> {
  try {
    // Import fetchTopicMessages here to avoid circular dependency
    const { fetchTopicMessages } = await import('@/lib/hedera/mirror');
    
    // Get current cursor or start from beginning
    const fromTs = await getCursor(topicId) || '0.0';
    
    // Fetch messages from Mirror Node
    const result = await fetchTopicMessages({ topicId, fromTs, limit: 100 });
    
    let maxConsensusTime: string | null = null;
    let processedCount = 0;
    
    // Process each message
    for (const message of result.messages) {
      try {
        const messageId = message.messageId || `${topicId}-${message.sequenceNumber}`;
        
        // Upsert HcsEvent
        await prisma.hcsEvent.upsert({
          where: {
            messageId: messageId
          },
          update: {
            consensusTime: consensusTimestampToDate(message.consensusTime),
            sequenceNumber: BigInt(message.sequenceNumber),
            hash: message.runningHash,
            // Update wellId if provided (this ensures local events get associated)
            ...(wellId && { wellId: wellId })
          },
          create: {
            messageId: messageId,
            type: message.payload?.type || 'UNKNOWN',
            consensusTime: consensusTimestampToDate(message.consensusTime),
            sequenceNumber: BigInt(message.sequenceNumber),
            hash: message.runningHash,
            payloadJson: JSON.stringify(message.payload),
            // Associate with wellId if provided
            ...(wellId && { wellId: wellId })
          }
        });
        
        // Track the maximum consensus time
        if (!maxConsensusTime || message.consensusTime > maxConsensusTime) {
          maxConsensusTime = message.consensusTime;
        }
        
        processedCount++;
      } catch (error) {
        console.warn(`Failed to upsert message ${message.messageId}:`, error);
      }
    }
    
    // Update cursor to the maximum consensus time seen
    if (maxConsensusTime) {
      await saveCursor(topicId, maxConsensusTime);
    }
    
    return {
      pulled: processedCount,
      lastConsensusTime: maxConsensusTime
    };
  } catch (error) {
    console.error('Failed to pull and upsert messages:', error);
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