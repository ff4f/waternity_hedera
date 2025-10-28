import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  TokenId,
  Hbar,
  TokenFreezeTransaction,
  TokenUnfreezeTransaction
} from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { HederaCoreService } from '@/lib/hedera/hedera-core';

export enum AssetType {
  WATER_WELL = 'WATER_WELL',
  WATER_RIGHTS = 'WATER_RIGHTS',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  CONSERVATION_CREDIT = 'CONSERVATION_CREDIT',
  CARBON_CREDIT = 'CARBON_CREDIT'
}

export interface AssetMetadata {
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  specifications: Record<string, unknown>;
  valuation: {
    currency: string;
    amount: number;
    assessmentDate: string;
    assessor: string;
  };
  legalDocuments: {
    title: string;
    hash: string;
    ipfsHash?: string;
  }[];
  images: string[];
  certificates: string[];
}

export interface TokenizedAsset {
  id: string;
  tokenId: string;
  assetType: AssetType;
  metadata: AssetMetadata;
  totalSupply: number;
  circulatingSupply: number;
  owner: string;
  fractional: boolean;
  tradeable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FractionalOwnership {
  assetId: string;
  tokenId: string;
  owner: string;
  shares: number;
  percentage: number;
  purchasePrice: number;
  purchaseDate: Date;
  dividendsEarned: number;
}

export interface AssetPerformance {
  assetId: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  roi: number;
  period: string;
  waterProduced?: number;
  waterSold?: number;
  conservationImpact?: number;
}

export class RWATokenizationService {
  private client: Client;
  private operatorKey: PrivateKey;
  private operatorId: AccountId;
  private hederaCore: HederaCoreService;

