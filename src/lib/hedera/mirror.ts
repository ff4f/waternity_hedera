import { z } from "zod";
import { getTopicCursor, updateTopicCursor, consensusTimestampToDate } from "@/lib/mirror/cursors";

const MirrorMessage = z.object({
  consensus_timestamp: z.string(),
  message: z.string(),
  running_hash: z.string(),
  running_hash_version: z.number(),
  sequence_number: z.number(),
  topic_id: z.string(),
});

const MirrorMessagesResponse = z.object({
  messages: z.array(MirrorMessage),
  links: z.object({
    next: z.string().nullable(),
  }),
});

export interface ParsedMirrorMessage {
  consensusTime: string;
  sequenceNumber: number;
  runningHash: string;
  messageId?: string;
  payload: any;
  rawMessage: string;
}

export interface MirrorSyncResult {
  messages: ParsedMirrorMessage[];
  totalFetched: number;
  lastCursor: string | null;
  hasMore: boolean;
}

/**
 * Get the appropriate Mirror Node base URL based on network
 */
function getMirrorNodeUrl(): string {
  const network = process.env.HEDERA_NETWORK || 'testnet';
  
  switch (network) {
    case 'mainnet':
      return 'https://mainnet-public.mirrornode.hedera.com';
    case 'testnet':
      return 'https://testnet.mirrornode.hedera.com';
    case 'previewnet':
      return 'https://previewnet.mirrornode.hedera.com';
    default:
      return 'https://testnet.mirrornode.hedera.com';
  }
}

/**
 * Parse a base64 encoded message from Mirror Node
 * @param base64Message - The base64 encoded message
 * @returns Parsed message object or null if parsing fails
 */
function parseMessage(base64Message: string): { messageId?: string; payload: any } | null {
  try {
    const decoded = Buffer.from(base64Message, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    
    return {
      messageId: parsed.messageId,
      payload: parsed
    };
  } catch (error) {
    console.warn('Failed to parse message:', error);
    return {
      payload: { rawMessage: base64Message }
    };
  }
}

/**
 * Fetches topic messages from the Hedera Mirror Node REST API with pagination.
 *
 * @param topicId - The topic ID to fetch messages from.
 * @param fromTs - The starting timestamp (nanoseconds).
 * @param limit - Maximum number of messages to fetch (default: 100)
 * @returns A promise that resolves to the sync result.
 */
export async function fetchTopicMessages({
  topicId,
  fromTs,
  limit = 100,
}: {
  topicId: string;
  fromTs?: string;
  limit?: number;
}): Promise<MirrorSyncResult> {
  const params = new URLSearchParams();
  params.append('order', 'asc');
  params.append('limit', limit.toString());
  
  if (fromTs) {
    params.append('timestamp', `gt:${fromTs}`);
  }

  const baseUrl = getMirrorNodeUrl();
  const url = `${baseUrl}/api/v1/topics/${topicId}/messages?${params.toString()}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Topic not found or no messages
        return {
          messages: [],
          totalFetched: 0,
          lastCursor: null,
          hasMore: false
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const { messages, links } = MirrorMessagesResponse.parse(data);

    const parsedMessages: ParsedMirrorMessage[] = messages.map((msg) => {
      const parsed = parseMessage(msg.message);
      
      return {
        consensusTime: msg.consensus_timestamp,
        sequenceNumber: msg.sequence_number,
        runningHash: msg.running_hash || '',
        messageId: parsed?.messageId,
        payload: parsed?.payload || {},
        rawMessage: msg.message
      };
    });

    const lastCursor = messages.length > 0 
      ? messages[messages.length - 1].consensus_timestamp 
      : null;

    return {
      messages: parsedMessages,
      totalFetched: parsedMessages.length,
      lastCursor,
      hasMore: messages.length === limit
    };
  } catch (error) {
    console.error('Failed to fetch topic messages:', error);
    return {
      messages: [],
      totalFetched: 0,
      lastCursor: null,
      hasMore: false
    };
  }
}

/**
 * Sync all messages for a topic from Mirror Node with automatic pagination
 * @param topicId - The Hedera topic ID
 * @param fromTimestamp - Optional starting timestamp
 * @param maxMessages - Maximum total messages to fetch (default: 1000)
 * @returns Complete sync result
 */
export async function syncTopicMessages(
  topicId: string,
  fromTimestamp?: string,
  maxMessages: number = 1000
): Promise<MirrorSyncResult> {
  const allMessages: ParsedMirrorMessage[] = [];
  let currentCursor = fromTimestamp;
  let totalFetched = 0;
  let hasMore = true;

  while (hasMore && totalFetched < maxMessages) {
    const remaining = maxMessages - totalFetched;
    const batchSize = Math.min(100, remaining);
    
    const result = await fetchTopicMessages({
      topicId,
      fromTs: currentCursor,
      limit: batchSize
    });

    allMessages.push(...result.messages);
    totalFetched += result.totalFetched;
    hasMore = result.hasMore && result.totalFetched > 0;
    currentCursor = result.lastCursor || undefined;

    // Small delay to avoid rate limiting
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    messages: allMessages,
    totalFetched: allMessages.length,
    lastCursor: currentCursor || null,
    hasMore: hasMore && totalFetched >= maxMessages
  };
}