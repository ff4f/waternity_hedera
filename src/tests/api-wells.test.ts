import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';
import { GET as getWells, POST as createWell } from '@/app/api/wells/route';
import { GET as getWell, PUT as updateWell, DELETE as deleteWell } from '@/app/api/wells/[id]/route';

describe('Wells API Tests', () => {
  let testOperator: any;
  let testWell: any;

  beforeAll(async () => {
    // Create test operator
    testOperator = await prisma.user.create({
      data: {
        name: 'Test Operator',
        username: `test_operator_${Date.now()}`,
        password: 'test_password_123',
        walletEvm: '0.0.123456',
        role: 'OPERATOR'
      }
    });
  });

  afterAll(async () => {
    // Clean dependencies first to avoid foreign key constraints
    await prisma.anchor.deleteMany({});
    await prisma.payout.deleteMany({});
    await prisma.waterQuality.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.settlement.deleteMany({});
    await prisma.hcsEvent.deleteMany({});
    await prisma.wellMembership.deleteMany({});
    await prisma.well.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean dependencies first to avoid foreign key constraints
    await prisma.anchor.deleteMany({});
    await prisma.payout.deleteMany({});
    await prisma.waterQuality.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.settlement.deleteMany({});
    await prisma.hcsEvent.deleteMany({});
    await prisma.wellMembership.deleteMany({});
    await prisma.hcsEvent.deleteMany({});
    await prisma.well.deleteMany({});
  });

  describe('GET /api/wells', () => {
    it('should return empty wells list initially', async () => {
      const request = new NextRequest('http://localhost:3000/api/wells');
      const response = await getWells(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.wells).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return wells with pagination', async () => {
      // Create test wells
      await prisma.well.createMany({
        data: [
          {
            code: 'WELL001',
            name: 'Test Well 1',
            location: 'Location 1',
            topicId: '0.0.111111',
            operatorUserId: testOperator.id
          },
          {
            code: 'WELL002',
            name: 'Test Well 2',
            location: 'Location 2',
            topicId: '0.0.222222',
            operatorUserId: testOperator.id
          }
        ]
      });

      const request = new NextRequest('http://localhost:3000/api/wells?limit=1');
      const response = await getWells(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.wells).toHaveLength(1);
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should filter wells by operator', async () => {
      // Create another operator
      const anotherOperator = await prisma.user.create({
        data: {
          name: 'Another Operator',
          username: `another_operator_${Date.now()}`,
          password: 'test_password_123',
          walletEvm: '0.0.789012',
          role: 'OPERATOR'
        }
      });

      // Create wells for different operators
      await prisma.well.createMany({
        data: [
          {
            code: 'WELL001',
            name: 'Test Well 1',
            location: 'Location 1',
            topicId: '0.0.111111',
            operatorUserId: testOperator.id
          },
          {
            code: 'WELL002',
            name: 'Test Well 2',
            location: 'Location 2',
            topicId: '0.0.222222',
            operatorUserId: anotherOperator.id
          }
        ]
      });

      const request = new NextRequest(`http://localhost:3000/api/wells?operatorId=${testOperator.id}`);
      const response = await getWells(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.wells).toHaveLength(1);
      expect(data.wells[0].operatorUserId).toBe(testOperator.id);

      // Clean up - delete wells first to avoid foreign key constraint
      await prisma.well.deleteMany({ where: { operatorUserId: anotherOperator.id } });
      await prisma.user.delete({ where: { id: anotherOperator.id } });
    });
  });

  describe('POST /api/wells', () => {
    it('should create a new well', async () => {
      const wellData = {
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        code: 'WELL001',
        name: 'Test Well',
        location: 'Test Location',
        topicId: '0.0.123456',
        operatorUserId: testOperator.id
      };

      const request = new NextRequest('http://localhost:3000/api/wells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'test-well-create-001'
        },
        body: JSON.stringify(wellData)
      });

      const response = await createWell(request);
      const data = await response.json();
      
      if (response.status !== 201) {
        throw new Error(`Expected 201 but got ${response.status}. Response: ${JSON.stringify(data)}`);
      }

      expect(response.status).toBe(201);
      expect(data.code).toBe(wellData.code);
      expect(data.name).toBe(wellData.name);
      expect(data.operatorUserId).toBe(testOperator.id);
      expect(data.operator.name).toBe(testOperator.name);

      testWell = data;
    });

    it('should reject duplicate well code', async () => {
      // Create first well
      await prisma.well.create({
        data: {
          code: 'WELL001',
          name: 'Test Well 1',
          location: 'Location 1',
          topicId: '0.0.111111',
          operatorUserId: testOperator.id
        }
      });

      // Try to create well with same code
      const wellData = {
        messageId: '550e8400-e29b-41d4-a716-446655440001',
        code: 'WELL001',
        name: 'Test Well 2',
        location: 'Location 2',
        topicId: '0.0.222222',
        operatorUserId: testOperator.id
      };

      const request = new NextRequest('http://localhost:3000/api/wells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wellData)
      });

      const response = await createWell(request);
      const data = await response.json();
      console.log('Duplicate well test response:', { status: response.status, data });
      
      if (response.status === 500) {
        console.error('500 Error details:', JSON.stringify(data, null, 2));
        throw new Error(`Expected 409 but got 500. Error: ${JSON.stringify(data)}`);
      }

      expect(response.status).toBe(409);
      expect(data.error).toBe('Well code already exists');
    });

    it('should reject invalid operator', async () => {
      const wellData = {
        messageId: '550e8400-e29b-41d4-a716-446655440002',
        code: 'WELL001',
        name: 'Test Well',
        location: 'Test Location',
        topicId: '0.0.123456',
        operatorUserId: 'invalid-operator-id'
      };

      const request = new NextRequest('http://localhost:3000/api/wells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wellData)
      });

      const response = await createWell(request);
      const data = await response.json();
      console.log('Invalid operator test response:', { status: response.status, data });
      
      if (response.status === 500) {
        console.error('500 Error details:', JSON.stringify(data, null, 2));
        throw new Error(`Expected 404 but got 500. Error: ${JSON.stringify(data)}`);
      }

      expect(response.status).toBe(404);
      expect(data.error).toBe('Operator user not found');
    });

    it('should validate required fields', async () => {
      const wellData = {
        name: 'Test Well',
        location: 'Test Location'
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/wells', {
        method: 'POST',
        body: JSON.stringify(wellData)
      });

      const response = await createWell(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });
  });

  describe('GET /api/wells/[id]', () => {
    beforeEach(async () => {
      testWell = await prisma.well.create({
        data: {
          code: 'WELL001',
          name: 'Test Well',
          location: 'Test Location',
          topicId: '0.0.123456',
          operatorUserId: testOperator.id
        }
      });
    });

    it('should return well details', async () => {
      const request = new NextRequest(`http://localhost:3000/api/wells/${testWell.id}`);
      const response = await getWell(request, { params: { id: testWell.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testWell.id);
      expect(data.code).toBe('WELL001');
      expect(data.operator).toBeDefined();
      expect(data.operator.name).toBe(testOperator.name);
    });

    it('should return 404 for non-existent well', async () => {
      const request = new NextRequest('http://localhost:3000/api/wells/invalid-id');
      const response = await getWell(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Well not found');
    });
  });

  describe('PUT /api/wells/[id]', () => {
    beforeEach(async () => {
      testWell = await prisma.well.create({
        data: {
          code: 'WELL001',
          name: 'Test Well',
          location: 'Test Location',
          topicId: '0.0.123456',
          operatorUserId: testOperator.id
        }
      });
    });

    it('should update well details', async () => {
      const updateData = {
        name: 'Updated Well Name',
        location: 'Updated Location'
      };

      const request = new NextRequest(`http://localhost:3000/api/wells/${testWell.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await updateWell(request, { params: { id: testWell.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe(updateData.name);
      expect(data.location).toBe(updateData.location);
      expect(data.code).toBe('WELL001'); // Should remain unchanged
    });

    it('should reject duplicate code update', async () => {
      // Create another well
      await prisma.well.create({
        data: {
          code: 'WELL002',
          name: 'Another Well',
          location: 'Another Location',
          topicId: '0.0.222222',
          operatorUserId: testOperator.id
        }
      });

      const updateData = {
        code: 'WELL002' // Try to use existing code
      };

      const request = new NextRequest(`http://localhost:3000/api/wells/${testWell.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await updateWell(request, { params: { id: testWell.id } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Well code already exists');
    });
  });

  describe('DELETE /api/wells/[id]', () => {
    beforeEach(async () => {
      testWell = await prisma.well.create({
        data: {
          code: 'WELL001',
          name: 'Test Well',
          location: 'Test Location',
          topicId: '0.0.123456',
          operatorUserId: testOperator.id
        }
      });
    });

    it('should delete well without dependencies', async () => {
      const request = new NextRequest(`http://localhost:3000/api/wells/${testWell.id}`);
      const response = await deleteWell(request, { params: { id: testWell.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Well deleted successfully');

      // Verify well is deleted
      const deletedWell = await prisma.well.findUnique({
        where: { id: testWell.id }
      });
      expect(deletedWell).toBeNull();
    });

    it('should reject deletion of well with dependencies', async () => {
      // Add a membership to create dependency
      await prisma.wellMembership.create({
        data: {
          userId: testOperator.id,
          wellId: testWell.id,
          roleName: 'OPERATOR',
          shareBps: 10000
        }
      });

      const request = new NextRequest(`http://localhost:3000/api/wells/${testWell.id}`);
      const response = await deleteWell(request, { params: { id: testWell.id } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Cannot delete well with existing data');
      expect(data.details.memberships).toBe(1);
    });
  });
});