  constructor() {
    this.client = Client.forTestnet();
    this.operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY || '');
    this.operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID || '');
    this.client.setOperator(this.operatorId, this.operatorKey);
    this.hederaCore = new HederaCoreService({
      operatorId: process.env.HEDERA_OPERATOR_ID || '',
      operatorKey: process.env.HEDERA_OPERATOR_KEY || '',
      network: 'testnet'
    });
  }

  /**
   * Tokenize a real-world water asset
   */
  async tokenizeAsset(
    assetType: AssetType,
    metadata: AssetMetadata,
    totalSupply: number,
    fractional: boolean = true,
    tradeable: boolean = true
  ): Promise<TokenizedAsset> {
    try {
      // Store metadata on IPFS/HFS
      const metadataHash = await this.storeMetadata(metadata);
      
      // Create token on Hedera
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(`${metadata.name} Token`)
        .setTokenSymbol(this.generateTokenSymbol(assetType, metadata.name))
        .setTokenType(fractional ? TokenType.FungibleCommon : TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setInitialSupply(fractional ? totalSupply : 0)
        .setMaxSupply(totalSupply)
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(this.operatorKey)
        .setSupplyKey(this.operatorKey)
        .setFreezeKey(this.operatorKey)
        .setWipeKey(this.operatorKey)
        .setTokenMemo(`RWA:${assetType}:${metadataHash}`)
        .setMaxTransactionFee(new Hbar(30));

      if (!fractional) {
        tokenCreateTx.setSupplyKey(this.operatorKey);
      }

      const tokenCreateResponse = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;

      if (!tokenId) {
        throw new Error('Failed to create token');
      }

      // Store in database
      const tokenizedAsset = await prisma.tokenizedAsset.create({
        data: {
          tokenId: tokenId.toString(),
          assetType,
          metadata: JSON.stringify(metadata),
          totalSupply,
          circulatingSupply: fractional ? totalSupply : 0,
          owner: this.operatorId.toString(),
          fractional,
          tradeable,
          metadataHash
        }
      });

      // If NFT, mint the unique token
      if (!fractional) {
        await this.mintNFT(tokenId, metadataHash);
      }

      // Submit to HCS for transparency
      await this.hederaCore.submitMessage(
        'asset_tokenization',
        JSON.stringify({
          action: 'tokenize_asset',
          tokenId: tokenId.toString(),
          assetType,
          metadata: metadata.name,
          totalSupply,
          fractional,
          timestamp: new Date().toISOString()
        })
      );

      return {
        id: tokenizedAsset.id,
        tokenId: tokenId.toString(),
        assetType,
        metadata,
        totalSupply,
        circulatingSupply: fractional ? totalSupply : 0,
        owner: this.operatorId.toString(),
        fractional,
        tradeable,
        createdAt: tokenizedAsset.createdAt,
        updatedAt: tokenizedAsset.updatedAt
      };
    } catch (error) {
      console.error('Error tokenizing asset:', error);
      throw new Error('Failed to tokenize asset');
    }
  }

  /**
   * Mint NFT for non-fractional assets
   */
  private async mintNFT(tokenId: TokenId, metadataHash: string): Promise<void> {
    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(metadataHash)])
      .setMaxTransactionFee(new Hbar(10));

    await mintTx.execute(this.client);
  }

  /**
   * Transfer fractional ownership
   */
  async transferFractionalOwnership(
    tokenId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): Promise<string> {
    try {
      const transferTx = new TransferTransaction()
        .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccountId), -amount)
        .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccountId), amount)
        .setMaxTransactionFee(new Hbar(2));

      const response = await transferTx.execute(this.client);
      await response.getReceipt(this.client);

      // Update database
      await this.updateOwnershipRecords(tokenId, fromAccountId, toAccountId, amount);

      // Submit to HCS
      await this.hederaCore.submitMessage(
        'ownership_transfer',
        JSON.stringify({
          action: 'transfer_ownership',
          tokenId,
          from: fromAccountId,
          to: toAccountId,
          amount,
          transactionId: response.transactionId.toString(),
          timestamp: new Date().toISOString()
        })
      );

      return response.transactionId.toString();
    } catch (error) {
      console.error('Error transferring ownership:', error);
      throw new Error('Failed to transfer fractional ownership');
    }
  }

  /**
   * Update ownership records in database
   */
  private async updateOwnershipRecords(
    tokenId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): Promise<void> {
    const asset = await prisma.tokenizedAsset.findFirst({
      where: { tokenId }
    });

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Update or create ownership records
    await prisma.fractionalOwnership.upsert({
      where: {
        assetId_owner: {
          assetId: asset.id,
          owner: toAccountId
        }
      },
      update: {
        shares: {
          increment: amount
        },
        percentage: {
          increment: (amount / asset.totalSupply) * 100
        }
      },
      create: {
        assetId: asset.id,
        tokenId,
        owner: toAccountId,
        shares: amount,
        percentage: (amount / asset.totalSupply) * 100,
        purchasePrice: 0, // This would be calculated based on market price
        purchaseDate: new Date(),
        dividendsEarned: 0
      }
    });

    // Decrease from sender if not initial distribution
    if (fromAccountId !== asset.owner) {
      await prisma.fractionalOwnership.updateMany({
        where: {
          assetId: asset.id,
          owner: fromAccountId
        },
        data: {
          shares: {
            decrement: amount
          },
          percentage: {
            decrement: (amount / asset.totalSupply) * 100
          }
        }
      });
    }
  }

  /**
   * Distribute dividends to token holders
   */
  async distributeDividends(
    assetId: string,
    totalDividend: number,
    currency: string = 'HBAR'
  ): Promise<string[]> {
    try {
      const asset = await prisma.tokenizedAsset.findUnique({
        where: { id: assetId },
        include: {
          ownerships: true
        }
      });

      if (!asset) {
        throw new Error('Asset not found');
      }

      const transactionIds: string[] = [];

      // Calculate and distribute dividends
      for (const ownership of asset.ownerships) {
        const dividendAmount = (ownership.shares / asset.totalSupply) * totalDividend;
        
        if (dividendAmount > 0) {
          // Transfer dividend (simplified - would need proper token handling)
          const transferTx = new TransferTransaction()
            .addHbarTransfer(this.operatorId, new Hbar(-dividendAmount))
            .addHbarTransfer(AccountId.fromString(ownership.owner), new Hbar(dividendAmount))
            .setTransactionMemo(`Dividend payment for ${asset.tokenId}`)
            .setMaxTransactionFee(new Hbar(1));

          const response = await transferTx.execute(this.client);
          transactionIds.push(response.transactionId.toString());

          // Update ownership record
          await prisma.fractionalOwnership.update({
            where: {
              id: ownership.id
            },
            data: {
              dividendsEarned: {
                increment: dividendAmount
              }
            }
          });
        }
      }

      // Record dividend distribution
      await this.hederaCore.submitMessage(
        'dividend_distribution',
        JSON.stringify({
          action: 'distribute_dividends',
          assetId,
          tokenId: asset.tokenId,
          totalDividend,
          currency,
          recipients: asset.ownerships.length,
          transactionIds,
          timestamp: new Date().toISOString()
        })
      );

      return transactionIds;
    } catch (error) {
      console.error('Error distributing dividends:', error);
      throw new Error('Failed to distribute dividends');
    }
  }

  /**
   * Record asset performance metrics
   */
  async recordAssetPerformance(
    assetId: string,
    performance: Omit<AssetPerformance, 'assetId'>
  ): Promise<void> {
    try {
      await prisma.assetPerformance.create({
        data: {
          assetId,
          ...performance
        }
      });

      // Submit to HCS for transparency
      await this.hederaCore.submitMessage(
        'asset_performance',
        JSON.stringify({
          action: 'record_performance',
          assetId,
          performance,
          timestamp: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('Error recording asset performance:', error);
      throw new Error('Failed to record asset performance');
    }
  }

  /**
   * Get asset information
   */
  async getAssetInfo(assetId: string): Promise<TokenizedAsset | null> {
    try {
      const asset = await prisma.tokenizedAsset.findUnique({
        where: { id: assetId },
        include: {
          ownerships: true,
          performance: {
            orderBy: { createdAt: 'desc' },
            take: 12 // Last 12 periods
          }
        }
      });

      if (!asset) {
        return null;
      }

      return {
        id: asset.id,
        tokenId: asset.tokenId,
        assetType: asset.assetType as AssetType,
        metadata: JSON.parse(asset.metadata),
        totalSupply: asset.totalSupply,
        circulatingSupply: asset.circulatingSupply,
        owner: asset.owner,
        fractional: asset.fractional,
        tradeable: asset.tradeable,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      };
    } catch (error) {
      console.error('Error getting asset info:', error);
      throw new Error('Failed to get asset information');
    }
  }

  /**
   * Get user's portfolio
   */
  async getUserPortfolio(userAccountId: string): Promise<FractionalOwnership[]> {
    try {
      const ownerships = await prisma.fractionalOwnership.findMany({
        where: { owner: userAccountId },
        include: {
          asset: true
        }
      });

      return ownerships.map((ownership) => ({
        assetId: ownership.assetId,
        tokenId: ownership.tokenId,
        owner: ownership.owner,
        shares: ownership.shares,
        percentage: ownership.percentage,
        purchasePrice: ownership.purchasePrice,
        purchaseDate: ownership.purchaseDate,
        dividendsEarned: ownership.dividendsEarned
      }));
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      throw new Error('Failed to get user portfolio');
    }
  }

  /**
   * Store metadata on HFS
   */
  private async storeMetadata(metadata: AssetMetadata): Promise<string> {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      const fileId = await this.hederaCore.createFile(
        metadataJson,
        [this.operatorKey],
        'Asset Metadata'
      );
      return fileId.toString();
    } catch (error) {
      console.error('Error storing metadata:', error);
      throw new Error('Failed to store metadata');
    }
  }

  /**
   * Generate token symbol
   */
  private generateTokenSymbol(assetType: AssetType, name: string): string {
    const typePrefix = {
      [AssetType.WATER_WELL]: 'WW',
      [AssetType.WATER_RIGHTS]: 'WR',
      [AssetType.INFRASTRUCTURE]: 'INF',
      [AssetType.CONSERVATION_CREDIT]: 'CC',
      [AssetType.CARBON_CREDIT]: 'CAR'
    };

    const namePrefix = name.substring(0, 3).toUpperCase();
    return `${typePrefix[assetType]}${namePrefix}`;
  }

  /**
   * Freeze/Unfreeze token for compliance
   */
  async freezeToken(tokenId: string, accountId: string, freeze: boolean): Promise<string> {
    try {
      const transaction = freeze
        ? new TokenFreezeTransaction()
            .setTokenId(TokenId.fromString(tokenId))
            .setAccountId(AccountId.fromString(accountId))
        : new TokenUnfreezeTransaction()
            .setTokenId(TokenId.fromString(tokenId))
            .setAccountId(AccountId.fromString(accountId));

      const response = await transaction.execute(this.client);
      await response.getReceipt(this.client);

      return response.transactionId.toString();
    } catch (error) {
      console.error('Error freezing/unfreezing token:', error);
      throw new Error('Failed to freeze/unfreeze token');
    }
  }

  /**
   * Close client connection
   */
  close(): void {
    this.client.close();
  }
}

// Create singleton instance
export const rwaTokenization = new RWATokenizationService();