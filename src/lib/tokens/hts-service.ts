import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenAssociateTransaction,
  TokenDissociateTransaction,
  TransferTransaction,
  AccountBalanceQuery,
  TokenInfoQuery,
  TokenId,
  AccountId,
  PrivateKey,
  Hbar,
  Status
} from '@hashgraph/sdk';

export interface TokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  treasuryAccountId: string;
  adminKey?: string;
  supplyKey?: string;
  freezeKey?: string;
  wipeKey?: string;
  pauseKey?: string;
  kycKey?: string;
  tokenType: 'FUNGIBLE_COMMON' | 'NON_FUNGIBLE_UNIQUE';
  supplyType: 'INFINITE' | 'FINITE';
  maxSupply?: string;
  customFees?: any[];
  metadata?: string;
}

export interface TokenBalance {
  tokenId: string;
  balance: string;
  decimals: number;
}

export interface TokenTransfer {
  tokenId: string;
  from: string;
  to: string;
  amount: string;
  memo?: string;
}

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  treasuryAccountId: string;
  adminKey?: PrivateKey;
  supplyKey?: PrivateKey;
  freezeKey?: PrivateKey;
  wipeKey?: PrivateKey;
  pauseKey?: PrivateKey;
  kycKey?: PrivateKey;
  tokenType?: TokenType;
  supplyType?: TokenSupplyType;
  maxSupply?: number;
  memo?: string;
  metadata?: string;
}

class HTSService {
  private client: Client;
  private operatorAccountId: AccountId;
  private operatorPrivateKey: PrivateKey;

