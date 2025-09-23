import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TransferTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  AccountBalanceQuery,
  PrivateKey,
  AccountId,
  Hbar,
  TopicId,
  TokenId,
  FileId
} from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Performance and Load Testing for Hedera Operations
 * Tests system performance under various load conditions
 * 
 * Prerequisites:
 * - Valid Hedera testnet account with sufficient HBAR balance (minimum 50 HBAR)
 * - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables
 * - Network connectivity to Hedera testnet
 * - Database connection and proper schema
 */
describe('Performance and Load Tests', () => {
  let client: Client;
  let operatorAccountId: AccountId;
  let operatorPrivateKey: PrivateKey;
  let testTopicId: TopicId;
  let testTokenId: TokenId;
  let testFileId: FileId;
  let performanceMetrics: Array<{
    testName: string;
    operation: string;
    duration: number;
    throughput: number;
    successRate: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    totalOperations: number;
    failedOperations: number;
    transactionIds: string[];
    gasUsed?: number;
    networkFee?: string;
    status: 'PASS' | 'FAIL';
    error?: string;
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

    // Verify sufficient balance
    const balance = await new AccountBalanceQuery()
      .setAccountId(operatorAccountId)
      .execute(client);

    const minimumBalance = new Hbar(50);
    if (balance.hbars.toBigNumber().isLessThan(minimumBalance.toBigNumber())) {
      throw new Error(`Insufficient balance. Required: ${minimumBalance.toString()}, Available: ${balance.hbars.toString()}`);
    }

    console.log(`Performance Testing against Hedera ${process.env.HEDERA_NETWORK || 'testnet'}`);
    console.log(`Operator Account: ${operatorAccountId.toString()}`);
    console.log(`Available Balance: ${balance.hbars.toString()}`);

    // Create test resources
    await setupTestResources();
  }, 60000);

  afterAll(async () => {
    if (client) {
      client.close();
    }

    // Generate performance summary report
    console.log('\n=== Performance Test Results Summary ===');
    performanceMetrics.forEach(metric => {
      console.log(`${metric.status}: ${metric.testName}`);
      console.log(`  Operation: ${metric.operation}`);
      console.log(`  Duration: ${metric.duration}ms`);
      console.log(`  Total Operations: ${metric.totalOperations}`);
      console.log(`  Success Rate: ${metric.successRate.toFixed(2)}%`);
      console.log(`  Throughput: ${metric.throughput.toFixed(2)} ops/sec`);
      console.log(`  Avg Latency: ${metric.averageLatency.toFixed(2)}ms`);
      console.log(`  Min/Max Latency: ${metric.minLatency}ms / ${metric.maxLatency}ms`);
      if (metric.networkFee) {
        console.log(`  Network Fee: ${metric.networkFee}`);
      }
      if (metric.error) {
        console.log(`  Error: ${metric.error}`);
      }
      console.log('');
    });

    // Calculate overall performance statistics
    const totalOperations = performanceMetrics.reduce((sum, metric) => sum + metric.totalOperations, 0);
    const totalDuration = performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const overallThroughput = totalOperations / (totalDuration / 1000);
    const averageSuccessRate = performanceMetrics.reduce((sum, metric) => sum + metric.successRate, 0) / performanceMetrics.length;

    console.log('=== Overall Performance Statistics ===');
    console.log(`Total Operations: ${totalOperations}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Overall Throughput: ${overallThroughput.toFixed(2)} ops/sec`);
    console.log(`Average Success Rate: ${averageSuccessRate.toFixed(2)}%`);
  });

  async function setupTestResources() {
    // Create test topic
    const topicTx = new TopicCreateTransaction()
      .setTopicMemo('Performance Test Topic')
      .setMaxTransactionFee(new Hbar(2));
    
    const topicResponse = await topicTx.execute(client);
    const topicReceipt = await topicResponse.getReceipt(client);
    testTopicId = topicReceipt.topicId!;

    // Create test token
    const tokenTx = new TokenCreateTransaction()
      .setTokenName('Performance Test Token')
      .setTokenSymbol('PTT')
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setInitialSupply(1000000)
      .setTreasuryAccountId(operatorAccountId)
      .setAdminKey(operatorPrivateKey)
      .setSupplyKey(operatorPrivateKey)
      .setMaxTransactionFee(new Hbar(30));
    
    const tokenResponse = await tokenTx.execute(client);
    const tokenReceipt = await tokenResponse.getReceipt(client);
    testTokenId = tokenReceipt.tokenId!;

    // Create test file
    const fileTx = new FileCreateTransaction()
      .setContents('Performance test file content')
      .setMaxTransactionFee(new Hbar(2));
    
    const fileResponse = await fileTx.execute(client);
    const fileReceipt = await fileResponse.getReceipt(client);
    testFileId = fileReceipt.fileId!;

    console.log(`Test Topic ID: ${testTopicId.toString()}`);
    console.log(`Test Token ID: ${testTokenId.toString()}`);
    console.log(`Test File ID: ${testFileId.toString()}`);
  }

  beforeEach(async () => {
    // Clean up test data
    await prisma.hcsEvent.deleteMany({
      where: {
        type: {
          startsWith: 'PERF_TEST_'
        }
      }
    });
  });

  it('should test HCS message submission performance', async () => {
    const testName = 'HCS Message Submission Performance';
    const operation = 'HCS Message Submit';
    const numberOfMessages = 20;
    const startTime = Date.now();
    
    try {
      const latencies: number[] = [];
      const transactionIds: string[] = [];
      let failedOperations = 0;
      let totalFee = new Hbar(0);

      for (let i = 0; i < numberOfMessages; i++) {
        const messageStartTime = Date.now();
        
        try {
          const message = JSON.stringify({
            type: 'PERF_TEST_MESSAGE',
            iteration: i,
            timestamp: new Date().toISOString(),
            payload: {
              data: `Performance test message ${i}`,
              size: 'medium',
              testId: uuidv4()
            }
          });

          const messageTx = new TopicMessageSubmitTransaction()
            .setTopicId(testTopicId)
            .setMessage(message)
            .setMaxTransactionFee(new Hbar(1));

          const response = await messageTx.execute(client);
          const receipt = await response.getReceipt(client);
          
          const latency = Date.now() - messageStartTime;
          latencies.push(latency);
          transactionIds.push(response.transactionId.toString());
          
          // Get transaction cost
          const transactionRecord = await response.getRecord(client);
          totalFee = Hbar.fromTinybars(totalFee.toTinybars().add(transactionRecord.transactionFee.toTinybars()));

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failedOperations++;
          console.warn(`Message ${i} failed:`, error instanceof Error ? error.message : String(error));
        }
      }

      const totalDuration = Date.now() - startTime;
      const successfulOperations = numberOfMessages - failedOperations;
      const successRate = (successfulOperations / numberOfMessages) * 100;
      const throughput = successfulOperations / (totalDuration / 1000);
      const averageLatency = latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
      const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
      const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

      // Performance assertions
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
      expect(averageLatency).toBeLessThan(15000); // Average latency less than 15 seconds
      expect(throughput).toBeGreaterThan(0.5); // At least 0.5 messages per second

      performanceMetrics.push({
        testName,
        operation,
        duration: totalDuration,
        throughput,
        successRate,
        averageLatency,
        minLatency,
        maxLatency,
        totalOperations: numberOfMessages,
        failedOperations,
        transactionIds,
        networkFee: totalFee.toString(),
        status: 'PASS'
      });

      console.log(`✅ HCS performance test completed`);
      console.log(`   Messages: ${numberOfMessages}`);
      console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} msg/sec`);
      console.log(`   Avg Latency: ${averageLatency.toFixed(2)}ms`);
      console.log(`   Total Fee: ${totalFee.toString()}`);
    } catch (error) {
      performanceMetrics.push({
        testName,
        operation,
        duration: Date.now() - startTime,
        throughput: 0,
        successRate: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        totalOperations: numberOfMessages,
        failedOperations: numberOfMessages,
        transactionIds: [],
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 300000); // 5 minutes timeout

  it('should test token transfer performance', async () => {
    const testName = 'Token Transfer Performance';
    const operation = 'Token Transfer';
    const numberOfTransfers = 10;
    const startTime = Date.now();
    
    try {
      const latencies: number[] = [];
      const transactionIds: string[] = [];
      let failedOperations = 0;
      let totalFee = new Hbar(0);

      for (let i = 0; i < numberOfTransfers; i++) {
        const transferStartTime = Date.now();
        
        try {
          // Self-transfer of 1 token
          const transferTx = new TransferTransaction()
            .addTokenTransfer(testTokenId, operatorAccountId, -1)
            .addTokenTransfer(testTokenId, operatorAccountId, 1)
            .setTransactionMemo(`Performance test transfer ${i}`)
            .setMaxTransactionFee(new Hbar(2));

          const response = await transferTx.execute(client);
          const receipt = await response.getReceipt(client);
          
          const latency = Date.now() - transferStartTime;
          latencies.push(latency);
          transactionIds.push(response.transactionId.toString());
          
          // Get transaction cost
          const transactionRecord = await response.getRecord(client);
          totalFee = Hbar.fromTinybars(totalFee.toTinybars().add(transactionRecord.transactionFee.toTinybars()));

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          failedOperations++;
          console.warn(`Transfer ${i} failed:`, error instanceof Error ? error.message : String(error));
        }
      }

      const totalDuration = Date.now() - startTime;
      const successfulOperations = numberOfTransfers - failedOperations;
      const successRate = (successfulOperations / numberOfTransfers) * 100;
      const throughput = successfulOperations / (totalDuration / 1000);
      const averageLatency = latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
      const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
      const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

      // Performance assertions
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
      expect(averageLatency).toBeLessThan(20000); // Average latency less than 20 seconds
      expect(throughput).toBeGreaterThan(0.2); // At least 0.2 transfers per second

      performanceMetrics.push({
        testName,
        operation,
        duration: totalDuration,
        throughput,
        successRate,
        averageLatency,
        minLatency,
        maxLatency,
        totalOperations: numberOfTransfers,
        failedOperations,
        transactionIds,
        networkFee: totalFee.toString(),
        status: 'PASS'
      });

      console.log(`✅ Token transfer performance test completed`);
      console.log(`   Transfers: ${numberOfTransfers}`);
      console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} transfers/sec`);
      console.log(`   Avg Latency: ${averageLatency.toFixed(2)}ms`);
      console.log(`   Total Fee: ${totalFee.toString()}`);
    } catch (error) {
      performanceMetrics.push({
        testName,
        operation,
        duration: Date.now() - startTime,
        throughput: 0,
        successRate: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        totalOperations: numberOfTransfers,
        failedOperations: numberOfTransfers,
        transactionIds: [],
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 240000); // 4 minutes timeout

  it('should test file operations performance', async () => {
    const testName = 'File Operations Performance';
    const operation = 'File Append';
    const numberOfAppends = 5;
    const startTime = Date.now();
    
    try {
      const latencies: number[] = [];
      const transactionIds: string[] = [];
      let failedOperations = 0;
      let totalFee = new Hbar(0);

      for (let i = 0; i < numberOfAppends; i++) {
        const appendStartTime = Date.now();
        
        try {
          const appendContent = `\nPerformance test append ${i} - ${new Date().toISOString()}`;
          
          const appendTx = new FileAppendTransaction()
            .setFileId(testFileId)
            .setContents(appendContent)
            .setMaxTransactionFee(new Hbar(2));

          const response = await appendTx.execute(client);
          const receipt = await response.getReceipt(client);
          
          const latency = Date.now() - appendStartTime;
          latencies.push(latency);
          transactionIds.push(response.transactionId.toString());
          
          // Get transaction cost
          const transactionRecord = await response.getRecord(client);
          totalFee = Hbar.fromTinybars(totalFee.toTinybars().add(transactionRecord.transactionFee.toTinybars()));

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          failedOperations++;
          console.warn(`File append ${i} failed:`, error instanceof Error ? error.message : String(error));
        }
      }

      const totalDuration = Date.now() - startTime;
      const successfulOperations = numberOfAppends - failedOperations;
      const successRate = (successfulOperations / numberOfAppends) * 100;
      const throughput = successfulOperations / (totalDuration / 1000);
      const averageLatency = latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
      const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
      const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

      // Performance assertions
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
      expect(averageLatency).toBeLessThan(25000); // Average latency less than 25 seconds
      expect(throughput).toBeGreaterThan(0.1); // At least 0.1 operations per second

      performanceMetrics.push({
        testName,
        operation,
        duration: totalDuration,
        throughput,
        successRate,
        averageLatency,
        minLatency,
        maxLatency,
        totalOperations: numberOfAppends,
        failedOperations,
        transactionIds,
        networkFee: totalFee.toString(),
        status: 'PASS'
      });

      console.log(`✅ File operations performance test completed`);
      console.log(`   Appends: ${numberOfAppends}`);
      console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} ops/sec`);
      console.log(`   Avg Latency: ${averageLatency.toFixed(2)}ms`);
      console.log(`   Total Fee: ${totalFee.toString()}`);
    } catch (error) {
      performanceMetrics.push({
        testName,
        operation,
        duration: Date.now() - startTime,
        throughput: 0,
        successRate: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        totalOperations: numberOfAppends,
        failedOperations: numberOfAppends,
        transactionIds: [],
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 180000); // 3 minutes timeout

  it('should test concurrent operations performance', async () => {
    const testName = 'Concurrent Operations Performance';
    const operation = 'Concurrent HCS Messages';
    const numberOfConcurrentMessages = 5;
    const startTime = Date.now();
    
    try {
      const promises: Promise<any>[] = [];
      const results: Array<{ success: boolean; latency: number; transactionId?: string; error?: string }> = [];
      let totalFee = new Hbar(0);

      // Create concurrent message submissions
      for (let i = 0; i < numberOfConcurrentMessages; i++) {
        const messagePromise = (async (index: number) => {
          const messageStartTime = Date.now();
          
          try {
            const message = JSON.stringify({
              type: 'PERF_TEST_CONCURRENT',
              iteration: index,
              timestamp: new Date().toISOString(),
              payload: {
                data: `Concurrent test message ${index}`,
                testId: uuidv4()
              }
            });

            const messageTx = new TopicMessageSubmitTransaction()
              .setTopicId(testTopicId)
              .setMessage(message)
              .setMaxTransactionFee(new Hbar(1));

            const response = await messageTx.execute(client);
            const receipt = await response.getReceipt(client);
            
            const latency = Date.now() - messageStartTime;
            
            // Get transaction cost
            const transactionRecord = await response.getRecord(client);
            totalFee = Hbar.fromTinybars(totalFee.toTinybars().add(transactionRecord.transactionFee.toTinybars()));

            return {
              success: true,
              latency,
              transactionId: response.transactionId.toString()
            };
          } catch (error) {
            return {
              success: false,
              latency: Date.now() - messageStartTime,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        })(i);

        promises.push(messagePromise);
      }

      // Wait for all concurrent operations to complete
      const concurrentResults = await Promise.all(promises);
      results.push(...concurrentResults);

      const totalDuration = Date.now() - startTime;
      const successfulOperations = results.filter(r => r.success).length;
      const failedOperations = results.filter(r => !r.success).length;
      const successRate = (successfulOperations / numberOfConcurrentMessages) * 100;
      const throughput = successfulOperations / (totalDuration / 1000);
      const latencies = results.filter(r => r.success).map(r => r.latency);
      const averageLatency = latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
      const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
      const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
      const transactionIds = results.filter(r => r.success && r.transactionId).map(r => r.transactionId!);

      // Performance assertions
      expect(successRate).toBeGreaterThan(60); // At least 60% success rate for concurrent operations
      expect(averageLatency).toBeLessThan(30000); // Average latency less than 30 seconds
      expect(throughput).toBeGreaterThan(0.1); // At least 0.1 operations per second

      performanceMetrics.push({
        testName,
        operation,
        duration: totalDuration,
        throughput,
        successRate,
        averageLatency,
        minLatency,
        maxLatency,
        totalOperations: numberOfConcurrentMessages,
        failedOperations,
        transactionIds,
        networkFee: totalFee.toString(),
        status: 'PASS'
      });

      console.log(`✅ Concurrent operations performance test completed`);
      console.log(`   Concurrent Messages: ${numberOfConcurrentMessages}`);
      console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} ops/sec`);
      console.log(`   Avg Latency: ${averageLatency.toFixed(2)}ms`);
      console.log(`   Total Duration: ${totalDuration}ms`);
      console.log(`   Total Fee: ${totalFee.toString()}`);
    } catch (error) {
      performanceMetrics.push({
        testName,
        operation,
        duration: Date.now() - startTime,
        throughput: 0,
        successRate: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        totalOperations: numberOfConcurrentMessages,
        failedOperations: numberOfConcurrentMessages,
        transactionIds: [],
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 180000); // 3 minutes timeout

  it('should test database performance with Hedera operations', async () => {
    const testName = 'Database Performance with Hedera Operations';
    const operation = 'DB + HCS Operations';
    const numberOfOperations = 10;
    const startTime = Date.now();
    
    try {
      const latencies: number[] = [];
      const transactionIds: string[] = [];
      let failedOperations = 0;

      // Create test well for database operations
      const testWell = await prisma.well.create({
        data: {
          code: `PERF-TEST-${Date.now()}`,
          name: 'Performance Test Well',
          location: 'Test Location',
          topicId: testTopicId.toString(),
          operatorUserId: 'test-user-id'
        }
      });

      for (let i = 0; i < numberOfOperations; i++) {
        const operationStartTime = Date.now();
        
        try {
          // 1. Submit HCS message
          const message = JSON.stringify({
            type: 'PERF_TEST_DB_OPERATION',
            iteration: i,
            wellId: testWell.id,
            timestamp: new Date().toISOString()
          });

          const messageTx = new TopicMessageSubmitTransaction()
            .setTopicId(testTopicId)
            .setMessage(message)
            .setMaxTransactionFee(new Hbar(1));

          const response = await messageTx.execute(client);
          const receipt = await response.getReceipt(client);
          
          // 2. Store event in database
          await prisma.hcsEvent.create({
            data: {
              wellId: testWell.id,
              type: 'PERF_TEST_DB_OPERATION',
              messageId: uuidv4(),
              txId: response.transactionId.toString(),
              payloadJson: message,
              consensusTime: new Date(),
              sequenceNumber: BigInt(i + 1)
            }
          });

          // 3. Query database to verify
          const events = await prisma.hcsEvent.findMany({
            where: {
              wellId: testWell.id,
              type: 'PERF_TEST_DB_OPERATION'
            }
          });

          const latency = Date.now() - operationStartTime;
          latencies.push(latency);
          transactionIds.push(response.transactionId.toString());

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          failedOperations++;
          console.warn(`DB+HCS operation ${i} failed:`, error instanceof Error ? error.message : String(error));
        }
      }

      // Clean up test well
      await prisma.hcsEvent.deleteMany({
        where: { wellId: testWell.id }
      });
      await prisma.well.delete({
        where: { id: testWell.id }
      });

      const totalDuration = Date.now() - startTime;
      const successfulOperations = numberOfOperations - failedOperations;
      const successRate = (successfulOperations / numberOfOperations) * 100;
      const throughput = successfulOperations / (totalDuration / 1000);
      const averageLatency = latencies.length > 0 ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
      const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
      const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

      // Performance assertions
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
      expect(averageLatency).toBeLessThan(20000); // Average latency less than 20 seconds
      expect(throughput).toBeGreaterThan(0.3); // At least 0.3 operations per second

      performanceMetrics.push({
        testName,
        operation,
        duration: totalDuration,
        throughput,
        successRate,
        averageLatency,
        minLatency,
        maxLatency,
        totalOperations: numberOfOperations,
        failedOperations,
        transactionIds,
        status: 'PASS'
      });

      console.log(`✅ Database + Hedera performance test completed`);
      console.log(`   Operations: ${numberOfOperations}`);
      console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} ops/sec`);
      console.log(`   Avg Latency: ${averageLatency.toFixed(2)}ms`);
    } catch (error) {
      performanceMetrics.push({
        testName,
        operation,
        duration: Date.now() - startTime,
        throughput: 0,
        successRate: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        totalOperations: numberOfOperations,
        failedOperations: numberOfOperations,
        transactionIds: [],
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 300000); // 5 minutes timeout
});