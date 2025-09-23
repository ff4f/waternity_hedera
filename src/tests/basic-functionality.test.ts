import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Basic Functionality Tests', () => {
  it('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it('should create and read user', async () => {
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User Basic',
        username: `test_basic_${Date.now()}`,
        password: 'test_password_123',
        accountId: '0.0.123456',
        walletEvm: '0.0.123456',
        role: 'USER'
      }
    });

    expect(testUser.id).toBeDefined();
    expect(testUser.name).toBe('Test User Basic');
    expect(testUser.role).toBe('USER');

    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  it('should create well with operator', async () => {
    const operator = await prisma.user.create({
      data: {
        name: 'Well Operator',
        username: `operator_basic_${Date.now()}`,
        password: 'test_password_123',
        accountId: '0.0.789012',
        walletEvm: '0.0.789012',
        role: 'OPERATOR'
      }
    });

    const well = await prisma.well.create({
      data: {
        code: `WELL${Date.now()}`,
        name: 'Test Well',
        location: 'Test Location',
        topicId: '0.0.123456',
        operatorUserId: operator.id
      }
    });

    expect(well.id).toBeDefined();
    expect(well.code).toMatch(/^WELL\d+$/);
    expect(well.operatorUserId).toBe(operator.id);

    // Clean up
    await prisma.well.delete({ where: { id: well.id } });
    await prisma.user.delete({ where: { id: operator.id } });
  });

  it('should validate environment variables', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.HEDERA_NETWORK).toBeDefined();
  });

  it('should handle JSON operations', () => {
    const testData = { name: 'test', value: 123 };
    const jsonString = JSON.stringify(testData);
    const parsed = JSON.parse(jsonString);
    
    expect(parsed.name).toBe('test');
    expect(parsed.value).toBe(123);
  });
});