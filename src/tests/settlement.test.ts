import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import { POST as requestHandler } from '@/app/api/settlements/request/route';
import { POST as approveHandler } from '@/app/api/settlements/approve/route';
import { POST as executeHandler } from '@/app/api/settlements/execute/route';
import type { User, Well } from '@prisma/client';

import { getSession } from 'next-auth/react';

vi.mock('next-auth/react');

describe('Settlement E2E', () => {
  let user: User;
  let well: Well;

  beforeEach(async () => {
    await prisma.payout.deleteMany();
    await prisma.settlement.deleteMany();
    await prisma.wellMembership.deleteMany();
    await prisma.anchor.deleteMany();
    await prisma.document.deleteMany();
    await prisma.token.deleteMany();
    await prisma.hcsEvent.deleteMany();
    await prisma.well.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    // Ensure USER role exists
    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: {
        name: 'USER'
      }
    });

    user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `settlement_test_${Date.now()}@test.com`,
        hashedPassword: 'test_password_123',
        salt: 'test_salt',
        walletEvm: '0.0.123456',
        roleId: userRole.id,
      },
    });

    well = await prisma.well.create({
      data: {
        code: 'test-well',
        name: 'Test Well',
        location: 'Test Location',
        topicId: 'test-topic-id',
        operatorUserId: user.id,
      },
    });

    // Mock getSession
    vi.mocked(getSession).mockResolvedValue({
      user: {
        role: 'OPERATOR',
      },
    });
  });

  it('should handle the happy path', async () => {
    // 1. Request settlement
    const { req: reqRequest } = createMocks({
      method: 'POST',
      body: {
        wellId: well.id,
        periodStart: new Date('2024-01-01T00:00:00.000Z'),
        periodEnd: new Date('2024-01-31T23:59:59.999Z'),
        kwhTotal: 1000,
        grossRevenue: 100,
      },
    });

    const response = await requestHandler(reqRequest);
    const settlement = await response.json();

    expect(response.status).toBe(200);
    expect(settlement.status).toBe('PENDING');

    // 2. Approve settlement
    const { req: reqApprove, res: resApprove } = createMocks({
      method: 'POST',
      query: {
        id: settlement.id,
      },
    });

    await approveHandler(reqApprove);
    const approvedSettlement = JSON.parse(resApprove._getData());

    expect(resApprove._getStatusCode()).toBe(200);
    expect(approvedSettlement.status).toBe('APPROVED');

    // 3. Execute settlement
    const { req: reqExecute, res: resExecute } = createMocks({
      method: 'POST',
      query: {
        id: settlement.id,
      },
    });

    await executeHandler(reqExecute);
    const executedSettlement = JSON.parse(resExecute._getData());

    expect(resExecute._getStatusCode()).toBe(200);
    expect(executedSettlement.status).toBe('EXECUTED');

    const payouts = await prisma.payout.findMany();
    expect(payouts.length).toBe(1);
    expect(payouts[0].amount).toBe(100);
  });
});