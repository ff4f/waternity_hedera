import {
  Client,
  PrivateKey,
  AccountId,
  TopicId,
  FileId,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicInfoQuery,
  FileCreateTransaction,
  FileAppendTransaction,
  FileContentsQuery,
  FileInfoQuery,
  Hbar,
  Status
} from '@hashgraph/sdk';
import { createHash } from 'crypto';

export interface HederaConfig {
  operatorId: string;
  operatorKey: string;
  network: 'testnet' | 'mainnet';
}

export interface TopicMessage {
  consensusTimestamp: string;
  message: string;
  runningHash: string;
  sequenceNumber: number;
}

export interface FileInfo {
  fileId: string;
  size: number;
  expirationTime: string;
  isDeleted: boolean;
  keys: string[];
}

export class HederaCoreService {
  private client: Client;
  private operatorKey: PrivateKey;
  private operatorId: AccountId;

  constructor(config: HederaConfig) {
    // Initialize Hedera client
    if (config.network === 'testnet') {
      this.client = Client.forTestnet();
    } else {
      this.client = Client.forMainnet();
    }

    this.operatorKey = PrivateKey.fromString(config.operatorKey);
    this.operatorId = AccountId.fromString(config.operatorId);
    
    this.client.setOperator(this.operatorId, this.operatorKey);
  }

  // ===== HEDERA CONSENSUS SERVICE (HCS) =====

  /**
   * Create a new HCS topic for consensus
   */
  async createTopic(
    memo?: string,
    adminKey?: PrivateKey,
    submitKey?: PrivateKey
  ): Promise<TopicId> {
    try {
      const transaction = new TopicCreateTransaction();
      
      if (memo) {
        transaction.setTopicMemo(memo);
      }
      
      if (adminKey) {
        transaction.setAdminKey(adminKey.publicKey);
      }
      
      if (submitKey) {
        transaction.setSubmitKey(submitKey.publicKey);
      }

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`Topic creation failed with status: ${receipt.status}`);
      }

      const topicId = receipt.topicId;
      if (!topicId) {
        throw new Error('Topic ID not found in receipt');
      }

