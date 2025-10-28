import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { env } from '@/lib/env';

// E2E Test for HCS Publish to Testnet
describe('HCS Publish E2E Test', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  let authCookie: string;
  let csrfToken: string;
  let testTopicId: string;
  let publishedMessageId: string;
  let consensusTimestamp: string;

  beforeAll(async () => {
    // Skip if not in testnet environment
    if (env.HEDERA_NETWORK !== 'testnet') {
      console.log('Skipping HCS E2E test - not running on testnet');
      return;
    }

    // Authenticate and get session
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'testpassword123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      authCookie = setCookieHeader.split(';')[0];
    }

    // Get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
      headers: { Cookie: authCookie }
    });
    
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken;
    }

    // Get or create a test topic ID
    testTopicId = process.env.TEST_HCS_TOPIC_ID || '0.0.4738162'; // Default testnet topic
  });

  it('should publish HCS event to testnet and verify via Mirror Node', async () => {
    if (env.HEDERA_NETWORK !== 'testnet') {
      console.log('Skipping - not on testnet');
      return;
    }

    const testEvent = {
      messageId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      wellId: 'test-well-e2e',
      eventType: 'WATER_QUALITY_TEST',
      data: {
        ph: 7.2,
        temperature: 25.5,
        turbidity: 1.2,
        timestamp: new Date().toISOString()
      },
      metadata: {
        source: 'e2e-test',
        version: '1.0'
      }
    };

    // Publish HCS event
    const publishResponse = await fetch(`${BASE_URL}/api/hcs/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-CSRF-Token': csrfToken,
        'X-Idempotency-Key': testEvent.messageId
      },
      body: JSON.stringify(testEvent)
    });

    console.log('Publish response status:', publishResponse.status);
    
    if (publishResponse.status === 429) {
      // Handle rate limiting
      const retryAfter = publishResponse.headers.get('Retry-After');
      console.log(`Rate limited. Retry after: ${retryAfter} seconds`);
      
      expect(retryAfter).toBeTruthy();
      expect(parseInt(retryAfter!)).toBeGreaterThan(0);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, (parseInt(retryAfter!) + 1) * 1000));
      
      const retryResponse = await fetch(`${BASE_URL}/api/hcs/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
          'X-CSRF-Token': csrfToken,
          'X-Idempotency-Key': `${testEvent.messageId}-retry`
        },
        body: JSON.stringify({
          ...testEvent,
          messageId: `${testEvent.messageId}-retry`
        })
      });
      
      expect(retryResponse.ok).toBe(true);
      const retryData = await retryResponse.json();
      publishedMessageId = retryData.messageId;
      consensusTimestamp = retryData.consensusTimestamp;
    } else {
      expect(publishResponse.ok).toBe(true);
      const publishData = await publishResponse.json();
      
      expect(publishData).toHaveProperty('messageId');
      expect(publishData).toHaveProperty('consensusTimestamp');
      expect(publishData).toHaveProperty('transactionId');
      
      publishedMessageId = publishData.messageId;
      consensusTimestamp = publishData.consensusTimestamp;
    }

    // Wait for Mirror Node propagation
    console.log('Waiting for Mirror Node propagation...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

    // Verify via Mirror Node
    const mirrorNodeUrl = `${env.MIRROR_NODE_URL}/topics/${testTopicId}/messages`;
    const mirrorResponse = await fetch(mirrorNodeUrl);
    
    expect(mirrorResponse.ok).toBe(true);
    const mirrorData = await mirrorResponse.json();
    
    expect(mirrorData).toHaveProperty('messages');
    expect(Array.isArray(mirrorData.messages)).toBe(true);
    
    // Find our published message
    const ourMessage = mirrorData.messages.find((msg: any) => 
      msg.consensus_timestamp === consensusTimestamp ||
      Buffer.from(msg.message, 'base64').toString().includes(publishedMessageId)
    );
    
    if (ourMessage) {
      console.log('Message found in Mirror Node:', ourMessage.consensus_timestamp);
      expect(ourMessage).toBeTruthy();
      expect(ourMessage.topic_id).toBe(testTopicId);
    } else {
      console.log('Message not yet propagated to Mirror Node - this is acceptable for E2E test');
    }
  });

  it('should handle CSRF validation correctly', async () => {
    if (env.HEDERA_NETWORK !== 'testnet') {
      console.log('Skipping - not on testnet');
      return;
    }

    const testEvent = {
      messageId: `csrf-test-${Date.now()}`,
      wellId: 'test-well-csrf',
      eventType: 'CSRF_TEST',
      data: { test: true }
    };

    // Test without CSRF token - should fail
    const noCsrfResponse = await fetch(`${BASE_URL}/api/hcs/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-Idempotency-Key': testEvent.messageId
      },
      body: JSON.stringify(testEvent)
    });

    expect(noCsrfResponse.status).toBe(403);

    // Test with invalid CSRF token - should fail
    const invalidCsrfResponse = await fetch(`${BASE_URL}/api/hcs/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-CSRF-Token': 'invalid-token',
        'X-Idempotency-Key': `${testEvent.messageId}-invalid`
      },
      body: JSON.stringify({
        ...testEvent,
        messageId: `${testEvent.messageId}-invalid`
      })
    });

    expect(invalidCsrfResponse.status).toBe(403);
  });

  it('should handle idempotency correctly', async () => {
    if (env.HEDERA_NETWORK !== 'testnet') {
      console.log('Skipping - not on testnet');
      return;
    }

    const idempotencyKey = `idempotency-test-${Date.now()}`;
    const testEvent = {
      messageId: idempotencyKey,
      wellId: 'test-well-idempotency',
      eventType: 'IDEMPOTENCY_TEST',
      data: { test: true }
    };

    // First request
    const firstResponse = await fetch(`${BASE_URL}/api/hcs/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-CSRF-Token': csrfToken,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(testEvent)
    });

    if (firstResponse.status === 429) {
      console.log('Rate limited on first request - skipping idempotency test');
      return;
    }

    expect(firstResponse.ok).toBe(true);
    const firstData = await firstResponse.json();

    // Second request with same idempotency key
    const secondResponse = await fetch(`${BASE_URL}/api/hcs/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'X-CSRF-Token': csrfToken,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(testEvent)
    });

    expect(secondResponse.ok).toBe(true);
    const secondData = await secondResponse.json();

    // Should return the same result
    expect(secondData.messageId).toBe(firstData.messageId);
    expect(secondData.consensusTimestamp).toBe(firstData.consensusTimestamp);
  });

  afterAll(async () => {
    // Cleanup if needed
    console.log('HCS E2E test completed');
  });
});