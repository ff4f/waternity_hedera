import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { POST as settlementsExecutePost } from '@/app/api/settlements/execute/route';

// Mock Hedera functions
vi.mock('@/lib/hedera/hts', () => ({
  ensureFtForWell: vi.fn().mockResolvedValue({ tokenId: '0.0.123456' }),
  transferPayouts: vi.fn().mockImplementation(({ recipients }) => {
    return Promise.resolve(
      recipients.map((recipient: any, index: number) => ({
        account: recipient.account,
        txId: `mock-tx-${index + 1}`
      }))
    );
  })
}));

vi.mock('@/lib/hedera/hcs', () => ({
  submitMessage: vi.fn().mockResolvedValue({ messageId: 'mock-message-id' })
}));

let testOperator: any;
let testWell: any;
let testInvestors: any[] = [];

describe('Settlement Execute Precision Tests', () => {
  beforeAll(async () => {
    // Create test operator
    testOperator = await prisma.user.create({
      data: {
        name: 'Test Operator Precision',
        username: 'test-operator-precision',
        password: 'password123',
        walletEvm: '0x1234567890123456789012345678901234567890',
        role: 'OPERATOR'
      }
    });

    // Create test well
    testWell = await prisma.well.create({
      data: {
        code: 'WELL-PRECISION-001',
        name: 'Precision Test Well',
        location: 'Test Location',
        topicId: '0.0.123456',
        operatorUserId: testOperator.id
      }
    });

    // Create test investors with specific share percentages
    const investors = [
      { name: 'Investor 1 Precision', username: 'investor1-precision', accountId: '0.0.111111', shareBps: 3333 },
      { name: 'Investor 2 Precision', username: 'investor2-precision', accountId: '0.0.222222', shareBps: 3333 },
      { name: 'Investor 3 Precision', username: 'investor3-precision', accountId: '0.0.333333', shareBps: 3334 }
    ];

    for (const investor of investors) {
      const investorUser = await prisma.user.create({
        data: {
          name: investor.name,
          username: investor.username,
          password: 'password123',
          accountId: investor.accountId,
          role: 'INVESTOR'
        }
      });

      await prisma.wellMembership.create({
        data: {
          userId: investorUser.id,
          wellId: testWell.id,
          roleName: 'INVESTOR',
          shareBps: investor.shareBps
        }
      });

      testInvestors.push({ user: investorUser, shareBps: investor.shareBps });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.payout.deleteMany({});
    await prisma.hcsEvent.deleteMany({});
    await prisma.settlement.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.wellMembership.deleteMany({});
    await prisma.well.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.idempotency.deleteMany({});
  });

  beforeEach(async () => {
    // Clean up between tests
    await prisma.payout.deleteMany({});
    await prisma.hcsEvent.deleteMany({});
    await prisma.settlement.deleteMany({});
    await prisma.idempotency.deleteMany({});
  });

  it('should ensure sum of recipient amounts equals grossRevenue with precision', async () => {
    try {
      // Test with specific grossRevenue amount
      const grossRevenue = 1000000; // $1000.000000
      
      // Create settlement
      const settlement = await prisma.settlement.create({
        data: {
          wellId: testWell.id,
          grossRevenue,
          assetType: 'TOKEN',
          status: 'PENDING'
        }
      });

      // Execute settlement
      const executeData = {
        settlementId: settlement.id,
        messageId: uuidv4(),
        executedBy: '0.0.123456',
        timestamp: new Date().toISOString()
      };

      const request = new NextRequest('http://localhost:3000/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': uuidv4()
        },
        body: JSON.stringify(executeData)
      });

      const response = await settlementsExecutePost(request);
      expect(response.status).toBe(200);

      // Get payouts and calculate sum
      const payouts = await prisma.payout.findMany({
        where: { settlementId: settlement.id }
      });
      
      expect(payouts.length).toBe(3); // Should have 3 payouts for 3 investors

      // Calculate sum of all payout amounts
      const totalPayoutAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      // Test precision: sum should equal grossRevenue within 6 decimal places
      const precision = 0.000001; // 6 decimal places
      const difference = Math.abs(totalPayoutAmount - grossRevenue);
      
      expect(difference).toBeLessThanOrEqual(precision);

    } catch (error) {
      console.error('❌ Precision test failed:', error);
      throw error;
    }
  }, 30000);
});