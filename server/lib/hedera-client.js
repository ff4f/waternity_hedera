// Load environment variables
require('dotenv').config();

const {
  Client,
  PrivateKey,
  AccountId,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenTransferTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  TokenType,
  TokenSupplyType,
  Hbar
} = require('@hashgraph/sdk');

const HEDERA_NET = process.env.HEDERA_NET || 'testnet';
const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID;
const OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY;
const MIRROR_NODE = process.env.HEDERA_MIRROR_NODE || 'https://testnet.mirrornode.hedera.com';

if (!OPERATOR_ID || !OPERATOR_KEY) {
  throw new Error('Missing required Hedera environment variables: HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY');
}

/**
 * Create and configure Hedera client
 * @returns {Client} Configured Hedera client
 */
function createHederaClient() {
  let client;
  
  if (HEDERA_NET === 'mainnet') {
    client = Client.forMainnet();
  } else {
    client = Client.forTestnet();
  }
  
  client.setOperator(
    AccountId.fromString(OPERATOR_ID),
    PrivateKey.fromString(OPERATOR_KEY)
  );
  
  return client;
}

/**
 * HCS (Hedera Consensus Service) utilities
 */
class HCSService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new HCS topic
   * @param {string} memo - Topic memo/description
   * @param {string} submitKey - Optional submit key (defaults to operator key)
   * @returns {Promise<{topicId: string, status: string, txId: string}>}
   */
  async createTopic(memo = '', submitKey = null) {
    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setMaxTransactionFee(new Hbar(2));

      if (submitKey) {
        transaction.setSubmitKey(PrivateKey.fromString(submitKey));
      }

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        topicId: receipt.topicId.toString(),
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to create HCS topic: ${error.message}`);
    }
  }

  /**
   * Submit message to HCS topic
   * @param {string} topicId - Target topic ID
   * @param {object|string} message - Message to submit
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<{txId: string, status: string, sequenceNumber: string}>}
   */
  async submitMessage(topicId, message, messageId = null) {
    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      
      // Add messageId for idempotency if provided
      const finalMessage = messageId ? 
        JSON.stringify({ messageId, ...JSON.parse(messageString) }) : 
        messageString;

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(finalMessage)
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        txId: txResponse.transactionId.toString(),
        status: receipt.status.toString(),
        sequenceNumber: receipt.topicSequenceNumber?.toString() || '0'
      };
    } catch (error) {
      throw new Error(`Failed to submit message to HCS: ${error.message}`);
    }
  }
}

/**
 * HTS (Hedera Token Service) utilities
 */
class HTSService {
  constructor(client) {
    this.client = client;
    this.operatorId = AccountId.fromString(OPERATOR_ID);
    this.operatorKey = PrivateKey.fromString(OPERATOR_KEY);
  }

  /**
   * Create fungible token (for revenue distribution)
   * @param {object} tokenConfig - Token configuration
   * @returns {Promise<{tokenId: string, status: string, txId: string}>}
   */
  async createFungibleToken(tokenConfig) {
    const {
      name = 'WaterCredit',
      symbol = 'WCR',
      decimals = 6,
      initialSupply = 0,
      memo = 'Waternity Revenue Token'
    } = tokenConfig;

    try {
      const transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(this.operatorKey)
        .setSupplyKey(this.operatorKey)
        .setTokenMemo(memo)
        .setFreezeDefault(false)
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        tokenId: receipt.tokenId.toString(),
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to create fungible token: ${error.message}`);
    }
  }

  /**
   * Create NFT token (for Well ownership)
   * @param {object} nftConfig - NFT configuration
   * @returns {Promise<{tokenId: string, status: string, txId: string}>}
   */
  async createNFTToken(nftConfig) {
    const {
      name = 'Waternity Well',
      symbol = 'WELL',
      memo = 'Waternity RWA Well NFT'
    } = nftConfig;

    try {
      const transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenMemo(memo)
        .setTreasuryAccountId(this.operatorId)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setAdminKey(this.operatorKey)
        .setSupplyKey(this.operatorKey)
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        tokenId: receipt.tokenId.toString(),
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to create NFT token: ${error.message}`);
    }
  }

  /**
   * Mint fungible tokens
   * @param {string} tokenId - Token ID to mint
   * @param {number} amount - Amount to mint
   * @returns {Promise<{status: string, txId: string}>}
   */
  async mintFungibleToken(tokenId, amount) {
    try {
      const transaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to mint fungible token: ${error.message}`);
    }
  }

  /**
   * Mint NFT with metadata
   * @param {string} tokenId - NFT token ID
   * @param {string} metadataURI - Metadata URI (IPFS or HTTP)
   * @returns {Promise<{status: string, txId: string, serials: string[]}>}
   */
  async mintNFT(tokenId, metadataURI) {
    try {
      const metadata = Buffer.from(metadataURI);
      
      const transaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([metadata])
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      const serials = receipt.serials ? Array.from(receipt.serials).map(s => s.toString()) : [];
      
      return {
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString(),
        serials
      };
    } catch (error) {
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }

  /**
   * Transfer tokens between accounts
   * @param {string} tokenId - Token ID to transfer
   * @param {string} fromAccountId - Sender account ID
   * @param {string} toAccountId - Receiver account ID
   * @param {number} amount - Amount to transfer (for fungible tokens)
   * @param {string} serialNumber - Serial number (for NFTs)
   * @returns {Promise<{status: string, txId: string}>}
   */
  async transferToken(tokenId, fromAccountId, toAccountId, amount = null, serialNumber = null) {
    try {
      let transaction = new TokenTransferTransaction()
        .setMaxTransactionFee(new Hbar(2));

      if (amount !== null) {
        // Fungible token transfer
        transaction = transaction
          .addTokenTransfer(tokenId, fromAccountId, -amount)
          .addTokenTransfer(tokenId, toAccountId, amount);
      } else if (serialNumber !== null) {
        // NFT transfer
        transaction = transaction
          .addNftTransfer(tokenId, serialNumber, fromAccountId, toAccountId);
      } else {
        throw new Error('Either amount (for fungible) or serialNumber (for NFT) must be provided');
      }

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to transfer token: ${error.message}`);
    }
  }
}

/**
 * HFS (Hedera File Service) utilities
 */
class HFSService {
  constructor(client) {
    this.client = client;
    this.operatorKey = PrivateKey.fromString(OPERATOR_KEY);
  }

  /**
   * Create file on HFS
   * @param {string|Buffer} content - File content
   * @param {string} memo - File memo/description
   * @returns {Promise<{fileId: string, status: string, txId: string}>}
   */
  async createFile(content, memo = '') {
    try {
      const fileContent = typeof content === 'string' ? Buffer.from(content) : content;
      
      const transaction = new FileCreateTransaction()
        .setContents(fileContent)
        .setFileMemo(memo)
        .setKeys([this.operatorKey])
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        fileId: receipt.fileId.toString(),
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to create HFS file: ${error.message}`);
    }
  }

  /**
   * Append content to existing file
   * @param {string} fileId - File ID to append to
   * @param {string|Buffer} content - Content to append
   * @returns {Promise<{status: string, txId: string}>}
   */
  async appendToFile(fileId, content) {
    try {
      const appendContent = typeof content === 'string' ? Buffer.from(content) : content;
      
      const transaction = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(appendContent)
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      return {
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to append to HFS file: ${error.message}`);
    }
  }
}

/**
 * Utility functions
 */
function generateHashScanLink(network, type, id) {
  const baseUrl = `https://hashscan.io/${network}`;
  return `${baseUrl}/${type}/${id}`;
}

function generateMirrorNodeUrl(network, endpoint) {
  const baseUrl = network === 'mainnet' 
    ? 'https://mainnet-public.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';
  return `${baseUrl}${endpoint}`;
}

module.exports = {
  createHederaClient,
  HCSService,
  HTSService,
  HFSService,
  generateHashScanLink,
  generateMirrorNodeUrl,
  HEDERA_NET,
  OPERATOR_ID,
  MIRROR_NODE
};