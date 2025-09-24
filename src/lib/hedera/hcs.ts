import { getOperator } from "@/lib/hedera/client";
import { prisma } from "@/lib/db/prisma";
import { ulid } from "ulid";
import { TopicMessageSubmitTransaction, Client } from "@hashgraph/sdk";
import { Prisma } from "@prisma/client";

/**
 * Get the appropriate network for link generation
 */
function getHederaNetwork(): string {
  return process.env.HEDERA_NETWORK || 'testnet';
}

/**
 * Generate HashScan topic URL
 * @param topicId - The Hedera topic ID
 * @returns HashScan URL for the topic
 */
export function generateHashScanTopicUrl(topicId: string): string {
  const network = getHederaNetwork();
  const baseUrl = network === 'mainnet' 
    ? 'https://hashscan.io' 
    : `https://hashscan.io/${network}`;
  
  return `${baseUrl}/topic/${topicId}`;
}

/**
 * Generate HashScan transaction URL
 * @param txId - The transaction ID
 * @returns HashScan URL for the transaction
 */
export function generateHashScanTxUrl(txId: string): string {
  const network = getHederaNetwork();
  const baseUrl = network === 'mainnet' 
    ? 'https://hashscan.io' 
    : `https://hashscan.io/${network}`;
  
  return `${baseUrl}/transaction/${txId}`;
}

/**
 * Generate Mirror Node topic URL
 * @param topicId - The Hedera topic ID
 * @returns Mirror Node API URL for the topic
 */
export function generateMirrorTopicUrl(topicId: string): string {
  const network = getHederaNetwork();
  
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
 * Generate Mirror Node transaction URL
 * @param txId - The transaction ID
 * @returns Mirror Node API URL for the transaction
 */
export function generateMirrorTxUrl(txId: string): string {
  const network = getHederaNetwork();
  
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
  
  return `${baseUrl}/api/v1/transactions/${txId}`;
}

export interface HcsEventMessage {
  type: string;
  payload: { [key: string]: any };
}

export async function submitMessage(wellId: string, event: HcsEventMessage) {
  const messageId = ulid();

  const well = await prisma.well.findUnique({
    where: { id: wellId },
  });

  if (!well) {
    throw new Error(`Well not found for id: ${wellId}`);
  }

  const message = {
    type: event.type,
    messageId: messageId,
    payload: event.payload,
  };

  // TODO: Implement validateEvent
  // validateEvent(message);

  // Use mock mode for development
  if (process.env.HEDERA_MOCK_MODE === 'true') {
    console.log('Mock HCS Message Submit:', { wellId, message });
    
    const mockTxId = `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`;
    
    const data: Prisma.HcsEventUncheckedCreateInput = {
      wellId: wellId,
      type: message.type,
      messageId: message.messageId,
      txId: mockTxId,
      payloadJson: JSON.stringify(message.payload),
      consensusTime: new Date(),
      sequenceNumber: BigInt(Math.floor(Math.random() * 1000) + 1),
    };

    const hcsEvent = await prisma.hcsEvent.create({
      data,
    });

    return {
      hcsEvent,
      messageId: hcsEvent.messageId,
      txId: hcsEvent.txId,
    };
  }

  const { client } = getOperator();

  const tx = new TopicMessageSubmitTransaction({
    topicId: well.topicId,
    message: JSON.stringify(message),
  }).freezeWith(client);

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const record = await txResponse.getRecord(client);

  const data: Prisma.HcsEventUncheckedCreateInput = {
    wellId: wellId,
    type: message.type,
    messageId: message.messageId,
    txId: txResponse.transactionId.toString(),
    payloadJson: JSON.stringify(message.payload),
    consensusTime: record.consensusTimestamp.toDate(),
    sequenceNumber: receipt.topicSequenceNumber ? BigInt(receipt.topicSequenceNumber.toString()) : BigInt(0),
  };

  const hcsEvent = await prisma.hcsEvent.create({
    data,
  });

  return {
    hcsEvent,
    messageId: hcsEvent.messageId,
    txId: hcsEvent.txId,
  };
}