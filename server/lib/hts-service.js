const { HTSService, generateHashScanLink, HEDERA_NET } = require('./hedera-client');
const { v4: uuidv4 } = require('uuid');

/**
 * Waternity HTS Service
 * Manages tokenization for wells and revenue distribution
 */
class WaternityHTSService {
  constructor(client) {
    this.htsService = new HTSService(client);
    this.wellTokens = new Map(); // wellId -> tokenId mapping
    this.revenueTokens = new Map(); // wellId -> revenue token mapping
    this.nftTokens = new Map(); // wellId -> NFT token mapping
  }

  /**
   * Create Well NFT Token (represents ownership of physical well)
   * @param {object} wellData - Well information
   * @returns {Promise<object>} Token creation result
   */
  async createWellNFT(wellData) {
    try {
      const { wellId, name, location, operatorId } = wellData;
      
      // Demo mode - skip actual Hedera token creation
      if (process.env.SKIP_HEDERA_INIT === 'true') {
        const demoTokenId = `0.0.${Math.floor(Math.random() * 1000000)}`;
        const demoResult = {
          tokenId: demoTokenId,
          txId: `demo-tx-${Date.now()}`,
          success: true,
          demoMode: true
        };
        
        // Store mapping
        this.nftTokens.set(wellId, {
          tokenId: demoResult.tokenId,
          wellId,
          name,
          location,
          operatorId,
          createdAt: new Date().toISOString(),
          txId: demoResult.txId,
          demoMode: true
        });

        return {
          ...demoResult,
          wellId,
          hashScanLink: `https://hashscan.io/testnet/token/${demoResult.tokenId}`,
          type: 'WELL_NFT'
        };
      }
      
      const nftConfig = {
        name: `Waternity Well: ${name}`,
        symbol: `WELL${wellId.slice(-4).toUpperCase()}`,
        memo: `RWA NFT for Well ${wellId} at ${location?.address || 'Unknown Location'}`
      };

      const result = await this.htsService.createNFTToken(nftConfig);
      
      // Store mapping
      this.nftTokens.set(wellId, {
        tokenId: result.tokenId,
        wellId,
        name,
        location,
        operatorId,
        createdAt: new Date().toISOString(),
        txId: result.txId
      });

      return {
        ...result,
        wellId,
        hashScanLink: generateHashScanLink(HEDERA_NET, 'token', result.tokenId),
        type: 'WELL_NFT'
      };
    } catch (error) {
      throw new Error(`Failed to create Well NFT: ${error.message}`);
    }
  }

  /**
   * Mint Well NFT with metadata
   * @param {string} wellId - Well ID
   * @param {object} metadata - NFT metadata
   * @returns {Promise<object>} Mint result
   */
  async mintWellNFT(wellId, metadata) {
    try {
      const wellToken = this.nftTokens.get(wellId);
      if (!wellToken) {
        throw new Error(`No NFT token found for well ${wellId}`);
      }

      // Create metadata JSON
      const nftMetadata = {
        name: wellToken.name,
        description: `Physical water well asset tokenized on Hedera`,
        image: metadata.image || 'https://waternity.io/assets/well-default.jpg',
        attributes: [
          { trait_type: 'Well ID', value: wellId },
          { trait_type: 'Location', value: wellToken.location?.address || 'Unknown' },
          { trait_type: 'Operator', value: wellToken.operatorId },
          { trait_type: 'Depth', value: metadata.depth || 'Unknown' },
          { trait_type: 'Capacity', value: metadata.capacity || 'Unknown' },
          { trait_type: 'Installation Date', value: metadata.installationDate || 'Unknown' },
          { trait_type: 'Water Quality', value: metadata.waterQuality || 'Unknown' }
        ],
        properties: {
          wellId,
          coordinates: wellToken.location?.coordinates,
          operatorId: wellToken.operatorId,
          tokenStandard: 'HTS-NFT',
          network: HEDERA_NET
        }
      };

      // For demo, we'll use a data URI or IPFS hash
      const metadataURI = metadata.metadataURI || `data:application/json,${encodeURIComponent(JSON.stringify(nftMetadata))}`;
      
      // Demo mode - skip actual Hedera minting
      if (process.env.SKIP_HEDERA_INIT === 'true' || wellToken.demoMode) {
        const demoResult = {
          success: true,
          serials: [1],
          txId: `demo-mint-tx-${Date.now()}`,
          demoMode: true
        };
        
        // Update mapping with serial number
        this.nftTokens.set(wellId, {
          ...wellToken,
          serials: demoResult.serials,
          metadataURI,
          mintedAt: new Date().toISOString(),
          mintTxId: demoResult.txId,
          demoMode: true
        });

        return {
          ...demoResult,
          wellId,
          tokenId: wellToken.tokenId,
          metadataURI,
          hashScanLink: `https://hashscan.io/testnet/transaction/${demoResult.txId}`,
          type: 'WELL_NFT_MINT'
        };
      }
      
      const result = await this.htsService.mintNFT(wellToken.tokenId, metadataURI);
      
      // Update mapping with serial number
      this.nftTokens.set(wellId, {
        ...wellToken,
        serials: result.serials,
        metadataURI,
        mintedAt: new Date().toISOString(),
        mintTxId: result.txId
      });

      return {
        ...result,
        wellId,
        tokenId: wellToken.tokenId,
        metadataURI,
        hashScanLink: generateHashScanLink(HEDERA_NET, 'transaction', result.txId),
        type: 'WELL_NFT_MINT'
      };
    } catch (error) {
      throw new Error(`Failed to mint Well NFT: ${error.message}`);
    }
  }

