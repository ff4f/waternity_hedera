import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Client, AccountId, PrivateKey, Hbar } from '@hashgraph/sdk';
import { v4 as uuidv4 } from 'uuid';

// Import API route handlers
import { POST as hcsEventsPost } from '@/app/api/hcs/events/route';
import { POST as settlementsPost } from '@/app/api/settlements/route';
import { POST as documentsAnchorPost } from '@/app/api/documents/anchor/route';

/**
 * API Integration Tests
 * Tests all API endpoints with real Hedera testnet interactions
 * 
 * Prerequisites:
 * - Valid Hedera testnet account with HBAR balance
 * - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables
 * - Database connection and proper schema
 * - Network connectivity to Hedera testnet
 */
describe('API Integration Tests', () => {
  let client: Client;
  let operatorAccountId: AccountId;
  let operatorPrivateKey: PrivateKey;
  let testWell: any;
  let testUser: any;
  let testResults: Array<{
    testName: string;
    endpoint: string;
    method: string;
    statusCode: number;
    transactionId?: string;
    responseTime: number;
    status: 'PASS' | 'FAIL';
    error?: string;
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

    console.log(`Testing API Integration against Hedera ${process.env.HEDERA_NETWORK || 'testnet'}`);
    console.log(`Operator Account: ${operatorAccountId.toString()}`);
  }, 30000);

  afterAll(async () => {
    if (client) {
      client.close();
    }

    // Generate test results summary
    console.log('\n=== API Integration Test Results ===');
    testResults.forEach(result => {
      console.log(`${result.status}: ${result.method} ${result.endpoint} (${result.responseTime}ms)`);
      console.log(`  Status Code: ${result.statusCode}`);
      if (result.transactionId) {
        console.log(`  Transaction ID: ${result.transactionId}`);
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
            name: {
              startsWith: 'API Test Well'
            }
          }
        }
      }
    });
    await prisma.document.deleteMany({
      where: {
        well: {
          name: {
            startsWith: 'API Test Well'
          }
        }
      }
    });
    await prisma.token.deleteMany({
      where: {
        well: {
          name: {
            startsWith: 'API Test Well'
          }
        }
      }
    });
    await prisma.settlement.deleteMany({
      where: {
        well: {
          name: {
            startsWith: 'API Test Well'
          }
        }
      }
    });
    await prisma.hcsEvent.deleteMany({
      where: {
        type: {
          startsWith: 'API_TEST_'
        }
      }
    });
    await prisma.wellMembership.deleteMany({
      where: {
        well: {
          name: {
            startsWith: 'API Test Well'
          }
        }
      }
    });
    await prisma.well.deleteMany({
      where: {
        name: {
          startsWith: 'API Test Well'
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        name: {
          startsWith: 'API Test User'
        }
      }
    });

    // Create test user and well for API tests
    testUser = await prisma.user.create({
      data: {
        name: 'API Test User',
        username: `api_test_${Date.now()}`,
        password: 'test_password_123',
        walletEvm: operatorAccountId.toString(),
        role: 'USER'
      }
    });

    testWell = await prisma.well.create({
      data: {
        code: `API-TEST-${Date.now()}`,
        name: 'API Test Well',
        location: 'Test Location',
        topicId: '0.0.123456', // Will be updated with real topic ID
        operatorUserId: testUser.id
      }
    });
  });

  it('should test HCS Events API endpoint', async () => {
    const startTime = Date.now();
    const testName = 'HCS Events API Endpoint';
    const endpoint = '/api/hcs/events';
    const method = 'POST';
    
    try {
      // Prepare test data
      const eventData = {
        wellId: testWell.id,
        type: 'API_TEST_MILESTONE_COMPLETED',
        payload: {
          milestone: 'drilling_completed',
          depth: 150,
          timestamp: new Date().toISOString(),
          location: testWell.location,
          operator: testUser.name
        }
      };

      // Create request object
      const request = new NextRequest('http://localhost:3000/api/hcs/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(eventData)
      });

      // Call API endpoint
      const response = await hcsEventsPost(request);
      const responseData = await response.json();
      const responseTime = Date.now() - startTime;

      // Verify response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.messageId).toBeDefined();
      expect(responseData.data.transactionId).toBeDefined();

      // Verify event was created in database
      const createdEvent = await prisma.hcsEvent.findUnique({
        where: {
          messageId: responseData.data.messageId
        }
      });

      expect(createdEvent).toBeDefined();
      expect(createdEvent?.type).toBe(eventData.type);
      expect(createdEvent?.wellId).toBe(eventData.wellId);

      // Wait for consensus and verify via Mirror Node
      await new Promise(resolve => setTimeout(resolve, 5000));

      const mirrorNodeUrl = process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
      const mirrorResponse = await fetch(
        `${mirrorNodeUrl}/topics/messages?topicId=${testWell.topicId}&sequenceNumber=${createdEvent?.sequenceNumber}`
      );

      let mirrorVerified = false;
      if (mirrorResponse.ok) {
        const mirrorData = await mirrorResponse.json();
        mirrorVerified = mirrorData.messages && mirrorData.messages.length > 0;
      }

      testResults.push({
        testName,
        endpoint,
        method,
        statusCode: response.status,
        transactionId: responseData.data.transactionId,
        responseTime,
        status: 'PASS',
        metrics: {
          messageId: responseData.data.messageId,
          eventType: eventData.type,
          wellId: eventData.wellId,
          mirrorNodeVerified: mirrorVerified,
          payloadSize: JSON.stringify(eventData.payload).length
        }
      });

      console.log(`✅ HCS Events API test completed`);
      console.log(`   Message ID: ${responseData.data.messageId}`);
      console.log(`   Transaction: ${responseData.data.transactionId}`);
      console.log(`   Response Time: ${responseTime}ms`);
    } catch (error) {
      testResults.push({
        testName,
        endpoint,
        method,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 60000);

  it('should test Settlements API endpoint', async () => {
    const startTime = Date.now();
    const testName = 'Settlements API Endpoint';
    const endpoint = '/api/settlements';
    const method = 'POST';
    
    try {
      // Prepare test data
      const settlementData = {
        wellId: testWell.id,
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        kwhTotal: 1500.5,
        grossRevenue: 750.25
      };

      // Create request object
      const request = new NextRequest('http://localhost:3000/api/settlements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(settlementData)
      });

      // Call API endpoint
      const response = await settlementsPost(request);
      const responseData = await response.json();
      const responseTime = Date.now() - startTime;

      // Verify response
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBeDefined();
      expect(responseData.data.status).toBe('DRAFT');

      // Verify settlement was created in database
      const createdSettlement = await prisma.settlement.findUnique({
        where: {
          id: responseData.data.id
        },
        include: {
          well: true
        }
      });

      expect(createdSettlement).toBeDefined();
      expect(createdSettlement?.wellId).toBe(settlementData.wellId);
      expect(createdSettlement?.kwhTotal.toString()).toBe(settlementData.kwhTotal.toString());
      expect(createdSettlement?.grossRevenue.toString()).toBe(settlementData.grossRevenue.toString());

      testResults.push({
        testName,
        endpoint,
        method,
        statusCode: response.status,
        responseTime,
        status: 'PASS',
        metrics: {
          settlementId: responseData.data.id,
          wellId: settlementData.wellId,
          kwhTotal: settlementData.kwhTotal,
          grossRevenue: settlementData.grossRevenue,
          status: responseData.data.status,
          periodDays: Math.ceil((new Date(settlementData.periodEnd).getTime() - new Date(settlementData.periodStart).getTime()) / (1000 * 60 * 60 * 24))
        }
      });

      console.log(`✅ Settlements API test completed`);
      console.log(`   Settlement ID: ${responseData.data.id}`);
      console.log(`   Status: ${responseData.data.status}`);
      console.log(`   Response Time: ${responseTime}ms`);
    } catch (error) {
      testResults.push({
        testName,
        endpoint,
        method,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 45000);

  it('should test Documents Anchor API endpoint', async () => {
    const startTime = Date.now();
    const testName = 'Documents Anchor API Endpoint';
    const endpoint = '/api/documents/anchor';
    const method = 'POST';
    
    try {
      // Prepare test data
      const documentData = {
        wellId: testWell.id,
        type: 'COMPLIANCE_REPORT',
        cid: 'bafkreiabcd1234567890abcdef1234567890abcdef1234567890abcdef12',
        metadata: {
          filename: 'api-test-compliance-report.pdf',
          size: 1024000,
          mimeType: 'application/pdf',
          uploadedBy: testUser.name,
          timestamp: new Date().toISOString()
        }
      };

      // Create request object
      const request = new NextRequest('http://localhost:3000/api/documents/anchor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(documentData)
      });

      // Call API endpoint
      const response = await documentsAnchorPost(request);
      const responseData = await response.json();
      const responseTime = Date.now() - startTime;

      // Verify response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.documentId).toBeDefined();
      expect(responseData.data.anchorEventId).toBeDefined();

      // Verify document was created in database
      const createdDocument = await prisma.document.findUnique({
        where: {
          id: responseData.data.documentId
        }
      });

      expect(createdDocument).toBeDefined();
      expect(createdDocument?.wellId).toBe(documentData.wellId);
      expect(createdDocument?.type).toBe(documentData.type);
      expect(createdDocument?.cid).toBe(documentData.cid);

      // Verify anchor event was created
      const anchorEvent = await prisma.hcsEvent.findUnique({
        where: {
          id: responseData.data.anchorEventId
        }
      });

      expect(anchorEvent).toBeDefined();
      expect(anchorEvent?.type).toBe('DOCUMENT_ANCHORED');
      expect(anchorEvent?.wellId).toBe(documentData.wellId);

      testResults.push({
        testName,
        endpoint,
        method,
        statusCode: response.status,
        responseTime,
        status: 'PASS',
        metrics: {
          documentId: responseData.data.documentId,
          anchorEventId: responseData.data.anchorEventId,
          documentType: documentData.type,
          cid: documentData.cid,
          wellId: documentData.wellId,
          metadataSize: JSON.stringify(documentData.metadata).length
        }
      });

      console.log(`✅ Documents Anchor API test completed`);
      console.log(`   Document ID: ${responseData.data.documentId}`);
      console.log(`   Anchor Event ID: ${responseData.data.anchorEventId}`);
      console.log(`   Response Time: ${responseTime}ms`);
    } catch (error) {
      testResults.push({
        testName,
        endpoint,
        method,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 45000);

  it('should test API error handling and validation', async () => {
    const startTime = Date.now();
    const testName = 'API Error Handling and Validation';
    
    try {
      const errorTests = [
        {
          name: 'Invalid HCS Event Data',
          endpoint: '/api/hcs/events',
          method: 'POST',
          data: {
            // Missing required fields
            type: 'INVALID_EVENT'
          },
          expectedStatus: 400
        },
        {
          name: 'Invalid Settlement Data',
          endpoint: '/api/settlements',
          method: 'POST',
          data: {
            wellId: 'invalid-well-id',
            periodStart: 'invalid-date',
            kwhTotal: -100 // Invalid negative value
          },
          expectedStatus: 400
        },
        {
          name: 'Missing Document CID',
          endpoint: '/api/documents/anchor',
          method: 'POST',
          data: {
            wellId: testWell.id,
            type: 'COMPLIANCE_REPORT'
            // Missing required cid field
          },
          expectedStatus: 400
        }
      ];

      const errorTestResults = [];

      for (const errorTest of errorTests) {
        const testStartTime = Date.now();
        
        try {
          const request = new NextRequest(`http://localhost:3000${errorTest.endpoint}`, {
            method: errorTest.method,
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': uuidv4()
            },
            body: JSON.stringify(errorTest.data)
          });

          let response;
          if (errorTest.endpoint === '/api/hcs/events') {
            response = await hcsEventsPost(request);
          } else if (errorTest.endpoint === '/api/settlements') {
            response = await settlementsPost(request);
          } else if (errorTest.endpoint === '/api/documents/anchor') {
            response = await documentsAnchorPost(request);
          } else {
            throw new Error(`Unknown endpoint: ${errorTest.endpoint}`);
          }

          const responseTime = Date.now() - testStartTime;
          
          // Verify error response
          expect(response.status).toBe(errorTest.expectedStatus);
          
          const responseData = await response.json();
          expect(responseData.success).toBe(false);
          expect(responseData.error).toBeDefined();

          errorTestResults.push({
            name: errorTest.name,
            endpoint: errorTest.endpoint,
            expectedStatus: errorTest.expectedStatus,
            actualStatus: response.status,
            responseTime,
            passed: response.status === errorTest.expectedStatus
          });

          console.log(`✅ Error test passed: ${errorTest.name} (${responseTime}ms)`);
        } catch (error) {
          errorTestResults.push({
            name: errorTest.name,
            endpoint: errorTest.endpoint,
            expectedStatus: errorTest.expectedStatus,
            actualStatus: 500,
            responseTime: Date.now() - testStartTime,
            passed: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Verify all error tests passed
      const allPassed = errorTestResults.every(result => result.passed);
      expect(allPassed).toBe(true);

      testResults.push({
        testName,
        endpoint: 'Multiple',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        status: 'PASS',
        metrics: {
          totalErrorTests: errorTests.length,
          passedTests: errorTestResults.filter(r => r.passed).length,
          averageResponseTime: Math.round(errorTestResults.reduce((sum, r) => sum + r.responseTime, 0) / errorTestResults.length),
          errorTestResults: errorTestResults
        }
      });

      console.log(`✅ API error handling tests completed`);
      console.log(`   Total Tests: ${errorTests.length}`);
      console.log(`   Passed: ${errorTestResults.filter(r => r.passed).length}`);
    } catch (error) {
      testResults.push({
        testName,
        endpoint: 'Multiple',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 60000);

  it('should test API idempotency', async () => {
    const startTime = Date.now();
    const testName = 'API Idempotency Testing';
    
    try {
      // Test idempotency with HCS Events API
      const eventData = {
        wellId: testWell.id,
        type: 'API_TEST_IDEMPOTENCY',
        payload: {
          test: 'idempotency',
          timestamp: new Date().toISOString()
        }
      };

      const idempotencyKey = uuidv4();

      // First request
      const request1 = new NextRequest('http://localhost:3000/api/hcs/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(eventData)
      });

      const response1 = await hcsEventsPost(request1);
      const responseData1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(responseData1.success).toBe(true);

      // Second request with same idempotency key
      const request2 = new NextRequest('http://localhost:3000/api/hcs/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(eventData)
      });

      const response2 = await hcsEventsPost(request2);
      const responseData2 = await response2.json();

      // Should return same result (idempotent)
      expect(response2.status).toBe(200);
      expect(responseData2.success).toBe(true);
      expect(responseData2.data.messageId).toBe(responseData1.data.messageId);

      // Verify only one event was created
      const events = await prisma.hcsEvent.findMany({
        where: {
          messageId: responseData1.data.messageId
        }
      });

      expect(events.length).toBe(1);

      testResults.push({
        testName,
        endpoint: '/api/hcs/events',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        status: 'PASS',
        metrics: {
          idempotencyKey,
          messageId: responseData1.data.messageId,
          firstResponseTime: Date.now() - startTime,
          duplicateEventsCreated: events.length === 1 ? 0 : events.length - 1,
          idempotencyWorking: responseData2.data.messageId === responseData1.data.messageId
        }
      });

      console.log(`✅ API idempotency test completed`);
      console.log(`   Idempotency Key: ${idempotencyKey}`);
      console.log(`   Message ID: ${responseData1.data.messageId}`);
      console.log(`   Duplicate Prevention: ${responseData2.data.messageId === responseData1.data.messageId ? 'Working' : 'Failed'}`);
    } catch (error) {
      testResults.push({
        testName,
        endpoint: '/api/hcs/events',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 45000);

  it('should test API performance and response times', async () => {
    const startTime = Date.now();
    const testName = 'API Performance and Response Times';
    
    try {
      const performanceTests = [];
      const numberOfRequests = 5;

      // Test HCS Events API performance
      for (let i = 0; i < numberOfRequests; i++) {
        const requestStartTime = Date.now();
        
        const eventData = {
          wellId: testWell.id,
          type: `API_TEST_PERFORMANCE_${i}`,
          payload: {
            iteration: i,
            timestamp: new Date().toISOString()
          }
        };

        const request = new NextRequest('http://localhost:3000/api/hcs/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': uuidv4()
          },
          body: JSON.stringify(eventData)
        });

        const response = await hcsEventsPost(request);
        const responseTime = Date.now() - requestStartTime;
        
        expect(response.status).toBe(200);
        
        performanceTests.push({
          iteration: i,
          endpoint: '/api/hcs/events',
          responseTime,
          status: response.status
        });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate performance metrics
      const responseTimes = performanceTests.map(test => test.responseTime);
      const averageResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);
      const successfulRequests = performanceTests.filter(test => test.status === 200).length;

      // Performance assertions
      expect(averageResponseTime).toBeLessThan(10000); // Less than 10 seconds average
      expect(successfulRequests).toBe(numberOfRequests); // All requests successful

      testResults.push({
        testName,
        endpoint: '/api/hcs/events',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        status: 'PASS',
        metrics: {
          totalRequests: numberOfRequests,
          successfulRequests,
          averageResponseTime,
          minResponseTime,
          maxResponseTime,
          throughput: Math.round(numberOfRequests / ((Date.now() - startTime) / 1000)),
          responseTimes: responseTimes
        }
      });

      console.log(`✅ API performance test completed`);
      console.log(`   Total Requests: ${numberOfRequests}`);
      console.log(`   Successful: ${successfulRequests}`);
      console.log(`   Average Response Time: ${averageResponseTime}ms`);
      console.log(`   Min/Max: ${minResponseTime}ms / ${maxResponseTime}ms`);
    } catch (error) {
      testResults.push({
        testName,
        endpoint: '/api/hcs/events',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, 120000);
});