      console.log(`Created topic: ${topicId}`);
      return topicId;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw new Error('Failed to create HCS topic');
    }
  }

  /**
   * Submit a message to an HCS topic
   */
  async submitMessage(
    topicId: TopicId | string,
    message: string | Uint8Array
  ): Promise<{
    transactionId: string;
    consensusTimestamp: string;
    sequenceNumber: number;
  }> {
    try {
      const topic = typeof topicId === 'string' ? TopicId.fromString(topicId) : topicId;
      
      const transaction = new TopicMessageSubmitTransaction({
        topicId: topic,
        message: message
      });

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`Message submission failed with status: ${receipt.status}`);
      }

      return {
        transactionId: response.transactionId.toString(),
        consensusTimestamp: new Date().toISOString(), // Use current timestamp as receipt doesn't have consensus timestamp
        sequenceNumber: receipt.topicSequenceNumber?.toNumber() || 0
      };
    } catch (error) {
      console.error('Error submitting message:', error);
      throw new Error('Failed to submit message to HCS topic');
    }
  }

  /**
   * Get topic information
   */
  async getTopicInfo(topicId: TopicId | string): Promise<{
    topicId: string;
    memo: string;
    runningHash: string;
    sequenceNumber: number;
    expirationTime: string;
    adminKey?: string;
    submitKey?: string;
  }> {
    try {
      const topic = typeof topicId === 'string' ? TopicId.fromString(topicId) : topicId;
      
      const query = new TopicInfoQuery()
        .setTopicId(topic);

      const info = await query.execute(this.client);

      return {
        topicId: info.topicId.toString(),
        memo: info.topicMemo,
        runningHash: info.runningHash.toString(),
        sequenceNumber: info.sequenceNumber.toNumber(),
        expirationTime: info.expirationTime?.toString() || '',
        adminKey: info.adminKey?.toString(),
        submitKey: info.submitKey?.toString()
      };
    } catch (error) {
      console.error('Error getting topic info:', error);
      throw new Error('Failed to get topic information');
    }
  }

  // ===== HEDERA FILE SERVICE (HFS) =====

  /**
   * Create a new file on HFS
   */
  async createFile(
    contents: string | Uint8Array,
    keys?: PrivateKey[],
    memo?: string
  ): Promise<FileId> {
    try {
      const transaction = new FileCreateTransaction()
        .setContents(contents)
        .setMaxTransactionFee(new Hbar(2));
      
      if (keys && keys.length > 0) {
        transaction.setKeys(keys.map(key => key.publicKey));
      }
      
      if (memo) {
        transaction.setFileMemo(memo);
      }

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`File creation failed with status: ${receipt.status}`);
      }

      const fileId = receipt.fileId;
      if (!fileId) {
        throw new Error('File ID not found in receipt');
      }

      console.log(`Created file: ${fileId}`);
      return fileId;
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error('Failed to create HFS file');
    }
  }

  /**
   * Append content to an existing file
   */
  async appendToFile(
    fileId: FileId | string,
    contents: string | Uint8Array
  ): Promise<string> {
    try {
      const file = typeof fileId === 'string' ? FileId.fromString(fileId) : fileId;
      
      const transaction = new FileAppendTransaction()
        .setFileId(file)
        .setContents(contents)
        .setMaxTransactionFee(new Hbar(2));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`File append failed with status: ${receipt.status}`);
      }

      return response.transactionId.toString();
    } catch (error) {
      console.error('Error appending to file:', error);
      throw new Error('Failed to append to HFS file');
    }
  }

  /**
   * Get file contents
   */
  async getFileContents(fileId: FileId | string): Promise<Uint8Array> {
    try {
      const file = typeof fileId === 'string' ? FileId.fromString(fileId) : fileId;
      
      const query = new FileContentsQuery()
        .setFileId(file);

      const contents = await query.execute(this.client);
      return contents;
    } catch (error) {
      console.error('Error getting file contents:', error);
      throw new Error('Failed to get file contents');
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: FileId | string): Promise<FileInfo> {
    try {
      const file = typeof fileId === 'string' ? FileId.fromString(fileId) : fileId;
      
      const query = new FileInfoQuery()
        .setFileId(file);

      const info = await query.execute(this.client);

      return {
        fileId: info.fileId.toString(),
        size: info.size.toNumber(),
        expirationTime: info.expirationTime?.toString() || '',
        isDeleted: info.isDeleted,
        keys: info.keys ? Array.from(info.keys).map((key) => key.toString()) : []
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error('Failed to get file information');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Submit water quality data to HCS topic
   */
  async submitWaterQualityData(
    topicId: TopicId | string,
    wellId: string,
    qualityData: {
      ph: number;
      turbidity: number;
      temperature: number;
      dissolvedOxygen: number;
      conductivity: number;
      timestamp: string;
      location: { lat: number; lng: number };
    }
  ): Promise<string> {
    const message = {
      type: 'WATER_QUALITY',
      wellId,
      data: qualityData,
      timestamp: new Date().toISOString()
    };

    const result = await this.submitMessage(topicId, JSON.stringify(message));
    return result.transactionId;
  }

  /**
   * Submit water usage data to HCS topic
   */
  async submitWaterUsageData(
    topicId: TopicId | string,
    wellId: string,
    usageData: {
      volume: number;
      userId: string;
      purpose: string;
      timestamp: string;
      meterReading: number;
    }
  ): Promise<string> {
    const message = {
      type: 'WATER_USAGE',
      wellId,
      data: usageData,
      timestamp: new Date().toISOString()
    };

    const result = await this.submitMessage(topicId, JSON.stringify(message));
    return result.transactionId;
  }

  /**
   * Store document on HFS and submit hash to HCS
   */
  async storeDocumentWithProof(
    topicId: TopicId | string,
    document: string | Uint8Array,
    metadata: {
      documentType: string;
      wellId: string;
      uploadedBy: string;
      description?: string;
    }
  ): Promise<{
    fileId: string;
    transactionId: string;
    documentHash: string;
  }> {
    try {
      // Store document on HFS
      const fileId = await this.createFile(document, undefined, metadata.documentType);
      
      // Create document hash
      const documentHash = this.createHash(document);
      
      // Submit proof to HCS
      const proofMessage = {
        type: 'DOCUMENT_PROOF',
        fileId: fileId.toString(),
        documentHash,
        metadata,
        timestamp: new Date().toISOString()
      };
      
      const result = await this.submitMessage(topicId, JSON.stringify(proofMessage));
      
      return {
        fileId: fileId.toString(),
        transactionId: result.transactionId,
        documentHash
      };
    } catch (error) {
      console.error('Error storing document with proof:', error);
      throw new Error('Failed to store document with proof');
    }
  }

  /**
   * Create SHA-256 hash of content
   */
  private createHash(content: string | Uint8Array): string {
    const hash = createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }
}

// Create singleton instance
const hederaConfig: HederaConfig = {
  operatorId: process.env.HEDERA_OPERATOR_ID || '',
  operatorKey: process.env.HEDERA_OPERATOR_KEY || '',
  network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet'
};

export const hederaCoreService = new HederaCoreService(hederaConfig);