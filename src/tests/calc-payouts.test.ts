import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { calcPayouts } from '@/lib/settlement/calc';

let testOperator: any;
let testWell: any;
let testInvestors: any[] = [];

describe('CalcPayouts Function Tests', () => {
  beforeAll(async () => {
    // Create test operator
    testOperator = await prisma.user.create({
      data: {
        name: 'Test Operator CalcPayouts',
        username: 'test-operator-calcpayouts',
        password: 'password123',
        walletEvm: '0x1234567890123456789012345678901234567890',
        role: 'OPERATOR'
      }
    });

    // Create test well
    testWell = await prisma.well.create({
      data: {
        code: 'WELL-CALC-001',
        name: 'CalcPayouts Test Well',
        location: 'Test Location',
        topicId: '0.0.123456',
        operatorUserId: testOperator.id
      }
    });

    // Create test investors with specific share percentages
    const investors = [
      { name: 'Investor 1 CalcPayouts', username: 'investor1-calcpayouts', accountId: '0.0.111111', shareBps: 3333 }, // 33.33%
      { name: 'Investor 2 CalcPayouts', username: 'investor2-calcpayouts', accountId: '0.0.222222', shareBps: 3333 }, // 33.33%
      { name: 'Investor 3 CalcPayouts', username: 'investor3-calcpayouts', accountId: '0.0.333333', shareBps: 3334 }  // 33.34%
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
    await prisma.wellMembership.deleteMany({});
    await prisma.well.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should calculate payouts correctly for 3 investors', async () => {
    console.log('\n🧮 Testing calcPayouts function directly');
    
    // Check well memberships first
    const memberships = await prisma.wellMembership.findMany({
      where: { wellId: testWell.id },
      include: { user: true }
    });
    
    console.log(`   Well memberships found: ${memberships.length}`);
    memberships.forEach((m, i) => {
      console.log(`     Membership ${i + 1}: User ${m.user.name} (${m.user.accountId}) - ${m.shareBps} bps`);
    });
    
    expect(memberships.length).toBe(3);
    
    // Test calcPayouts with different gross revenues
    const testCases = [
      { grossRevenue: 100.0, description: 'simple case' },
      { grossRevenue: 100.123456, description: '6 decimal places' },
      { grossRevenue: 333.333333, description: 'repeating decimals' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Testing ${testCase.description}: ${testCase.grossRevenue}`);
      
      const recipients = await calcPayouts({
        wellId: testWell.id,
        grossRevenue: testCase.grossRevenue
      });
      
      console.log(`     Recipients returned: ${recipients.length}`);
      recipients.forEach((r, i) => {
        console.log(`       Recipient ${i + 1}: ${r.account} - ${r.amount}`);
      });
      
      expect(recipients.length).toBe(3);
      
      // Verify sum equals gross revenue
      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
      console.log(`     Total amount: ${totalAmount}`);
      console.log(`     Gross revenue: ${testCase.grossRevenue}`);
      console.log(`     Difference: ${Math.abs(totalAmount - testCase.grossRevenue)}`);
      
      const precision = 0.000001; // 6 decimal places
      const difference = Math.abs(totalAmount - testCase.grossRevenue);
      expect(difference).toBeLessThanOrEqual(precision);
    }
    
    console.log('\n✅ CalcPayouts function test passed');
  });
});