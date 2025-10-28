import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicMessageQuery, PrivateKey } from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { getHederaNetworkEndpoints } from '@/lib/env';
import { getOperator } from '@/lib/hedera/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * HCS Integration Tests
 * Tests actual Hedera Consensus Service integration with testnet
 * 
 * Prerequisites:
 * - Valid Hedera testnet account with HBAR balance
 * - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables
 * - Network connectivity to Hedera testnet
 */
describe('HCS Integration Tests', () => {
  let client: Client;
  let testTopicId: string;
  let operatorAccountId: string;
  let operatorPrivateKey: PrivateKey;
  const testResults: Array<{
    testName: string;
    transactionId?: string;
    consensusTimestamp?: string;
    messageId?: string;
    status: 'PASS' | 'FAIL';
    error?: string;
    duration: number;
  }> = [];

  beforeAll(async () => {
    // Use the same operator setup as the main application
    const { client: hederaClient, operatorAccountId: accountId, operatorPrivateKey: privateKey } = getOperator();
    
    client = hederaClient;
    operatorAccountId = accountId.toString();
    operatorPrivateKey = privateKey;

    // Verify network connectivity
    const networkEndpoints = getHederaNetworkEndpoints();
    console.log(`Testing against Hedera ${process.env.HEDERA_NETWORK || 'testnet'}`);
    console.log(`Mirror Node: ${networkEndpoints.mirrorNode}`);
    console.log(`HashScan: ${networkEndpoints.hashscan}`);

    // Create a test topic for integration tests
    const topicCreateTx = new TopicCreateTransaction()
      .setAdminKey(operatorPrivateKey.publicKey)
      .setSubmitKey(operatorPrivateKey.publicKey)
      .setTopicMemo('Waternity HCS Integration Test Topic');

    const topicCreateResponse = await topicCreateTx.execute(client);
    const topicCreateReceipt = await topicCreateResponse.getReceipt(client);
    testTopicId = topicCreateReceipt.topicId!.toString();

    console.log(`Created test topic: ${testTopicId}`);
    console.log(`Topic creation transaction: ${topicCreateResponse.transactionId.toString()}`);
  }, 30000);

  afterAll(async () => {
    if (client) {
      client.close();
    }

    // Generate test results summary
    console.log('\n=== HCS Integration Test Results ===');
    testResults.forEach(result => {
      console.log(`${result.status}: ${result.testName} (${result.duration}ms)`);
      if (result.transactionId) {
        console.log(`  Transaction ID: ${result.transactionId}`);
      }
      if (result.consensusTimestamp) {
        console.log(`  Consensus Timestamp: ${result.consensusTimestamp}`);
      }
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.hcsEvent.deleteMany({
      where: {
        messageId: {
          startsWith: 'test-'
        }
      }
    });
  });

  it('should create HCS topic successfully', async () => {
    const startTime = Date.now();
    const testName = 'Topic Creation';
    
    try {
      // Create another topic to test topic creation functionality
      const topicCreateTx = new TopicCreateTransaction()
        .setAdminKey(operatorPrivateKey.publicKey)
        .setSubmitKey(operatorPrivateKey.publicKey)
        .setTopicMemo('Additional Test Topic');

      const response = await topicCreateTx.execute(client);
      const receipt = await response.getReceipt(client);
      const newTopicId = receipt.topicId!.toString();

      expect(newTopicId).toMatch(/^0\.0\.[0-9]+$/);
      expect(response.transactionId).toBeDefined();

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime
      });

      console.log(`✅ Created topic: ${newTopicId}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
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

  it('should submit HCS message successfully', async () => {
    const startTime = Date.now();
    const testName = 'HCS Message Submission';
    const messageId = `test-${uuidv4()}`;
    
    try {
      const eventData = {
        messageId,
        eventType: 'METER_READING',
        wellId: 'test-well-001',
        payload: {
          reading: 1500.75,
          timestamp: new Date().toISOString(),
          agentId: 'test-agent-001'
        },
        submittedBy: operatorAccountId
      };

      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(testTopicId)
        .setMessage(JSON.stringify(eventData));

      const response = await messageSubmitTx.execute(client);
      const receipt = await response.getReceipt(client);
      
      expect(response.transactionId).toBeDefined();
      expect(receipt.status.toString()).toBe('SUCCESS');

      // Wait for consensus and verify via Mirror Node
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const networkEndpoints = getHederaNetworkEndpoints();
      const mirrorResponse = await fetch(
        `${networkEndpoints.mirrorNode}/api/v1/topics/${testTopicId}/messages?limit=1&order=desc`
      );
      
      expect(mirrorResponse.ok).toBe(true);
      const mirrorData = await mirrorResponse.json();
      expect(mirrorData.messages).toBeDefined();
      expect(mirrorData.messages.length).toBeGreaterThan(0);

      const latestMessage = mirrorData.messages[0];
      const decodedMessage = JSON.parse(Buffer.from(latestMessage.message, 'base64').toString());
      expect(decodedMessage.messageId).toBe(messageId);

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        consensusTimestamp: latestMessage.consensus_timestamp,
        messageId,
        status: 'PASS',
        duration: Date.now() - startTime
      });

      console.log(`✅ Submitted HCS message: ${messageId}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Consensus Timestamp: ${latestMessage.consensus_timestamp}`);
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

  it('should handle multiple event types correctly', async () => {
    const startTime = Date.now();
    const testName = 'Multiple Event Types';
    const eventTypes = ['METER_READING', 'VALVE_COMMAND', 'SETTLEMENT_REQUESTED'];
    const transactionIds: string[] = [];
    
    try {
      for (const eventType of eventTypes) {
        const messageId = `test-${eventType.toLowerCase()}-${uuidv4()}`;
        const eventData = {
          messageId,
          eventType,
          wellId: 'test-well-002',
          payload: {
            type: eventType,
            timestamp: new Date().toISOString(),
            data: { test: true }
          },
          submittedBy: operatorAccountId
        };

        const messageSubmitTx = new TopicMessageSubmitTransaction()
          .setTopicId(testTopicId)
          .setMessage(JSON.stringify(eventData));

        const response = await messageSubmitTx.execute(client);
        const receipt = await response.getReceipt(client);
        
        expect(receipt.status.toString()).toBe('SUCCESS');
        transactionIds.push(response.transactionId.toString());

        // Small delay between submissions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      testResults.push({
        testName,
        transactionId: transactionIds.join(', '),
        status: 'PASS',
        duration: Date.now() - startTime
      });

      console.log(`✅ Submitted ${eventTypes.length} different event types`);
      console.log(`   Transactions: ${transactionIds.join(', ')}`);
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

  it('should verify message ordering and sequence', async () => {
    const startTime = Date.now();
    const testName = 'Message Ordering and Sequence';
    const messageCount = 5;
    const messageIds: string[] = [];
    
    try {
      // Submit multiple messages in sequence
      for (let i = 0; i < messageCount; i++) {
        const messageId = `test-sequence-${i}-${uuidv4()}`;
        messageIds.push(messageId);
        
        const eventData = {
          messageId,
          eventType: 'METER_READING',
          wellId: 'test-well-sequence',
          payload: {
            sequenceNumber: i,
            reading: 1000 + (i * 100),
            timestamp: new Date().toISOString()
          },
          submittedBy: operatorAccountId
        };

        const messageSubmitTx = new TopicMessageSubmitTransaction()
          .setTopicId(testTopicId)
          .setMessage(JSON.stringify(eventData));

        const response = await messageSubmitTx.execute(client);
        await response.getReceipt(client);
        
        // Small delay to ensure ordering
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for consensus
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify message ordering via Mirror Node
      const networkEndpoints = getHederaNetworkEndpoints();
      const mirrorResponse = await fetch(
        `${networkEndpoints.mirrorNode}/api/v1/topics/${testTopicId}/messages?limit=${messageCount}&order=asc`
      );
      
      const mirrorData = await mirrorResponse.json();
      const messages = mirrorData.messages;
      
      expect(messages.length).toBeGreaterThanOrEqual(messageCount);
      
      // Verify sequence numbers are in order
      const sequenceMessages = messages
        .map((msg: any) => {
          try {
            return JSON.parse(Buffer.from(msg.message, 'base64').toString());
          } catch {
            return null;
          }
        })
        .filter((msg: any) => msg && msg.wellId === 'test-well-sequence')
        .sort((a: any, b: any) => a.payload.sequenceNumber - b.payload.sequenceNumber);

      expect(sequenceMessages.length).toBe(messageCount);
      
      for (let i = 0; i < messageCount; i++) {
        expect(sequenceMessages[i].payload.sequenceNumber).toBe(i);
        expect(messageIds).toContain(sequenceMessages[i].messageId);
      }

      testResults.push({
        testName,
        status: 'PASS',
        duration: Date.now() - startTime
      });

      console.log(`✅ Verified message ordering for ${messageCount} messages`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 90000);

  it('should handle large message payloads', async () => {
    const startTime = Date.now();
    const testName = 'Large Message Payloads';
    const messageId = `test-large-${uuidv4()}`;
    
    try {
      // Create a large payload (close to HCS message limit)
      const largeData = {
        readings: Array.from({ length: 100 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          value: Math.random() * 1000,
          sensorId: `sensor-${i.toString().padStart(3, '0')}`,
          metadata: {
            temperature: Math.random() * 40,
            humidity: Math.random() * 100,
            pressure: Math.random() * 1013
          }
        }))
      };

      const eventData = {
        messageId,
        eventType: 'METER_READING',
        wellId: 'test-well-large',
        payload: largeData,
        submittedBy: operatorAccountId
      };

      const messageJson = JSON.stringify(eventData);
      console.log(`Message size: ${messageJson.length} bytes`);
      
      // HCS message limit is 6144 bytes
      expect(messageJson.length).toBeLessThan(6144);

      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(testTopicId)
        .setMessage(messageJson);

      const response = await messageSubmitTx.execute(client);
      const receipt = await response.getReceipt(client);
      
      expect(receipt.status.toString()).toBe('SUCCESS');

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        messageId,
        status: 'PASS',
        duration: Date.now() - startTime
      });

      console.log(`✅ Submitted large message: ${messageJson.length} bytes`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
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

  it('should verify Mirror Node API integration', async () => {
    const startTime = Date.now();
    const testName = 'Mirror Node API Integration';
    
    try {
      const networkEndpoints = getHederaNetworkEndpoints();
      
      // Test topic info endpoint
      const topicResponse = await fetch(
        `${networkEndpoints.mirrorNode}/api/v1/topics/${testTopicId}`
      );
      expect(topicResponse.ok).toBe(true);
      
      const topicData = await topicResponse.json();
      expect(topicData.topic_id).toBe(testTopicId);
      expect(topicData.memo).toBe('Waternity HCS Integration Test Topic');

      // Test messages endpoint
      const messagesResponse = await fetch(
        `${networkEndpoints.mirrorNode}/api/v1/topics/${testTopicId}/messages?limit=10`
      );
      expect(messagesResponse.ok).toBe(true);
      
      const messagesData = await messagesResponse.json();
      expect(messagesData.messages).toBeDefined();
      expect(Array.isArray(messagesData.messages)).toBe(true);

      // Test account info endpoint
      const accountResponse = await fetch(
        `${networkEndpoints.mirrorNode}/api/v1/accounts/${operatorAccountId}`
      );
      expect(accountResponse.ok).toBe(true);
      
      const accountData = await accountResponse.json();
      expect(accountData.account).toBe(operatorAccountId);

      testResults.push({
        testName,
        status: 'PASS',
        duration: Date.now() - startTime
      });

      console.log(`✅ Verified Mirror Node API integration`);
      console.log(`   Topic: ${topicData.topic_id}`);
      console.log(`   Messages: ${messagesData.messages.length}`);
      console.log(`   Account: ${accountData.account}`);
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
});