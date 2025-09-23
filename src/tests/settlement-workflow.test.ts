import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  AccountBalanceQuery,
  PrivateKey,
  AccountId,
  TopicId,
  TokenId,
  Hbar,
  TokenType,
  TokenSupplyType
} from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { getHederaNetworkEndpoints } from '@/lib/env';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Settlement Workflow Integration Tests
 * Tests complete end-to-end settlement process with actual Hedera transactions
 * 
 * Prerequisites:
 * - Valid Hedera testnet account with HBAR balance
 * - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables
 * - Network connectivity to Hedera testnet
 */
describe('Settlement Workflow Integration Tests', () => {
  let client: Client;
  let operatorAccountId: AccountId;
  let operatorPrivateKey: PrivateKey;
  let testTopicIds: TopicId[] = [];
  let testTokenIds: TokenId[] = [];
  let testWellId: string;
  let testResults: Array<{
    testName: string;
    transactionId?: string;
    topicId?: string;
    tokenId?: string;
    status: 'PASS' | 'FAIL';
    error?: string;
    duration: number;
    metrics?: Record<string, any>;
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

    console.log(`Testing Settlement Workflow against Hedera ${process.env.HEDERA_NETWORK || 'testnet'}`);
    console.log(`Operator Account: ${operatorAccountId.toString()}`);
  }, 30000);

  afterAll(async () => {
    if (client) {
      client.close();
    }

    // Generate test results summary
    console.log('\n=== Settlement Workflow Test Results ===');
    testResults.forEach(result => {
      console.log(`${result.status}: ${result.testName} (${result.duration}ms)`);
      if (result.transactionId) {
        console.log(`  Transaction ID: ${result.transactionId}`);
      }
      if (result.topicId) {
        console.log(`  Topic ID: ${result.topicId}`);
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
    // Clean up test data in correct order to avoid foreign key constraints
    await prisma.anchor.deleteMany({});
    await prisma.payout.deleteMany({
      where: {
        settlement: {
          well: {
            code: {
              startsWith: 'TEST-WELL-'
            }
          }
        }
      }
    });
    // Skip waterQuality cleanup for now
    await prisma.document.deleteMany({
      where: {
        well: {
          code: {
            startsWith: 'TEST-WELL-'
          }
        }
      }
    });
    await prisma.token.deleteMany({
      where: {
        well: {
          code: {
            startsWith: 'TEST-WELL-'
          }
        }
      }
    });
    await prisma.settlement.deleteMany({
      where: {
        well: {
          code: {
            startsWith: 'TEST-WELL-'
          }
        }
      }
    });
    await prisma.hcsEvent.deleteMany({
      where: {
        well: {
          code: {
            startsWith: 'TEST-WELL-'
          }
        }
      }
    });
    await prisma.wellMembership.deleteMany({
      where: {
        well: {
          code: {
            startsWith: 'TEST-WELL-'
          }
        }
      }
    });
    await prisma.well.deleteMany({
      where: {
        code: {
          startsWith: 'TEST-WELL-'
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        name: {
          startsWith: 'Test User'
        }
      }
    });
  });

  it('should create well infrastructure for settlement testing', async () => {
    const startTime = Date.now();
    const testName = 'Well Infrastructure Setup';
    
    try {
      // Create test user (operator)
      const testUser = await prisma.user.create({
        data: {
          name: 'Test User - Settlement Operator',
          username: `settlement_operator_${Date.now()}`,
          password: 'test_password_123',
          walletEvm: operatorAccountId.toString(),
          role: 'USER'
        }
      });

      // Create HCS topic for the well
      const topicCreateTx = new TopicCreateTransaction()
        .setTopicMemo('Waternity Test Well - Settlement Workflow')
        .setMaxTransactionFee(new Hbar(2));

      const topicResponse = await topicCreateTx.execute(client);
      const topicReceipt = await topicResponse.getReceipt(client);
      const topicId = topicReceipt.topicId!;
      testTopicIds.push(topicId);

      // Create revenue token for the well
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName('Waternity Test Revenue Token')
        .setTokenSymbol('WTRT')
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(1000000) // 10,000.00 tokens
        .setTreasuryAccountId(operatorAccountId)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(operatorPrivateKey)
        .setMaxTransactionFee(new Hbar(30));

      const tokenResponse = await tokenCreateTx.execute(client);
      const tokenReceipt = await tokenResponse.getReceipt(client);
      const tokenId = tokenReceipt.tokenId!;
      testTokenIds.push(tokenId);

      // Create well in database
      const wellCode = `TEST-WELL-${Date.now()}`;
      const testWell = await prisma.well.create({
        data: {
          code: wellCode,
          name: 'Test Well - Settlement Workflow',
          location: 'Test Location, Kenya',
          topicId: topicId.toString(),
          tokenId: tokenId.toString(),
          operatorUserId: testUser.id
        }
      });

      testWellId = testWell.id;

      // Create well memberships (investors)
      const investors = [
        { name: 'Test Investor A', share: 4000 }, // 40%
        { name: 'Test Investor B', share: 3500 }, // 35%
        { name: 'Test Investor C', share: 2500 }  // 25%
      ];

      for (const investor of investors) {
        const investorUser = await prisma.user.create({
          data: {
            name: investor.name,
            username: `investor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            password: 'test_password_123',
            walletEvm: operatorAccountId.toString(), // Using same account for testing
            role: 'USER'
          }
        });

        await prisma.wellMembership.create({
          data: {
            userId: investorUser.id,
            wellId: testWell.id,
            roleName: 'INVESTOR',
            shareBps: investor.share
          }
        });
      }

      testResults.push({
        testName,
        transactionId: `${topicResponse.transactionId.toString()}, ${tokenResponse.transactionId.toString()}`,
        topicId: topicId.toString(),
        tokenId: tokenId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          wellCode: wellCode,
          topicId: topicId.toString(),
          tokenId: tokenId.toString(),
          investorCount: investors.length,
          totalShares: investors.reduce((sum, inv) => sum + inv.share, 0)
        }
      });

      console.log(`✅ Created well infrastructure: ${wellCode}`);
      console.log(`   Topic ID: ${topicId.toString()}`);
      console.log(`   Token ID: ${tokenId.toString()}`);
      console.log(`   Investors: ${investors.length}`);
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

  it('should create settlement request with HCS event', async () => {
    const startTime = Date.now();
    const testName = 'Settlement Request Creation';
    
    try {
      // Get the test well
      const well = await prisma.well.findFirst({
        where: {
          code: {
            startsWith: 'TEST-WELL-'
          }
        }
      });

      if (!well) {
        throw new Error('Test well not found');
      }

      const settlementData = {
        wellId: well.id,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        kwhTotal: 1250.75,
        grossRevenue: 875.50
      };

      // Create settlement request event payload
      const eventPayload = {
        eventType: 'SETTLEMENT_REQUEST',
        wellId: well.id,
        messageId: uuidv4(),
        data: {
          period: {
            start: settlementData.periodStart.toISOString(),
            end: settlementData.periodEnd.toISOString()
          },
          metrics: {
            kwhTotal: settlementData.kwhTotal,
            grossRevenue: settlementData.grossRevenue,
            currency: 'USD'
          },
          requestedBy: operatorAccountId.toString(),
          timestamp: new Date().toISOString()
        }
      };

      // Submit settlement request to HCS
      const topicId = TopicId.fromString(well.topicId);
      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(eventPayload))
        .setMaxTransactionFee(new Hbar(2));

      const messageResponse = await messageSubmitTx.execute(client);
      const messageReceipt = await messageResponse.getReceipt(client);

      expect(messageReceipt.status.toString()).toBe('SUCCESS');

      // Wait for consensus
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Create settlement in database
      const settlement = await prisma.settlement.create({
        data: {
          wellId: well.id,
          periodStart: settlementData.periodStart,
          periodEnd: settlementData.periodEnd,
          kwhTotal: settlementData.kwhTotal,
          grossRevenue: settlementData.grossRevenue,
          status: 'REQUESTED'
        }
      });

      // Create HCS event record
      await prisma.hcsEvent.create({
        data: {
          wellId: well.id,
          type: 'SETTLEMENT_REQUEST',
          messageId: eventPayload.messageId,
          txId: messageResponse.transactionId.toString(),
          payloadJson: JSON.stringify(eventPayload),
          consensusTime: new Date(),
          sequenceNumber: BigInt(1)
        }
      });

      testResults.push({
        testName,
        transactionId: messageResponse.transactionId.toString(),
        topicId: topicId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          settlementId: settlement.id,
          kwhTotal: settlementData.kwhTotal,
          grossRevenue: settlementData.grossRevenue,
          status: settlement.status
        }
      });

      console.log(`✅ Created settlement request: ${settlement.id}`);
      console.log(`   Transaction: ${messageResponse.transactionId.toString()}`);
      console.log(`   Revenue: $${settlementData.grossRevenue}`);
      console.log(`   Energy: ${settlementData.kwhTotal} kWh`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should approve settlement with HCS event', async () => {
    const startTime = Date.now();
    const testName = 'Settlement Approval';
    
    try {
      // Get the pending settlement
      const settlement = await prisma.settlement.findFirst({
        where: {
          status: 'REQUESTED'
        },
        include: {
          well: true
        }
      });

      if (!settlement) {
        throw new Error('No pending settlement found');
      }

      // Create settlement approval event payload
      const eventPayload = {
        eventType: 'SETTLEMENT_APPROVAL',
        wellId: settlement.wellId,
        messageId: uuidv4(),
        data: {
          settlementId: settlement.id,
          approvedBy: operatorAccountId.toString(),
          approvalTimestamp: new Date().toISOString(),
          approvedMetrics: {
            kwhTotal: settlement.kwhTotal,
            grossRevenue: settlement.grossRevenue
          },
          notes: 'Settlement approved after verification of energy production and revenue calculations'
        }
      };

      // Submit approval to HCS
      const topicId = TopicId.fromString(settlement.well.topicId);
      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(eventPayload))
        .setMaxTransactionFee(new Hbar(2));

      const messageResponse = await messageSubmitTx.execute(client);
      const messageReceipt = await messageResponse.getReceipt(client);

      expect(messageReceipt.status.toString()).toBe('SUCCESS');

      // Wait for consensus
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Update settlement status
      const updatedSettlement = await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: 'APPROVED'
        }
      });

      // Create HCS event record
      await prisma.hcsEvent.create({
        data: {
          wellId: settlement.wellId,
          type: 'SETTLEMENT_APPROVAL',
          messageId: eventPayload.messageId,
          txId: messageResponse.transactionId.toString(),
          payloadJson: JSON.stringify(eventPayload),
          consensusTime: new Date(),
          sequenceNumber: BigInt(2)
        }
      });

      testResults.push({
        testName,
        transactionId: messageResponse.transactionId.toString(),
        topicId: topicId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          settlementId: settlement.id,
          previousStatus: 'REQUESTED',
          newStatus: updatedSettlement.status,
          approvedBy: operatorAccountId.toString()
        }
      });

      console.log(`✅ Approved settlement: ${settlement.id}`);
      console.log(`   Transaction: ${messageResponse.transactionId.toString()}`);
      console.log(`   Status: ${settlement.status} → ${updatedSettlement.status}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should execute settlement with token distributions', async () => {
    const startTime = Date.now();
    const testName = 'Settlement Execution with Token Distribution';
    
    try {
      // Get the approved settlement
      const settlement = await prisma.settlement.findFirst({
        where: {
          status: 'APPROVED'
        },
        include: {
          well: {
            include: {
              memberships: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!settlement) {
        throw new Error('No approved settlement found');
      }

      const tokenId = TokenId.fromString(settlement.well.tokenId!);
      const grossRevenue = Number(settlement.grossRevenue);
      const operatorFee = grossRevenue * 0.05; // 5% operator fee
      const distributableRevenue = grossRevenue - operatorFee;

      // Calculate payouts based on membership shares
      const payouts = settlement.well.memberships.map(membership => {
        const sharePercentage = (membership.shareBps || 0) / 10000; // Convert basis points to percentage
        const amount = distributableRevenue * sharePercentage;
        return {
          recipientAccount: membership.user.walletEvm || operatorAccountId.toString(),
          assetType: 'TOKEN',
          amount: Math.round(amount * 100), // Convert to token units (2 decimals)
          tokenId: tokenId.toString(),
          shareBps: membership.shareBps
        };
      });

      // Mint tokens for distribution
      const totalTokensToMint = payouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(totalTokensToMint)
        .setMaxTransactionFee(new Hbar(20));

      const mintResponse = await mintTx.execute(client);
      const mintReceipt = await mintResponse.getReceipt(client);

      expect(mintReceipt.status.toString()).toBe('SUCCESS');

      // Create settlement execution event
      const eventPayload = {
        eventType: 'SETTLEMENT_EXECUTION',
        wellId: settlement.wellId,
        messageId: uuidv4(),
        data: {
          settlementId: settlement.id,
          executedBy: operatorAccountId.toString(),
          executionTimestamp: new Date().toISOString(),
          distribution: {
            grossRevenue: grossRevenue,
            operatorFee: operatorFee,
            distributableRevenue: distributableRevenue,
            tokensMinted: totalTokensToMint,
            payouts: payouts.map(p => ({
              recipient: p.recipientAccount,
              amount: p.amount,
              tokenId: p.tokenId,
              sharePercentage: (p.shareBps || 0) / 100 // Convert to percentage for display
            }))
          }
        }
      };

      // Submit execution to HCS
      const topicId = TopicId.fromString(settlement.well.topicId);
      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(eventPayload))
        .setMaxTransactionFee(new Hbar(2));

      const messageResponse = await messageSubmitTx.execute(client);
      const messageReceipt = await messageResponse.getReceipt(client);

      expect(messageReceipt.status.toString()).toBe('SUCCESS');

      // Update settlement status
      const updatedSettlement = await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: 'EXECUTED'
        }
      });

      // Create payout records
      const createdPayouts = [];
      for (const payout of payouts) {
        const createdPayout = await prisma.payout.create({
          data: {
            settlementId: settlement.id,
            recipientAccount: payout.recipientAccount,
            assetType: payout.assetType,
            amount: payout.amount / 100, // Convert back to decimal
            tokenId: payout.tokenId,
            txId: mintResponse.transactionId.toString(),
            status: 'SENT'
          }
        });
        createdPayouts.push(createdPayout);
      }

      // Create HCS event record
      await prisma.hcsEvent.create({
        data: {
          wellId: settlement.wellId,
          type: 'SETTLEMENT_EXECUTION',
          messageId: eventPayload.messageId,
          txId: messageResponse.transactionId.toString(),
          payloadJson: JSON.stringify(eventPayload),
          consensusTime: new Date(),
          sequenceNumber: BigInt(3)
        }
      });

      testResults.push({
        testName,
        transactionId: `${mintResponse.transactionId.toString()}, ${messageResponse.transactionId.toString()}`,
        tokenId: tokenId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          settlementId: settlement.id,
          grossRevenue: grossRevenue,
          operatorFee: operatorFee,
          distributableRevenue: distributableRevenue,
          tokensMinted: totalTokensToMint,
          payoutCount: createdPayouts.length,
          finalStatus: updatedSettlement.status
        }
      });

      console.log(`✅ Executed settlement: ${settlement.id}`);
      console.log(`   Mint Transaction: ${mintResponse.transactionId.toString()}`);
      console.log(`   HCS Transaction: ${messageResponse.transactionId.toString()}`);
      console.log(`   Tokens Minted: ${totalTokensToMint}`);
      console.log(`   Payouts Created: ${createdPayouts.length}`);
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

  it('should verify settlement completion via Mirror Node', async () => {
    const startTime = Date.now();
    const testName = 'Settlement Verification via Mirror Node';
    
    try {
      // Get the executed settlement
      const settlement = await prisma.settlement.findFirst({
        where: {
          status: 'EXECUTED'
        },
        include: {
          well: true,
          payouts: true
        }
      });

      if (!settlement) {
        throw new Error('No executed settlement found');
      }

      const networkEndpoints = getHederaNetworkEndpoints();
      
      // Verify HCS events for the settlement
      const hcsEvents = await prisma.hcsEvent.findMany({
        where: {
          wellId: settlement.wellId
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      expect(hcsEvents.length).toBeGreaterThan(0);

      // Verify each HCS event transaction via Mirror Node
        for (const event of hcsEvents) {
          if (event.txId) {
            const eventResponse = await fetch(
              `${networkEndpoints.mirrorNode}/api/v1/transactions/${event.txId}`
            );
            expect(eventResponse.ok).toBe(true);
            
            const eventData = await eventResponse.json();
            expect(eventData.transactions).toBeDefined();
            expect(eventData.transactions[0].result).toBe('SUCCESS');
          }
        }

      // Verify token information
      if (settlement.well.tokenId) {
        const tokenResponse = await fetch(
          `${networkEndpoints.mirrorNode}/api/v1/tokens/${settlement.well.tokenId}`
        );
        expect(tokenResponse.ok).toBe(true);
        
        const tokenData = await tokenResponse.json();
        expect(tokenData.token_id).toBe(settlement.well.tokenId);
        expect(tokenData.name).toBe('Waternity Test Revenue Token');
        expect(tokenData.symbol).toBe('WTRT');
      }

      // Verify topic messages
      const topicResponse = await fetch(
        `${networkEndpoints.mirrorNode}/api/v1/topics/${settlement.well.topicId}/messages?limit=10&order=desc`
      );
      expect(topicResponse.ok).toBe(true);
      
      const topicData = await topicResponse.json();
      expect(topicData.messages).toBeDefined();
      expect(topicData.messages.length).toBeGreaterThan(0);

      // Verify settlement events in messages
      const settlementMessages = topicData.messages.filter((msg: any) => {
        try {
          const decoded = Buffer.from(msg.message, 'base64').toString('utf-8');
          const payload = JSON.parse(decoded);
          return payload.data?.settlementId === settlement.id;
        } catch {
          return false;
        }
      });

      expect(settlementMessages.length).toBeGreaterThan(0);

      testResults.push({
        testName,
        topicId: settlement.well.topicId,
        tokenId: settlement.well.tokenId || undefined,
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          settlementId: settlement.id,
          hcsEventsVerified: hcsEvents.length,
          topicMessagesFound: topicData.messages.length,
          settlementMessagesFound: settlementMessages.length,
          payoutsCreated: settlement.payouts.length
        }
      });

      console.log(`✅ Verified settlement completion via Mirror Node`);
      console.log(`   Settlement ID: ${settlement.id}`);
      console.log(`   Topic Messages: ${topicData.messages.length}`);
      console.log(`   Settlement Messages: ${settlementMessages.length}`);
      console.log(`   Payouts: ${settlement.payouts.length}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should simulate complete settlement workflow end-to-end', async () => {
    const startTime = Date.now();
    const testName = 'Complete Settlement Workflow E2E';
    
    try {
      // This test simulates a complete settlement workflow from start to finish
      // in a single test to verify the entire process works together
      
      // Step 1: Create a new well for E2E testing
      const testUser = await prisma.user.create({
        data: {
          name: 'Test User - E2E Operator',
          username: `e2e_operator_${Date.now()}`,
          password: 'test_password_123',
          walletEvm: operatorAccountId.toString(),
          role: 'USER'
        }
      });

      const topicCreateTx = new TopicCreateTransaction()
        .setTopicMemo('Waternity E2E Settlement Test')
        .setMaxTransactionFee(new Hbar(2));

      const topicResponse = await topicCreateTx.execute(client);
      const topicReceipt = await topicResponse.getReceipt(client);
      const topicId = topicReceipt.topicId!;
      testTopicIds.push(topicId);

      const wellCode = `E2E-WELL-${Date.now()}`;
      const testWell = await prisma.well.create({
        data: {
          code: wellCode,
          name: 'E2E Test Well',
          location: 'E2E Test Location',
          topicId: topicId.toString(),
          operatorUserId: testUser.id
        }
      });

      // Step 2: Create settlement request
      const settlementData = {
        periodStart: new Date('2024-02-01'),
        periodEnd: new Date('2024-02-28'),
        kwhTotal: 2000.0,
        grossRevenue: 1400.0
      };

      const requestPayload = {
        eventType: 'SETTLEMENT_REQUEST',
        wellId: testWell.id,
        messageId: uuidv4(),
        data: settlementData
      };

      const requestTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(requestPayload))
        .setMaxTransactionFee(new Hbar(2));

      const requestResponse = await requestTx.execute(client);
      await requestResponse.getReceipt(client);

      const settlement = await prisma.settlement.create({
        data: {
          wellId: testWell.id,
          periodStart: settlementData.periodStart,
          periodEnd: settlementData.periodEnd,
          kwhTotal: settlementData.kwhTotal,
          grossRevenue: settlementData.grossRevenue,
          status: 'REQUESTED'
        }
      });

      // Step 3: Approve settlement
      await new Promise(resolve => setTimeout(resolve, 3000));

      const approvalPayload = {
        eventType: 'SETTLEMENT_APPROVAL',
        wellId: testWell.id,
        messageId: uuidv4(),
        data: { settlementId: settlement.id }
      };

      const approvalTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(approvalPayload))
        .setMaxTransactionFee(new Hbar(2));

      const approvalResponse = await approvalTx.execute(client);
      await approvalResponse.getReceipt(client);

      await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: 'APPROVED'
        }
      });

      // Step 4: Execute settlement
      await new Promise(resolve => setTimeout(resolve, 3000));

      const executionPayload = {
        eventType: 'SETTLEMENT_EXECUTION',
        wellId: testWell.id,
        messageId: uuidv4(),
        data: {
          settlementId: settlement.id,
          distributedAmount: settlementData.grossRevenue * 0.95 // 95% after fees
        }
      };

      const executionTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(executionPayload))
        .setMaxTransactionFee(new Hbar(2));

      const executionResponse = await executionTx.execute(client);
      await executionResponse.getReceipt(client);

      const finalSettlement = await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: 'EXECUTED'
        }
      });

      // Step 5: Verify complete workflow
      expect(finalSettlement.status).toBe('EXECUTED');
      
      // Verify HCS events were created
      const hcsEvents = await prisma.hcsEvent.findMany({
        where: {
          wellId: testWell.id
        }
      });
      expect(hcsEvents.length).toBe(3); // request, approval, execution

      testResults.push({
        testName,
        transactionId: `${requestResponse.transactionId.toString()}, ${approvalResponse.transactionId.toString()}, ${executionResponse.transactionId.toString()}`,
        topicId: topicId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          wellCode: wellCode,
          settlementId: settlement.id,
          kwhTotal: settlementData.kwhTotal,
          grossRevenue: settlementData.grossRevenue,
          finalStatus: finalSettlement.status,
          transactionCount: 4, // topic creation + 3 settlement events
          workflowSteps: ['REQUEST', 'APPROVAL', 'EXECUTION']
        }
      });

      console.log(`✅ Completed E2E settlement workflow`);
      console.log(`   Well: ${wellCode}`);
      console.log(`   Settlement: ${settlement.id}`);
      console.log(`   Status: ${finalSettlement.status}`);
      console.log(`   Transactions: 4 total`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 120000);
});