  constructor() {
    // Initialize Hedera client
    this.client = Client.forTestnet();
    
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    
    if (!accountId || !privateKey) {
      throw new Error('Hedera credentials not found in environment variables');
    }
    
    this.operatorAccountId = AccountId.fromString(accountId);
    this.operatorPrivateKey = PrivateKey.fromString(privateKey);
    
    this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);
  }

  /**
   * Create a new HTS token
   */
  async createToken(params: CreateTokenParams): Promise<TokenInfo> {
    try {
      const {
        name,
        symbol,
        decimals,
        initialSupply,
        treasuryAccountId,
        adminKey,
        supplyKey,
        freezeKey,
        wipeKey,
        pauseKey,
        kycKey,
        tokenType = TokenType.FungibleCommon,
        supplyType = TokenSupplyType.Infinite,
        maxSupply,
        memo,
        metadata
      } = params;

      const treasuryAccount = AccountId.fromString(treasuryAccountId);
      
      let transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(treasuryAccount)
        .setTokenType(tokenType)
        .setSupplyType(supplyType);

      // Set optional keys
      if (adminKey) transaction.setAdminKey(adminKey);
      if (supplyKey) transaction.setSupplyKey(supplyKey);
      if (freezeKey) transaction.setFreezeKey(freezeKey);
      if (wipeKey) transaction.setWipeKey(wipeKey);
      if (pauseKey) transaction.setPauseKey(pauseKey);
      if (kycKey) transaction.setKycKey(kycKey);
      
      if (supplyType === TokenSupplyType.Finite && maxSupply) {
        transaction.setMaxSupply(maxSupply);
      }
      
      if (memo) transaction.setTokenMemo(memo);
      if (metadata) transaction.setMetadata(Buffer.from(metadata));

      // Execute transaction
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`Token creation failed with status: ${receipt.status}`);
      }

      const tokenId = receipt.tokenId!;
      
      // Get token info
      const tokenInfo = await this.getTokenInfo(tokenId.toString());
      
      return tokenInfo;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenId: string): Promise<TokenInfo> {
    try {
      const query = new TokenInfoQuery().setTokenId(TokenId.fromString(tokenId));
      const tokenInfo = await query.execute(this.client);
      
      return {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.totalSupply.toString(),
        treasuryAccountId: tokenInfo.treasuryAccountId?.toString() || '',
        adminKey: tokenInfo.adminKey?.toString(),
        supplyKey: tokenInfo.supplyKey?.toString(),
        freezeKey: tokenInfo.freezeKey?.toString(),
        wipeKey: tokenInfo.wipeKey?.toString(),
        pauseKey: tokenInfo.pauseKey?.toString(),
        kycKey: tokenInfo.kycKey?.toString(),
        tokenType: tokenInfo.tokenType === TokenType.FungibleCommon ? 'FUNGIBLE_COMMON' : 'NON_FUNGIBLE_UNIQUE',
        supplyType: tokenInfo.supplyType === TokenSupplyType.Infinite ? 'INFINITE' : 'FINITE',
        maxSupply: tokenInfo.maxSupply?.toString(),
        customFees: tokenInfo.customFees,
        metadata: tokenInfo.metadata ? Buffer.from(tokenInfo.metadata).toString() : undefined
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  /**
   * Associate token with account
   */
  async associateToken(accountId: string, tokenId: string, accountPrivateKey?: PrivateKey): Promise<void> {
    try {
      const account = AccountId.fromString(accountId);
      const token = TokenId.fromString(tokenId);
      const privateKey = accountPrivateKey || this.operatorPrivateKey;
      
      const transaction = new TokenAssociateTransaction()
        .setAccountId(account)
        .setTokenIds([token])
        .freezeWith(this.client);
      
      const signedTx = await transaction.sign(privateKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`Token association failed with status: ${receipt.status}`);
      }
    } catch (error) {
      console.error('Error associating token:', error);
      throw error;
    }
  }

  /**
   * Transfer tokens between accounts
   */
  async transferToken(transfer: TokenTransfer): Promise<void> {
    try {
      const { tokenId, from, to, amount, memo } = transfer;
      
      const token = TokenId.fromString(tokenId);
      const fromAccount = AccountId.fromString(from);
      const toAccount = AccountId.fromString(to);
      
      let transaction = new TransferTransaction()
        .addTokenTransfer(token, fromAccount, -parseInt(amount))
        .addTokenTransfer(token, toAccount, parseInt(amount));
      
      if (memo) {
        transaction.setTransactionMemo(memo);
      }
      
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`Token transfer failed with status: ${receipt.status}`);
      }
    } catch (error) {
      console.error('Error transferring token:', error);
      throw error;
    }
  }

  /**
   * Mint additional tokens (requires supply key)
   */
  async mintToken(tokenId: string, amount: number, supplyKey: PrivateKey): Promise<void> {
    try {
      const token = TokenId.fromString(tokenId);
      
      const transaction = new TokenMintTransaction()
        .setTokenId(token)
        .setAmount(amount)
        .freezeWith(this.client);
      
      const signedTx = await transaction.sign(supplyKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`Token minting failed with status: ${receipt.status}`);
      }
    } catch (error) {
      console.error('Error minting token:', error);
      throw error;
    }
  }

  /**
   * Burn tokens (requires supply key)
   */
  async burnToken(tokenId: string, amount: number, supplyKey: PrivateKey): Promise<void> {
    try {
      const token = TokenId.fromString(tokenId);
      
      const transaction = new TokenBurnTransaction()
        .setTokenId(token)
        .setAmount(amount)
        .freezeWith(this.client);
      
      const signedTx = await transaction.sign(supplyKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      if (receipt.status !== Status.Success) {
        throw new Error(`Token burning failed with status: ${receipt.status}`);
      }
    } catch (error) {
      console.error('Error burning token:', error);
      throw error;
    }
  }

  /**
   * Get account token balances
   */
  async getAccountTokenBalances(accountId: string): Promise<TokenBalance[]> {
    try {
      const account = AccountId.fromString(accountId);
      const query = new AccountBalanceQuery().setAccountId(account);
      const balance = await query.execute(this.client);
      
      const tokenBalances: TokenBalance[] = [];
      
      if (balance.tokens) {
        // Access underlying Map to avoid iterator downlevel issues
        const internal = balance.tokens as unknown as { _map?: Map<string, any> };
        const pairs: Array<[string, any]> = [];
        internal._map?.forEach((val: any, key: string) => pairs.push([key, val]));
        for (const [tokenKey, tokenBalance] of pairs) {
          try {
            const tokenInfo = await this.getTokenInfo(tokenKey);
            tokenBalances.push({
              tokenId: tokenKey,
              balance: tokenBalance.toString(),
              decimals: tokenInfo.decimals
            });
          } catch (error) {
            console.warn(`Could not get info for token ${tokenKey}:`, error);
          }
        }
      }
      
      return tokenBalances;
    } catch (error) {
      console.error('Error getting account token balances:', error);
      throw error;
    }
  }

  /**
   * Create WATER payment token
   */
  async createWaterToken(): Promise<TokenInfo> {
    const supplyKey = PrivateKey.generateED25519();
    
    return this.createToken({
      name: 'Waternity Token',
      symbol: 'WATER',
      decimals: 8,
      initialSupply: 1000000 * Math.pow(10, 8), // 1M tokens
      treasuryAccountId: this.operatorAccountId.toString(),
      adminKey: this.operatorPrivateKey,
      supplyKey: supplyKey,
      supplyType: TokenSupplyType.Finite,
      maxSupply: 10000000 * Math.pow(10, 8), // 10M max supply
      memo: 'Waternity ecosystem payment token',
      metadata: JSON.stringify({
        description: 'Payment token for Waternity water management platform',
        website: 'https://waternity.com',
        logo: 'https://waternity.com/logo.png'
      })
    });
  }

  /**
   * Create REWARD conservation token
   */
  async createRewardToken(): Promise<TokenInfo> {
    const supplyKey = PrivateKey.generateED25519();
    
    return this.createToken({
      name: 'Waternity Rewards',
      symbol: 'REWARD',
      decimals: 8,
      initialSupply: 500000 * Math.pow(10, 8), // 500K tokens
      treasuryAccountId: this.operatorAccountId.toString(),
      adminKey: this.operatorPrivateKey,
      supplyKey: supplyKey,
      supplyType: TokenSupplyType.Infinite,
      memo: 'Waternity conservation rewards token',
      metadata: JSON.stringify({
        description: 'Reward token for water conservation achievements',
        website: 'https://waternity.com',
        logo: 'https://waternity.com/reward-logo.png'
      })
    });
  }

  /**
   * Distribute conservation rewards
   */
  async distributeRewards(
    rewardTokenId: string,
    recipients: Array<{ accountId: string; amount: number; reason: string }>
  ): Promise<void> {
    try {
      for (const recipient of recipients) {
        await this.transferToken({
          tokenId: rewardTokenId,
          from: this.operatorAccountId.toString(),
          to: recipient.accountId,
          amount: recipient.amount.toString(),
          memo: `Conservation reward: ${recipient.reason}`
        });
      }
    } catch (error) {
      console.error('Error distributing rewards:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const htsService = new HTSService();
export default HTSService;