  /**
   * Create Revenue Token for a well (fungible token for revenue distribution)
   * @param {object} wellData - Well information
   * @returns {Promise<object>} Token creation result
   */
  async createRevenueToken(wellData) {
    try {
      const { wellId, name, targetRevenue } = wellData;
      
      const tokenConfig = {
        name: `${name} Revenue Token`,
        symbol: `WCR${wellId.slice(-4).toUpperCase()}`,
        decimals: 6,
        initialSupply: 0, // Will mint based on investments
        memo: `Revenue distribution token for Well ${wellId}`
      };

      // Demo mode - skip actual Hedera token creation
      if (process.env.SKIP_HEDERA_INIT === 'true') {
        const demoTokenId = `0.0.${Math.floor(Math.random() * 1000000)}`;
        const demoResult = {
          tokenId: demoTokenId,
          txId: `demo-tx-${Date.now()}`,
          success: true,
          demoMode: true
        };
        
        // Store mapping
        this.revenueTokens.set(wellId, {
          tokenId: demoResult.tokenId,
          wellId,
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          targetRevenue,
          totalSupply: 0,
          createdAt: new Date().toISOString(),
          txId: demoResult.txId,
          demoMode: true
        });

        return {
          ...demoResult,
          wellId,
          symbol: tokenConfig.symbol,
          hashScanLink: `https://hashscan.io/testnet/token/${demoResult.tokenId}`,
          type: 'REVENUE_TOKEN'
        };
      }

      const result = await this.htsService.createFungibleToken(tokenConfig);
      
      // Store mapping
      this.revenueTokens.set(wellId, {
        tokenId: result.tokenId,
        wellId,
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        targetRevenue,
        totalSupply: 0,
        createdAt: new Date().toISOString(),
        txId: result.txId
      });

      return {
        ...result,
        wellId,
        symbol: tokenConfig.symbol,
        hashScanLink: generateHashScanLink(HEDERA_NET, 'token', result.tokenId),
        type: 'REVENUE_TOKEN'
      };
    } catch (error) {
      throw new Error(`Failed to create Revenue Token: ${error.message}`);
    }
  }

  /**
   * Mint revenue tokens for investors
   * @param {string} wellId - Well ID
   * @param {number} amount - Amount to mint (based on investment)
   * @param {string} investmentId - Investment reference
   * @returns {Promise<object>} Mint result
   */
  async mintRevenueTokens(wellId, amount, investmentId) {
    try {
      const revenueToken = this.revenueTokens.get(wellId);
      if (!revenueToken) {
        throw new Error(`No revenue token found for well ${wellId}`);
      }

      const result = await this.htsService.mintFungibleToken(revenueToken.tokenId, amount);
      
      // Update total supply
      revenueToken.totalSupply += amount;
      revenueToken.lastMint = {
        amount,
        investmentId,
        mintedAt: new Date().toISOString(),
        txId: result.txId
      };
      
      this.revenueTokens.set(wellId, revenueToken);

      return {
        ...result,
        wellId,
        tokenId: revenueToken.tokenId,
        amount,
        investmentId,
        totalSupply: revenueToken.totalSupply,
        hashScanLink: generateHashScanLink(HEDERA_NET, 'transaction', result.txId),
        type: 'REVENUE_TOKEN_MINT'
      };
    } catch (error) {
      throw new Error(`Failed to mint revenue tokens: ${error.message}`);
    }
  }

