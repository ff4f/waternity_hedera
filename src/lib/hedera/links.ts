/**
 * URL helper functions for Hedera-related links
 */

/**
 * Get the appropriate network prefix for URLs based on environment
 */
function getNetworkPrefix(): string {
  const network = process.env.HEDERA_NETWORK || 'testnet';
  return network === 'mainnet' ? '' : `${network}.`;
}

/**
 * Generate HashScan topic URL
 * @param topicId - The Hedera topic ID (e.g., "0.0.123456")
 * @returns HashScan topic URL
 */
export function hashscanTopicUrl(topicId: string): string {
  const networkPrefix = getNetworkPrefix();
  return `https://${networkPrefix}hashscan.io/topic/${topicId}`;
}

/**
 * Generate HashScan message URL
 * @param topicId - The Hedera topic ID (e.g., "0.0.123456")
 * @param sequence - The message sequence number
 * @returns HashScan message URL
 */
export function hashscanMessageUrl(topicId: string, sequence: number | string): string {
  const networkPrefix = getNetworkPrefix();
  return `https://${networkPrefix}hashscan.io/topic/${topicId}/message/${sequence}`;
}

/**
 * Generate Mirror Node topic URL
 * @param topicId - The Hedera topic ID (e.g., "0.0.123456")
 * @returns Mirror Node REST API topic URL
 */
export function mirrorTopicUrl(topicId: string): string {
  const network = process.env.HEDERA_NETWORK || 'testnet';
  
  let baseUrl: string;
  switch (network) {
    case 'mainnet':
      baseUrl = 'https://mainnet-public.mirrornode.hedera.com';
      break;
    case 'testnet':
      baseUrl = 'https://testnet.mirrornode.hedera.com';
      break;
    case 'previewnet':
      baseUrl = 'https://previewnet.mirrornode.hedera.com';
      break;
    default:
      baseUrl = 'https://testnet.mirrornode.hedera.com';
  }
  
  return `${baseUrl}/api/v1/topics/${topicId}/messages`;
}

/**
 * Generate Mirror Node message URL
 * @param topicId - The Hedera topic ID (e.g., "0.0.123456")
 * @param sequence - The message sequence number
 * @returns Mirror Node REST API message URL
 */
export function mirrorMessageUrl(topicId: string, sequence: number | string): string {
  const baseUrl = mirrorTopicUrl(topicId);
  return `${baseUrl}/${sequence}`;
}

/**
 * Generate all relevant links for an HCS event
 * @param topicId - The Hedera topic ID
 * @param sequenceNumber - The message sequence number
 * @returns Object containing all relevant links
 */
export function generateEventLinks(topicId: string, sequenceNumber: number | string) {
  return {
    hashscan: hashscanMessageUrl(topicId, sequenceNumber),
    mirror: mirrorMessageUrl(topicId, sequenceNumber),
    topic: {
      hashscan: hashscanTopicUrl(topicId),
      mirror: mirrorTopicUrl(topicId)
    }
  };
}