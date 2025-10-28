import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { POST as settlementsExecutePost } from '@/app/api/settlements/execute/route';

// Mock Hedera functions
vi.mock('@/lib/hedera/hts', () => ({
  ensureFtForWell: vi.fn().mockResolvedValue({ tokenId: '0.0.123456' }),
  transferPayouts: vi.fn().mockResolvedValue([
    { account: '0.0.111111', txId: 'mock-tx-1' },
    { account: '0.0.222222', txId: 'mock-tx-2' },
    { account: '0.0.333333', txId: 'mock-tx-3' }
  ])
}));

vi.mock('@/lib/hedera/hcs', () => ({
  submitMessage: vi.fn().mockResolvedValue({ messageId: 'mock-message-id' })
}));

/**
 * Settlement Execute Idempotency Tests
 * Tests that running execute twice with the same messageId is idempotent
 * 
 * This ensures that:
 * 1. Duplicate execute requests with same messageId don't create duplicate payouts
 * 2. The response is consistent for identical requests
 * 3. Database state remains consistent
 */
describe('Settlement Execute Idempotency Tests', () => {
  let testWell: any;
  let testUser: any;
  let testSettlement: any;
  let testInvestors: any[] = [];

  beforeAll(async () => {
    // Ensure USER role exists
    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: {
        name: 'USER'
      }
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Test User - Idempotency',
        email: `idempotency_user_${Date.now()}@test.com`,
        hashedPassword: 'test_password_123',
        salt: 'test_salt',
        walletEvm: '0.0.123456',
        roleId: userRole.id
      }
    });

    // Create test well
    testWell = await prisma.well.create({
      data: {
        code: `IDEM-WELL-${Date.now()}`,
        name: 'Idempotency Test Well',
        location: 'Test Location',
        topicId: '0.0.123456',
        operatorUserId: testUser.id
      }
    });

    // Create well memberships (investors) for calcPayouts to work
    const investors = [
      { name: 'Test Investor A', share: 4000 }, // 40%
      { name: 'Test Investor B', share: 3500 }, // 35%
      { name: 'Test Investor C', share: 2500 }  // 25%
    ];

    for (const investor of investors) {
      const investorUser = await prisma.user.create({
        data: {
          name: investor.name,
          email: `investor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@test.com`,
          hashedPassword: 'test_password_123',
          salt: 'test_salt',
          accountId: `0.0.${123456 + Math.floor(Math.random() * 1000)}`, // Unique account IDs
          roleId: userRole.id
        }
      });

      testInvestors.push({ ...investor, id: investorUser.id });

      await prisma.wellMembership.create({
        data: {
          wellId: testWell.id,
          userId: investorUser.id,
          shareBps: investor.share, // Basis points (4000 = 40%)
          roleName: 'INVESTOR'
        }
      });
    }
  });

  afterAll(async () => {
    // Clean up test data in correct order
    await prisma.anchor.deleteMany({});
    await prisma.payout.deleteMany({});
    await prisma.settlement.deleteMany({});
    await prisma.hcsEvent.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.waterQuality.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.wellMembership.deleteMany({});
    await prisma.well.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.idempotency.deleteMany({});
  });

  beforeEach(async () => {
    // Clean up settlement-related data before each test
    await prisma.anchor.deleteMany({});
    await prisma.payout.deleteMany({});
    await prisma.settlement.deleteMany({});
    await prisma.hcsEvent.deleteMany({});
    await prisma.idempotency.deleteMany({});
    // Note: Keep well memberships as they should persist across tests
  });

  it('should be idempotent when executing settlement with same messageId', async () => {
    const startTime = Date.now();
    
    try {
      // Create an approved settlement
      const settlement = await prisma.settlement.create({
        data: {
          wellId: testWell.id,
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          kwhTotal: 1000.0,
          grossRevenue: 500.0,
          status: 'APPROVED'
        }
      });

      // Prepare execute request data with fixed messageId
      const messageId = uuidv4();
      const executeData = {
        settlementId: settlement.id,
        messageId: messageId,
        executedBy: '0.0.123456',
        timestamp: new Date().toISOString()
      };

      // First execution
      const request1 = new NextRequest('http://localhost:3000/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(executeData)
      });

      const response1 = await settlementsExecutePost(request1);
      expect(response1.status).toBe(200);
      
      // Verify settlement was updated to EXECUTED status
      const updatedSettlement = await prisma.settlement.findUnique({
        where: { id: settlement.id }
      });
      expect(updatedSettlement?.status).toBe('EXECUTED');
      expect(updatedSettlement?.executeEventId).toBe(messageId);

      // Verify payouts were created (amount determined by calcPayouts)
      const payouts1 = await prisma.payout.findMany({
        where: { settlementId: settlement.id }
      });
      expect(payouts1.length).toBeGreaterThan(0);
      expect(payouts1[0].amount).toBeGreaterThan(0);

      // Note: HCS events are mocked in tests, so we don't verify them in the database

      // Second execution with SAME messageId (should be idempotent)
      const request2 = new NextRequest('http://localhost:3000/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4() // Different idempotency key but same messageId
        },
        body: JSON.stringify(executeData) // Same messageId in body
      });

      const response2 = await settlementsExecutePost(request2);
      expect(response2.status).toBe(200);

      // Verify settlement status remains EXECUTED (idempotent)
      const finalSettlement = await prisma.settlement.findUnique({
        where: { id: settlement.id }
      });
      expect(finalSettlement?.status).toBe('EXECUTED');
      expect(finalSettlement?.executeEventId).toBe(messageId);

      // Verify no duplicate payouts were created
      const payouts2 = await prisma.payout.findMany({
        where: { settlementId: settlement.id }
      });
      expect(payouts2.length).toBe(payouts1.length); // Same number of payouts
      expect(payouts2[0].amount).toBe(payouts1[0].amount); // Same amounts

      // Note: HCS events are mocked, so we don't verify them in the database

      console.log(`✅ Settlement execute idempotency test passed`);
      console.log(`   Settlement ID: ${settlement.id}`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Payouts: ${payouts2.length}`);
      console.log(`   Duration: ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('❌ Settlement execute idempotency test failed:', error);
      throw error;
    }
  }, 30000);

  it('should create different payouts for different messageIds', async () => {
    const startTime = Date.now();
    
    try {
      // Create two approved settlements
      const settlement1 = await prisma.settlement.create({
        data: {
          wellId: testWell.id,
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          kwhTotal: 1000.0,
          grossRevenue: 500.0,
          status: 'APPROVED'
        }
      });

      const settlement2 = await prisma.settlement.create({
        data: {
          wellId: testWell.id,
          periodStart: new Date('2024-02-01'),
          periodEnd: new Date('2024-02-28'),
          kwhTotal: 1200.0,
          grossRevenue: 600.0,
          status: 'APPROVED'
        }
      });

      // Execute first settlement with messageId1
      const messageId1 = uuidv4();
      const executeData1 = {
        settlementId: settlement1.id,
        messageId: messageId1,
        executedBy: '0.0.123456',
        timestamp: new Date().toISOString()
      };

      const request1 = new NextRequest('http://localhost:3000/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(executeData1)
      });

      const response1 = await settlementsExecutePost(request1);
      if (response1.status !== 200) {
        const errorBody = await response1.text();
        console.log('Execute response1 error:', response1.status, errorBody);
        throw new Error(`API returned ${response1.status}: ${errorBody}`);
      }
      expect(response1.status).toBe(200);

      // Execute second settlement with messageId2 (different)
      const messageId2 = uuidv4();
      const executeData2 = {
        settlementId: settlement2.id,
        messageId: messageId2,
        executedBy: '0.0.123456',
        timestamp: new Date().toISOString()
      };

      const request2 = new NextRequest('http://localhost:3000/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(executeData2)
      });

      const response2 = await settlementsExecutePost(request2);
      if (response2.status !== 200) {
        const errorBody = await response2.text();
        console.log('Execute response2 error:', response2.status, errorBody);
      }
      expect(response2.status).toBe(200);

      // Verify both settlements have their own payouts
      const payouts1 = await prisma.payout.findMany({
        where: { settlementId: settlement1.id }
      });
      const payouts2 = await prisma.payout.findMany({
        where: { settlementId: settlement2.id }
      });

      expect(payouts1).toHaveLength(3);
      expect(payouts2).toHaveLength(3);
      
      // Verify payouts were created (recipients determined by calcPayouts)
      expect(payouts1[0].recipientAccount).toBeDefined();
      expect(payouts1[1].recipientAccount).toBeDefined();
      expect(payouts1[2].recipientAccount).toBeDefined();
      expect(payouts2[0].recipientAccount).toBeDefined();
      expect(payouts2[1].recipientAccount).toBeDefined();
      expect(payouts2[2].recipientAccount).toBeDefined();

      console.log(`✅ Different messageIds create different payouts test passed`);
      console.log(`   Settlement 1 ID: ${settlement1.id}, Message ID: ${messageId1}`);
      console.log(`   Settlement 2 ID: ${settlement2.id}, Message ID: ${messageId2}`);
      console.log(`   Duration: ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('❌ Different messageIds test failed:', error);
      throw error;
    }
  }, 30000);

  it('should handle idempotency with partial failures', async () => {
    const startTime = Date.now();
    
    try {
      // Create an approved settlement
      const settlement = await prisma.settlement.create({
        data: {
          wellId: testWell.id,
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          kwhTotal: 1000.0,
          grossRevenue: 500.0,
          status: 'APPROVED'
        }
      });

      const messageId = uuidv4();
      
      // First attempt with invalid data (should fail)
      const invalidExecuteData = {
        settlementId: settlement.id,
        messageId: messageId,
        executedBy: '0.0.123456'
        // Missing required timestamp field
      };

      const request1 = new NextRequest('http://localhost:3000/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(invalidExecuteData)
      });

      const response1 = await settlementsExecutePost(request1);
      expect(response1.status).toBe(400); // Should fail validation

      // Second attempt with valid data but same messageId
      const validExecuteData = {
        settlementId: settlement.id,
        messageId: messageId, // Same messageId
        executedBy: '0.0.123456',
        timestamp: new Date().toISOString()
      };

      const request2 = new NextRequest('http://localhost:3000/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(validExecuteData)
      });

      const response2 = await settlementsExecutePost(request2);
      if (response2.status !== 200) {
        const errorBody = await response2.text();
        console.log('Execute response2 (partial failure test) error:', response2.status, errorBody);
      }
      expect(response2.status).toBe(200); // Should succeed

      // Verify payouts were created only once
      const payouts = await prisma.payout.findMany({
        where: { settlementId: settlement.id }
      });
      expect(payouts).toHaveLength(3);

      console.log(`✅ Idempotency with partial failures test passed`);
      console.log(`   Settlement ID: ${settlement.id}`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Duration: ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('❌ Idempotency with partial failures test failed:', error);
      throw error;
    }
  }, 30000);
});