  /**
   * Distribute revenue to token holders
   * @param {string} wellId - Well ID
   * @param {object} distributionData - Distribution details
   * @returns {Promise<object>} Distribution result
   */
  async distributeRevenue(wellId, distributionData) {
    try {
      const { totalRevenue, distributions, settlementId } = distributionData;
      const revenueToken = this.revenueTokens.get(wellId);
      
      if (!revenueToken) {
        throw new Error(`No revenue token found for well ${wellId}`);
      }

      const results = [];
      
      // Process each distribution
      for (const dist of distributions) {
        const { accountId, amount, percentage, tokenAmount } = dist;
        
        try {
          // Transfer revenue tokens (representing revenue share)
          const transferResult = await this.htsService.transferToken(
            revenueToken.tokenId,
            this.htsService.operatorId.toString(), // From treasury
            accountId, // To investor/operator
            tokenAmount
          );
          
          results.push({
            accountId,
            amount,
            percentage,
            tokenAmount,
            txId: transferResult.txId,
            status: transferResult.status,
            hashScanLink: generateHashScanLink(HEDERA_NET, 'transaction', transferResult.txId)
          });
        } catch (error) {
          results.push({
            accountId,
            amount,
            percentage,
            tokenAmount,
            error: error.message,
            status: 'FAILED'
          });
        }
      }

      const successCount = results.filter(r => r.status && r.status !== 'FAILED').length;
      const failureCount = results.length - successCount;

      return {
        wellId,
        settlementId,
        tokenId: revenueToken.tokenId,
        totalRevenue,
        distributionCount: results.length,
        successCount,
        failureCount,
        distributions: results,
        processedAt: new Date().toISOString(),
        type: 'REVENUE_DISTRIBUTION'
      };
    } catch (error) {
      throw new Error(`Failed to distribute revenue: ${error.message}`);
    }
  }

  /**
   * Get well token information
   * @param {string} wellId - Well ID
   * @returns {object} Token information
   */
  getWellTokens(wellId) {
    return {
      nft: this.nftTokens.get(wellId) || null,
      revenue: this.revenueTokens.get(wellId) || null
    };
  }

  /**
   * Get all well tokens
   * @returns {object} All token mappings
   */
  getAllTokens() {
    return {
      nftTokens: Object.fromEntries(this.nftTokens),
      revenueTokens: Object.fromEntries(this.revenueTokens)
    };
  }

  /**
   * Calculate token allocation for investment
   * @param {number} investmentAmount - Investment amount in HBAR
   * @param {number} totalProjectValue - Total project value
   * @param {number} tokenSupplyCap - Maximum token supply
   * @returns {number} Token allocation
   */
  calculateTokenAllocation(investmentAmount, totalProjectValue, tokenSupplyCap = 1000000) {
    const percentage = investmentAmount / totalProjectValue;
    return Math.floor(percentage * tokenSupplyCap);
  }

  /**
   * Calculate revenue distribution based on token holdings
   * @param {string} wellId - Well ID
   * @param {number} totalRevenue - Total revenue to distribute
   * @param {Array} tokenHolders - Token holders with balances
   * @returns {Array} Distribution calculations
   */
  calculateRevenueDistribution(wellId, totalRevenue, tokenHolders) {
    const revenueToken = this.revenueTokens.get(wellId);
    if (!revenueToken || revenueToken.totalSupply === 0) {
      throw new Error(`No revenue token or zero supply for well ${wellId}`);
    }

    return tokenHolders.map(holder => {
      const percentage = holder.balance / revenueToken.totalSupply;
      const amount = totalRevenue * percentage;
      
      return {
        accountId: holder.accountId,
        balance: holder.balance,
        percentage: Number((percentage * 100).toFixed(4)),
        amount: Number(amount.toFixed(6)),
        tokenAmount: holder.balance // Tokens to transfer as proof of revenue share
      };
    });
  }

  /**
   * Get token statistics
   * @returns {object} Token statistics
   */
  getTokenStatistics() {
    const nftCount = this.nftTokens.size;
    const revenueTokenCount = this.revenueTokens.size;
    const totalSupply = Array.from(this.revenueTokens.values())
      .reduce((sum, token) => sum + token.totalSupply, 0);

    return {
      wellNFTs: nftCount,
      revenueTokens: revenueTokenCount,
      totalRevenueTokenSupply: totalSupply,
      network: HEDERA_NET
    };
  }

  /**
   * Get all revenue tokens
   * @returns {Array} All revenue tokens
   */
  getAllRevenueTokens() {
    return Array.from(this.revenueTokens.values());
  }

  /**
   * Get revenue token by project
   * @param {string} projectId - Project ID
   * @returns {object|null} Revenue token
   */
  getRevenueTokenByProject(projectId) {
    return this.revenueTokens.get(projectId) || null;
  }

  /**
   * Get storage statistics
   * @returns {object} Storage statistics
   */
  getStorageStatistics() {
    return {
      nftTokensStored: this.nftTokens.size,
      revenueTokensStored: this.revenueTokens.size,
      wellTokensStored: this.wellTokens.size,
      totalTokensManaged: this.nftTokens.size + this.revenueTokens.size + this.wellTokens.size
    };
  }
}

module.exports = { WaternityHTSService };