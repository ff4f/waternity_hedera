const {
  Client,
  PrivateKey,
  AccountId,
  TopicMessageSubmitTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  Hbar,
  TokenId,
  AccountBalanceQuery,
  TopicId
} = require('@hashgraph/sdk');

// Network configuration
const HEDERA_NET = process.env.HEDERA_NETWORK || 'testnet';
const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;
const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;

/**
 * Create and configure Hedera client
 */
function createHederaClient() {
  if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) {
    throw new Error('Missing required Hedera environment variables');
  }

  const client = HEDERA_NET === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  
  client.setOperator(
    AccountId.fromString(HEDERA_ACCOUNT_ID),
    PrivateKey.fromString(HEDERA_PRIVATE_KEY)
  );

  return client;
}

/**
 * HCS Service for topic message submission
 */
class HCSService {
  constructor(client) {
    this.client = client || createHederaClient();
  }

  /**
   * Submit message to HCS topic
   */
  async submitMessage(topicId, message) {
    try {
      const transaction = new TopicMessageSubmitTransaction({
        topicId: TopicId.fromString(topicId),
        message: JSON.stringify(message)
      });

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return {
        messageId: `${receipt.topicSequenceNumber}`,
        transactionId: response.transactionId.toString(),
        consensusTimestamp: receipt.consensusTimestamp?.toString()
      };
    } catch (error) {
      console.error('Error submitting HCS message:', error);
      throw error;
    }
  }

  /**
   * Get topic messages (placeholder - would need mirror node integration)
   */
  async getTopicMessages(topicId, limit = 10) {
    // This would typically integrate with Hedera Mirror Node API
    console.warn('getTopicMessages not implemented - requires mirror node integration');
    return [];
  }
}

/**
 * HFS Service for file storage
 */
class HFSService {
  constructor(client) {
    this.client = client || createHederaClient();
  }

  /**
   * Create file on Hedera File Service
   */
  async createFile(contents, memo = '') {
    try {
      const transaction = new FileCreateTransaction()
        .setContents(contents)
        .setFileMemo(memo)
        .setMaxTransactionFee(new Hbar(2));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return {
        fileId: receipt.fileId.toString(),
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('Error creating HFS file:', error);
      throw error;
    }
  }

  /**
   * Append to existing file
   */
  async appendToFile(fileId, contents) {
    try {
      const transaction = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(contents)
        .setMaxTransactionFee(new Hbar(2));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return {
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('Error appending to HFS file:', error);
      throw error;
    }
  }
}

/**
 * HTS Service for token operations
 */
class HTSService {
  constructor(client) {
    this.client = client || createHederaClient();
  }

  /**
   * Create a new token
   */
  async createToken(tokenName, tokenSymbol, initialSupply = 0) {
    try {
      const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(this.client.operatorAccountId)
        .setAdminKey(this.client.operatorPublicKey)
        .setSupplyKey(this.client.operatorPublicKey)
        .setMaxTransactionFee(new Hbar(30));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return {
        tokenId: receipt.tokenId.toString(),
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  /**
   * Mint tokens (NFTs or fungible)
   */
  async mintToken(tokenId, amount = 1, metadata = []) {
    try {
      const transaction = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(tokenId))
        .setAmount(amount)
        .setMaxTransactionFee(new Hbar(20));

      if (metadata.length > 0) {
        transaction.setMetadata(metadata);
      }

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return {
        serials: receipt.serials,
        transactionId: response.transactionId.toString()
      };
    } catch (error) {
      console.error('Error minting token:', error);
      throw error;
    }
  }

  /**
   * Transfer tokens
   */
  async transferToken(tokenId, fromAccountId, toAccountId, amount) {
    try {
      const transaction = new TransferTransaction()
        .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccountId), -amount)
        .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccountId), amount)
        .setMaxTransactionFee(new Hbar(10));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return {
        transactionId: response.transactionId.toString(),
        status: receipt.status.toString()
      };
    } catch (error) {
      console.error('Error transferring token:', error);
      throw error;
    }
  }

  /**
   * Get account token balance
   */
  async getAccountBalance(accountId) {
    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
        .execute(this.client);
      
      return {
        hbars: balance.hbars.toString(),
        tokens: balance.tokens
      };
    } catch (error) {
      console.error('Error getting account balance:', error);
      throw error;
    }
  }
}

/**
 * Generate HashScan link for transaction
 */
function generateHashScanLink(transactionId, network = HEDERA_NET) {
  const baseUrl = network === 'mainnet' 
    ? 'https://hashscan.io/mainnet'
    : 'https://hashscan.io/testnet';
  
  return `${baseUrl}/transaction/${transactionId}`;
}

/**
 * Generate HashScan link for topic
 */
function generateTopicLink(topicId, network = HEDERA_NET) {
  const baseUrl = network === 'mainnet' 
    ? 'https://hashscan.io/mainnet'
    : 'https://hashscan.io/testnet';
  
  return `${baseUrl}/topic/${topicId}`;
}

/**
 * Generate HashScan link for account
 */
function generateAccountLink(accountId, network = HEDERA_NET) {
  const baseUrl = network === 'mainnet' 
    ? 'https://hashscan.io/mainnet'
    : 'https://hashscan.io/testnet';
  
  return `${baseUrl}/account/${accountId}`;
}

module.exports = {
  createHederaClient,
  HCSService,
  HFSService,
  HTSService,
  generateHashScanLink,
  generateTopicLink,
  generateAccountLink,
  HEDERA_NET
};