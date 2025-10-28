import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  Client,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  TokenInfoQuery,
  PrivateKey,
  AccountId,
  TokenId,
  TokenType,
  TokenSupplyType
} from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { getHederaNetworkEndpoints } from '@/lib/env';
import { v4 as uuidv4 } from 'uuid';

/**
 * HTS Integration Tests
 * Tests actual Hedera Token Service integration with testnet
 * 
 * Prerequisites:
 * - Valid Hedera testnet account with HBAR balance
 * - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables
 * - Network connectivity to Hedera testnet
 */
describe('HTS Integration Tests', () => {
  let client: Client;
  let operatorAccountId: AccountId;
  let operatorPrivateKey: PrivateKey;
  let testTokenId: TokenId;
  let nftTokenId: TokenId;
  const testResults: Array<{
    testName: string;
    transactionId?: string;
    tokenId?: string;
    status: 'PASS' | 'FAIL';
    error?: string;
    duration: number;
    metrics?: Record<string, Record<string, unknown>>;
  }> = [];

  beforeAll(async () => {
    // Verify environment variables
    const operatorAccountIdString = process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKeyString = process.env.HEDERA_PRIVATE_KEY!;
    
    if (!operatorAccountIdString || !operatorPrivateKeyString) {
      throw new Error('Missing required Hedera environment variables');
    }

    operatorAccountId = AccountId.fromString(operatorAccountIdString);
    operatorPrivateKey = PrivateKey.fromStringED25519(operatorPrivateKeyString);
    
    // Create Hedera client for testnet
    client = Client.forTestnet();
    client.setOperator(operatorAccountId, operatorPrivateKey);

    console.log(`Testing HTS against Hedera ${process.env.HEDERA_NETWORK || 'testnet'}`);
    console.log(`Operator Account: ${operatorAccountId.toString()}`);

    // Create test fungible token for revenue distribution
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName('Waternity Test Token')
      .setTokenSymbol('WTT')
      .setDecimals(2)
      .setInitialSupply(1000000) // 10,000.00 tokens
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(operatorAccountId)
      .setAdminKey(operatorPrivateKey)
      .setSupplyKey(operatorPrivateKey)
      .setFreezeKey(operatorPrivateKey)
      .setWipeKey(operatorPrivateKey)
      .setTokenMemo('Waternity Test Token for Integration Testing');

    const tokenCreateResponse = await tokenCreateTx.execute(client);
    const tokenCreateReceipt = await tokenCreateResponse.getReceipt(client);
    testTokenId = tokenCreateReceipt.tokenId!;

    console.log(`Created test token: ${testTokenId.toString()}`);
    console.log(`Token creation transaction: ${tokenCreateResponse.transactionId.toString()}`);

    // Create test NFT token for well ownership
    const nftCreateTx = new TokenCreateTransaction()
      .setTokenName('Waternity Well NFT')
      .setTokenSymbol('WWN')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1000)
      .setTreasuryAccountId(operatorAccountId)
      .setAdminKey(operatorPrivateKey)
      .setSupplyKey(operatorPrivateKey)
      .setTokenMemo('Waternity Well NFT for Integration Testing');

    const nftCreateResponse = await nftCreateTx.execute(client);
    const nftCreateReceipt = await nftCreateResponse.getReceipt(client);
    nftTokenId = nftCreateReceipt.tokenId!;

    console.log(`Created test NFT: ${nftTokenId.toString()}`);
    console.log(`NFT creation transaction: ${nftCreateResponse.transactionId.toString()}`);
  }, 60000);

  afterAll(async () => {
    if (client) {
      client.close();
    }

    // Generate test results summary
    console.log('\n=== HTS Integration Test Results ===');
    testResults.forEach(result => {
      console.log(`${result.status}: ${result.testName} (${result.duration}ms)`);
      if (result.transactionId) {
        console.log(`  Transaction ID: ${result.transactionId}`);
      }
      if (result.tokenId) {
        console.log(`  Token ID: ${result.tokenId}`);
      }
      if (result.metrics) {
        console.log(`  Metrics: ${JSON.stringify(result.metrics)}`);
      }
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.token.deleteMany({
      where: {
        symbol: {
          startsWith: 'TEST'
        }
      }
    });
  });

  it('should create fungible token successfully', async () => {
    const startTime = Date.now();
    const testName = 'Fungible Token Creation';
    
    try {
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName('Test Revenue Token')
        .setTokenSymbol('TRT')
        .setDecimals(2)
        .setInitialSupply(500000) // 5,000.00 tokens
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(operatorAccountId)
        .setAdminKey(operatorPrivateKey)
        .setSupplyKey(operatorPrivateKey)
        .setTokenMemo('Test Revenue Token for Well Revenue Distribution');

      const response = await tokenCreateTx.execute(client);
      const receipt = await response.getReceipt(client);
      const newTokenId = receipt.tokenId!;

      expect(newTokenId).toBeDefined();
      expect(newTokenId.toString()).toMatch(/^0\.0\.[0-9]+$/);

      // Verify token info
      const tokenInfo = await new TokenInfoQuery()
        .setTokenId(newTokenId)
        .execute(client);

      expect(tokenInfo.name).toBe('Test Revenue Token');
      expect(tokenInfo.symbol).toBe('TRT');
      expect(tokenInfo.decimals).toBe(2);
      expect(tokenInfo.totalSupply.toString()).toBe('500000');

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        tokenId: newTokenId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          tokenName: tokenInfo.name,
          symbol: tokenInfo.symbol,
          totalSupply: tokenInfo.totalSupply.toString(),
          decimals: tokenInfo.decimals
        }
      });

      console.log(`✅ Created fungible token: ${newTokenId.toString()}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Supply: ${tokenInfo.totalSupply.toString()} ${tokenInfo.symbol}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should create NFT token successfully', async () => {
    const startTime = Date.now();
    const testName = 'NFT Token Creation';
    
    try {
      const nftCreateTx = new TokenCreateTransaction()
        .setTokenName('Test Well Ownership NFT')
        .setTokenSymbol('TWO')
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(100)
        .setTreasuryAccountId(operatorAccountId)
        .setAdminKey(operatorPrivateKey)
        .setSupplyKey(operatorPrivateKey)
        .setTokenMemo('Test Well Ownership NFT for Integration Testing');

      const response = await nftCreateTx.execute(client);
      const receipt = await response.getReceipt(client);
      const newNftId = receipt.tokenId!;

      expect(newNftId).toBeDefined();
      expect(newNftId.toString()).toMatch(/^0\.0\.[0-9]+$/);

      // Verify NFT info
      const tokenInfo = await new TokenInfoQuery()
        .setTokenId(newNftId)
        .execute(client);

      expect(tokenInfo.name).toBe('Test Well Ownership NFT');
      expect(tokenInfo.symbol).toBe('TWO');
      expect(tokenInfo.tokenType).toBe(TokenType.NonFungibleUnique);
      expect(tokenInfo.maxSupply?.toString()).toBe('100');

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        tokenId: newNftId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          tokenName: tokenInfo.name,
          symbol: tokenInfo.symbol,
          tokenType: tokenInfo.tokenType?.toString() || 'UNKNOWN',
          maxSupply: tokenInfo.maxSupply?.toString()
        }
      });

      console.log(`✅ Created NFT token: ${newNftId.toString()}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Max Supply: ${tokenInfo.maxSupply?.toString()}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should mint NFT with metadata', async () => {
    const startTime = Date.now();
    const testName = 'NFT Minting with Metadata';
    
    try {
      const wellMetadata = {
        wellId: 'WELL-001',
        location: {
          latitude: -1.2921,
          longitude: 36.8219,
          address: 'Nairobi, Kenya'
        },
        specifications: {
          depth: 150,
          capacity: 5000,
          pumpType: 'Solar Submersible'
        },
        constructionDate: '2024-01-15',
        operator: 'Waternity Kenya Ltd'
      };

      const metadataBytes = Buffer.from(JSON.stringify(wellMetadata));

      const mintTx = new TokenMintTransaction()
        .setTokenId(nftTokenId)
        .addMetadata(metadataBytes);

      const response = await mintTx.execute(client);
      const receipt = await response.getReceipt(client);
      const serialNumbers = receipt.serials;

      expect(serialNumbers).toBeDefined();
      expect(serialNumbers.length).toBe(1);
      expect(serialNumbers[0].toString()).toBe('1');

      // Verify NFT was minted by checking token info
      const tokenInfo = await new TokenInfoQuery()
        .setTokenId(nftTokenId)
        .execute(client);

      expect(tokenInfo.totalSupply.toString()).toBe('1');

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        tokenId: nftTokenId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          serialNumber: serialNumbers[0].toString(),
          totalSupply: tokenInfo.totalSupply.toString(),
          metadataSize: metadataBytes.length
        }
      });

      console.log(`✅ Minted NFT: ${nftTokenId.toString()}/${serialNumbers[0].toString()}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Metadata size: ${metadataBytes.length} bytes`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should mint additional fungible tokens', async () => {
    const startTime = Date.now();
    const testName = 'Fungible Token Minting';
    
    try {
      const mintAmount = 100000; // 1,000.00 tokens
      
      // Get initial supply
      const initialTokenInfo = await new TokenInfoQuery()
        .setTokenId(testTokenId)
        .execute(client);
      const initialSupply = initialTokenInfo.totalSupply;

      const mintTx = new TokenMintTransaction()
        .setTokenId(testTokenId)
        .setAmount(mintAmount);

      const response = await mintTx.execute(client);
      const receipt = await response.getReceipt(client);

      expect(receipt.status.toString()).toBe('SUCCESS');

      // Verify new supply
      const newTokenInfo = await new TokenInfoQuery()
        .setTokenId(testTokenId)
        .execute(client);
      const newSupply = newTokenInfo.totalSupply;

      expect(newSupply.toString()).toBe((parseInt(initialSupply.toString()) + mintAmount).toString());

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        tokenId: testTokenId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          mintedAmount: mintAmount,
          initialSupply: initialSupply.toString(),
          newSupply: newSupply.toString()
        }
      });

      console.log(`✅ Minted ${mintAmount} tokens`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   New supply: ${newSupply.toString()}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should transfer tokens for revenue distribution', async () => {
    const startTime = Date.now();
    const testName = 'Token Transfer for Revenue Distribution';
    
    try {
      const transferAmount = 50000; // 500.00 tokens
      
      // Get initial balance
      const initialBalance = await new AccountBalanceQuery()
        .setAccountId(operatorAccountId)
        .execute(client);
      
      const initialTokenBalance = initialBalance.tokens?.get(testTokenId) || 0;

      // Create a transfer transaction (self-transfer for testing)
      const transferTx = new TransferTransaction()
        .addTokenTransfer(testTokenId, operatorAccountId, -transferAmount)
        .addTokenTransfer(testTokenId, operatorAccountId, transferAmount);

      const response = await transferTx.execute(client);
      const receipt = await response.getReceipt(client);

      expect(receipt.status.toString()).toBe('SUCCESS');

      // Verify balance remains the same (self-transfer)
      const finalBalance = await new AccountBalanceQuery()
        .setAccountId(operatorAccountId)
        .execute(client);
      
      const finalTokenBalance = finalBalance.tokens?.get(testTokenId) || 0;
      expect(finalTokenBalance.toString()).toBe(initialTokenBalance.toString());

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        tokenId: testTokenId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          transferAmount,
          initialBalance: initialTokenBalance.toString(),
          finalBalance: finalTokenBalance.toString()
        }
      });

      console.log(`✅ Transferred ${transferAmount} tokens`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Balance: ${finalTokenBalance.toString()}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should verify token information via Mirror Node', async () => {
    const startTime = Date.now();
    const testName = 'Mirror Node Token Information';
    
    try {
      const networkEndpoints = getHederaNetworkEndpoints();
      
      // Test fungible token info
      const tokenResponse = await fetch(
        `${networkEndpoints.mirrorNode}/tokens/${testTokenId.toString()}`
      );
      expect(tokenResponse.ok).toBe(true);
      
      const tokenData = await tokenResponse.json();
      expect(tokenData.token_id).toBe(testTokenId.toString());
      expect(tokenData.name).toBe('Waternity Test Token');
      expect(tokenData.symbol).toBe('WTT');
      expect(tokenData.type).toBe('FUNGIBLE_COMMON');

      // Test NFT token info
      const nftResponse = await fetch(
        `${networkEndpoints.mirrorNode}/tokens/${nftTokenId.toString()}`
      );
      expect(nftResponse.ok).toBe(true);
      
      const nftData = await nftResponse.json();
      expect(nftData.token_id).toBe(nftTokenId.toString());
      expect(nftData.name).toBe('Waternity Well NFT');
      expect(nftData.symbol).toBe('WWN');
      expect(nftData.type).toBe('NON_FUNGIBLE_UNIQUE');

      // Test account token balances
      const balanceResponse = await fetch(
        `${networkEndpoints.mirrorNode}/accounts/${operatorAccountId.toString()}/tokens`
      );
      expect(balanceResponse.ok).toBe(true);
      
      const balanceData = await balanceResponse.json();
      expect(Array.isArray(balanceData.tokens)).toBe(true);
      
      const testTokenBalance = balanceData.tokens.find(
        (token: any) => token.token_id === testTokenId.toString()
      );
      expect(testTokenBalance).toBeDefined();
      expect(parseInt(testTokenBalance.balance)).toBeGreaterThan(0);

      testResults.push({
        testName,
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          fungibleTokenId: tokenData.token_id,
          nftTokenId: nftData.token_id,
          tokenBalance: testTokenBalance.balance
        }
      });

      console.log(`✅ Verified token information via Mirror Node`);
      console.log(`   Fungible Token: ${tokenData.token_id} (${tokenData.symbol})`);
      console.log(`   NFT Token: ${nftData.token_id} (${nftData.symbol})`);
      console.log(`   Balance: ${testTokenBalance.balance}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should simulate revenue distribution workflow', async () => {
    const startTime = Date.now();
    const testName = 'Revenue Distribution Workflow';
    
    try {
      // Simulate multiple investors receiving revenue tokens
      const revenueAmount = 25000; // 250.00 tokens per investor
      const investors = [
        { accountId: operatorAccountId, share: 0.4 }, // 40% share
        { accountId: operatorAccountId, share: 0.35 }, // 35% share (using same account for testing)
        { accountId: operatorAccountId, share: 0.25 }  // 25% share
      ];

      const distributionTransactions: string[] = [];
      let totalDistributed = 0;

      for (const investor of investors) {
        const investorAmount = Math.floor(revenueAmount * investor.share);
        totalDistributed += investorAmount;

        // In a real scenario, this would be to different accounts
        // For testing, we use self-transfers with different amounts
        const transferTx = new TransferTransaction()
          .addTokenTransfer(testTokenId, operatorAccountId, -investorAmount)
          .addTokenTransfer(testTokenId, investor.accountId, investorAmount)
          .setTransactionMemo(`Revenue distribution - ${(investor.share * 100).toFixed(1)}% share`);

        const response = await transferTx.execute(client);
        const receipt = await response.getReceipt(client);
        
        expect(receipt.status.toString()).toBe('SUCCESS');
        distributionTransactions.push(response.transactionId.toString());

        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Verify total distribution
      expect(totalDistributed).toBe(revenueAmount);
      expect(distributionTransactions.length).toBe(investors.length);

      testResults.push({
        testName,
        transactionId: distributionTransactions.join(', '),
        tokenId: testTokenId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          totalDistributed,
          numberOfInvestors: investors.length,
          transactionCount: distributionTransactions.length
        }
      });

      console.log(`✅ Completed revenue distribution workflow`);
      console.log(`   Total distributed: ${totalDistributed} tokens`);
      console.log(`   Investors: ${investors.length}`);
      console.log(`   Transactions: ${distributionTransactions.length}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 60000);
});