import { TopicMessageSubmitTransaction, TransactionResponse } from "@hashgraph/sdk";
import { createHederaClient } from "./client";
import { sha256Hex } from "@/lib/hash";
import { env } from "@/lib/env";

export interface PublishEventParams {
  topicId: string;
  messageJson: Record<string, unknown>;
  messageId?: string;
}

export interface PublishEventResult {
  transactionId: string;
  consensusTimestamp?: string;
  sequenceNumber?: number;
  messageHash: string;
  messageId: string;
}

/**
 * Publish an event to Hedera Consensus Service (HCS)
 * @param params - Publishing parameters
 * @returns Promise with transaction details
 */
export async function publishEvent({
  topicId,
  messageJson,
  messageId
}: PublishEventParams): Promise<PublishEventResult> {
  try {
    const client = createHederaClient();
    
    // Generate message ID if not provided
    const finalMessageId = messageId || crypto.randomUUID();
    
    // Add metadata to the message
    const messageWithMetadata = {
      ...messageJson,
      messageId: finalMessageId,
      timestamp: new Date().toISOString()
    };
    
    // Convert to JSON string
    const messageString = JSON.stringify(messageWithMetadata);
    
    // Calculate message hash
    const messageHash = sha256Hex(messageString);
    
    // Create and submit the transaction
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(messageString);
    
    // Execute the transaction
    const response: TransactionResponse = await transaction.execute(client);
    
    // Get the transaction receipt and record
    const receipt = await response.getReceipt(client);
    const record = await response.getRecord(client);
    
    // Get consensus timestamp from record and sequence number from receipt
    const consensusTimestamp = record.consensusTimestamp?.toString();
    const sequenceNumber = receipt.topicSequenceNumber?.toNumber();
    
    return {
      transactionId: response.transactionId.toString(),
      consensusTimestamp,
      sequenceNumber,
      messageHash,
      messageId: finalMessageId
    };
    
  } catch (error) {
    console.error('Failed to publish HCS event:', error);
    throw new Error(
      `Failed to publish event to topic ${topicId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Publish multiple events to HCS in batch
 * @param events - Array of events to publish
 * @returns Promise with array of results
 */
export async function publishEventBatch(
  events: PublishEventParams[]
): Promise<PublishEventResult[]> {
  const results: PublishEventResult[] = [];
  
  for (const event of events) {
    try {
      const result = await publishEvent(event);
      results.push(result);
    } catch (error) {
      console.error(`Failed to publish event ${event.messageId}:`, error);
      // Continue with other events even if one fails
      throw error;
    }
  }
  
  return results;
}

/**
 * Validate topic ID format
 * @param topicId - Topic ID to validate
 * @returns boolean indicating if valid
 */
export function isValidTopicId(topicId: string): boolean {
  // Hedera topic ID format: shard.realm.num (e.g., "0.0.12345")
  const topicIdRegex = /^\d+\.\d+\.\d+$/;
  return topicIdRegex.test(topicId);
}

/**
 * Get topic info from Mirror Node
 * @param topicId - Topic ID to query
 * @returns Promise with topic information
 */
export async function getTopicInfo(topicId: string) {
  if (!isValidTopicId(topicId)) {
    throw new Error(`Invalid topic ID format: ${topicId}`);
  }
  
  try {
    // Ensure we preserve the '/api/v1' path from the configured base and avoid issues with URL resolution
    const base = env.MIRROR_NODE_URL.replace(/\/+$/, '');
    const url = `${base}/topics/${topicId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mirror Node request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get topic info:', error);
    throw new Error(
      `Failed to get topic info for ${topicId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}