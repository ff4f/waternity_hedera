import { env } from "@/lib/env";

/**
 * Generate HashScan URL for a topic
 * @param topicId - Hedera topic ID (e.g., "0.0.12345")
 * @returns HashScan topic URL
 */
export function hashscanTopicUrl(topicId: string): string {
  return `${env.HASHSCAN_BASE}/topic/${topicId}`;
}

/**
 * Generate HashScan URL for a specific topic message
 * @param topicId - Hedera topic ID (e.g., "0.0.12345")
 * @param sequenceNumber - Message sequence number
 * @returns HashScan message URL
 */
export function hashscanMessageUrl(topicId: string, sequenceNumber: number): string {
  return `${env.HASHSCAN_BASE}/topic/${topicId}/message/${sequenceNumber}`;
}

/**
 * Generate HashScan URL for a transaction
 * @param transactionId - Hedera transaction ID
 * @returns HashScan transaction URL
 */
export function hashscanTransactionUrl(transactionId: string): string {
  return `${env.HASHSCAN_BASE}/transaction/${transactionId}`;
}

/**
 * Generate Mirror Node API URL for topic messages
 * @param topicId - Hedera topic ID (e.g., "0.0.12345")
 * @param limit - Optional limit for number of messages
 * @param order - Optional order (asc/desc)
 * @returns Mirror Node topic messages URL
 */
export function mirrorTopicUrl(
  topicId: string, 
  limit?: number, 
  order: 'asc' | 'desc' = 'desc'
): string {
  const baseUrl = `${env.MIRROR_NODE_URL}/topics/${topicId}/messages`;
  const params = new URLSearchParams();
  
  if (limit) {
    params.append('limit', limit.toString());
  }
  
  params.append('order', order);
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Mirror Node API URL for a specific topic message
 * @param topicId - Hedera topic ID (e.g., "0.0.12345")
 * @param sequenceNumber - Message sequence number
 * @returns Mirror Node specific message URL
 */
export function mirrorTopicMessageUrl(topicId: string, sequenceNumber: number): string {
  return `${env.MIRROR_NODE_URL}/topics/${topicId}/messages/${sequenceNumber}`;
}

/**
 * Generate Mirror Node API URL for transaction details
 * @param transactionId - Hedera transaction ID
 * @returns Mirror Node transaction URL
 */
export function mirrorTransactionUrl(transactionId: string): string {
  return `${env.MIRROR_NODE_URL}/transactions/${transactionId}`;
}

/**
 * Generate all relevant links for an HCS message
 * @param topicId - Hedera topic ID
 * @param sequenceNumber - Message sequence number (optional)
 * @param transactionId - Transaction ID (optional)
 * @returns Object with all relevant URLs
 */
export interface HcsLinks {
  topic: { hashscan: string; mirror: string };
  message?: { hashscan: string; mirror: string };
  transaction?: { hashscan: string; mirror: string };
}
export function generateHcsLinks(
  topicId: string,
  sequenceNumber?: number,
  transactionId?: string
) {
  const links: HcsLinks = {
    topic: {
      hashscan: hashscanTopicUrl(topicId),
      mirror: mirrorTopicUrl(topicId)
    }
  };

  if (sequenceNumber !== undefined) {
    links.message = {
      hashscan: hashscanMessageUrl(topicId, sequenceNumber),
      mirror: mirrorTopicMessageUrl(topicId, sequenceNumber)
    };
  }

  if (transactionId) {
    links.transaction = {
      hashscan: hashscanTransactionUrl(transactionId),
      mirror: mirrorTransactionUrl(transactionId)
    };
  }

  return links;
}