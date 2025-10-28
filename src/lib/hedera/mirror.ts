import { env } from "@/lib/env";

export interface MirrorMessage {
  consensusTimestamp: string;
  messageId: string;
  sequenceNumber: number;
  runningHash: string;
  message: string; // base64 encoded
  payload?: unknown; // decoded JSON
}

export interface MirrorNodeMessage {
  consensus_timestamp: string;
  sequence_number: number;
  running_hash: string;
  message: string;
}

export interface MirrorTopicResponse {
  messages: MirrorMessage[];
  links: {
    next?: string;
  };
}

export interface FetchTopicMessagesParams {
  topicId: string;
  fromTs?: string; // timestamp in "seconds.nanos" format
  limit?: number;
}

/**
 * Fetch messages from Hedera Mirror Node REST API
 * @param params - Parameters for fetching messages
 * @returns Promise with messages and pagination links
 */
export async function fetchTopicMessages({
  topicId,
  fromTs,
  limit = 100
}: FetchTopicMessagesParams): Promise<MirrorTopicResponse> {
  try {
    const url = new URL(`/api/v1/topics/${topicId}/messages`, env.MIRROR_NODE_URL);
    
    // Add query parameters
    if (fromTs) {
      url.searchParams.set('timestamp', `gt:${fromTs}`);
    }
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('order', 'asc'); // Ensure chronological order

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process and decode messages
    const messages: MirrorMessage[] = (data.messages || []).map((msg: MirrorNodeMessage) => {
      const decoded = decodeBase64Message(msg.message);
      return {
        consensusTimestamp: msg.consensus_timestamp,
        messageId: `${topicId}-${msg.sequence_number}`,
        sequenceNumber: msg.sequence_number,
        runningHash: msg.running_hash,
        message: msg.message,
        payload: decoded,
      };
    });

    return {
      messages,
      links: data.links || {},
    };
  } catch (error) {
    console.error('Failed to fetch topic messages:', error);
    throw error;
  }
}

/**
 * Decode base64 encoded message to JSON
 * @param base64Message - Base64 encoded message
 * @returns Decoded JSON object or null if invalid
 */
export function decodeBase64Message(base64Message: string): unknown {
   try {
     if (!base64Message) {
       return null;
     }

     // Decode base64 to string
     const decoded = Buffer.from(base64Message, 'base64').toString('utf-8');
     
     // Parse JSON
     return JSON.parse(decoded) as unknown;
   } catch (error) {
     console.warn('Failed to decode base64 message:', error);
     return null;
   }
 }

/**
 * Encode JSON payload to base64 for publishing
 * @param payload - JSON payload to encode
 * @returns Base64 encoded string
 */
export function encodeToBase64(payload: unknown): string {
   try {
     const jsonString = JSON.stringify(payload);
     return Buffer.from(jsonString, 'utf-8').toString('base64');
   } catch (error) {
     console.error('Failed to encode payload to base64:', error);
     throw error;
   }
 }

/**
 * Get topic information from Mirror Node
 * @param topicId - Hedera topic ID
 * @returns Topic information
 */
export async function getTopicInfo(topicId: string) {
  try {
    const url = new URL(`/api/v1/topics/${topicId}`, env.MIRROR_NODE_URL);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get topic info:', error);
    throw error;
  }
}

/**
 * Validate if a timestamp is in correct Hedera format
 * @param timestamp - Timestamp string to validate
 * @returns True if valid format (seconds.nanoseconds)
 */
export function isValidTimestamp(timestamp: string): boolean {
  const timestampRegex = /^\d+\.\d{9}$/;
  return timestampRegex.test(timestamp);
}

/**
 * Convert Date to Hedera consensus timestamp format
 * @param date - Date object
 * @returns Timestamp in "seconds.nanoseconds" format
 */
export function dateToTimestamp(date: Date): string {
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = (date.getTime() % 1000) * 1_000_000;
  return `${seconds}.${nanoseconds.toString().padStart(9, '0')}`;
}

/**
 * Convert Hedera consensus timestamp to Date
 * @param timestamp - Timestamp in "seconds.nanoseconds" format
 * @returns Date object
 */
export function timestampToDate(timestamp: string): Date {
  if (!isValidTimestamp(timestamp)) {
    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }
  
  const [seconds, nanoseconds] = timestamp.split('.');
  const milliseconds = parseInt(seconds) * 1000 + Math.floor(parseInt(nanoseconds) / 1_000_000);
  return new Date(milliseconds);
}