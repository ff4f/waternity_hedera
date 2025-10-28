import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../lib/db/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '../lib/types';

describe('RBAC Tests', () => {
  let testInvestor: any;
  let testOperator: any;
  let testAgent: any;
  let investorCookie: string;
  let operatorCookie: string;
  let agentCookie: string;

  beforeAll(async () => {
    // Clean up existing data
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    
    // Create test roles
    const investorRole = await prisma.role.upsert({
      where: { name: 'INVESTOR' },
      update: {},
      create: { name: 'INVESTOR' }
    });
    
    const operatorRole = await prisma.role.upsert({
      where: { name: 'OPERATOR' },
      update: {},
      create: { name: 'OPERATOR' }
    });
    
    const agentRole = await prisma.role.upsert({
      where: { name: 'AGENT' },
      update: {},
      create: { name: 'AGENT' }
    });
    
    // Create test users
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('testpassword123', salt);
    
    testInvestor = await prisma.user.create({
      data: {
        name: 'Test Investor',
        email: 'testinvestor@test.com',
        hashedPassword,
        salt,
        roleId: investorRole.id,
        hederaAccountId: '0.0.1001'
      }
    });

    testOperator = await prisma.user.create({
      data: {
        name: 'Test Operator',
        email: 'testoperator@test.com',
        hashedPassword,
        salt,
        roleId: operatorRole.id,
        hederaAccountId: '0.0.1002'
      }
    });

    testAgent = await prisma.user.create({
      data: {
        name: 'Test Agent',
        email: 'testagent@test.com',
        hashedPassword,
        salt,
        roleId: agentRole.id,
        hederaAccountId: '0.0.1003'
      }
    });

    // Login each user to get cookies
    const investorLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testinvestor', password: 'testpassword123', messageId: 'test-investor-login' })
    });
    investorCookie = investorLogin.headers.get('set-cookie') || '';

    const operatorLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testoperator', password: 'testpassword123', messageId: 'test-operator-login' })
    });
    operatorCookie = operatorLogin.headers.get('set-cookie') || '';

    const agentLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testagent', password: 'testpassword123', messageId: 'test-agent-login' })
    });
    agentCookie = agentLogin.headers.get('set-cookie') || '';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ['testinvestor', 'testoperator', 'testagent']
        }
      }
    });
  });

  describe('Investor Access Control', () => {
    it('should allow investor to access investor APIs', async () => {
      const response = await fetch(`http://localhost:3000/api/investor/${testInvestor.id}`, {
        method: 'GET',
        headers: { 'Cookie': investorCookie }
      });
      
      expect(response.status).toBe(200);
    });

    it('should deny investor access to operator APIs (403 forbidden)', async () => {
      const response = await fetch('http://localhost:3000/api/wells', {
        method: 'POST',
        headers: {
          'Cookie': investorCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: 'test-well-create',
          operatorId: testOperator.id,
          wellCode: 'TEST-WELL-001',
          location: 'Test Location',
          depth: 100,
          capacity: 1000
        })
      });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('forbidden');
      expect(data.needRole).toBe('OPERATOR');
    });

    it('should deny investor access to agent APIs (403 forbidden)', async () => {
      const response = await fetch(`http://localhost:3000/api/agent/${testAgent.id}`, {
        method: 'GET',
        headers: { 'Cookie': investorCookie }
      });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('forbidden');
      expect(data.needRole).toBe('AGENT');
    });
  });

  describe('Operator Access Control', () => {
    it('should allow operator to access operator APIs', async () => {
      const response = await fetch('http://localhost:3000/api/wells', {
        method: 'POST',
        headers: {
          'Cookie': operatorCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: 'test-well-create-op',
          operatorId: testOperator.id,
          wellCode: 'TEST-WELL-002',
          location: 'Test Location 2',
          depth: 150,
          capacity: 1500
        })
      });
      
      expect(response.status).toBe(201);
    });

    it('should deny operator access to agent APIs (403 forbidden)', async () => {
      const response = await fetch(`http://localhost:3000/api/agent/${testAgent.id}`, {
        method: 'GET',
        headers: { 'Cookie': operatorCookie }
      });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('forbidden');
      expect(data.needRole).toBe('AGENT');
    });
  });

  describe('Agent Access Control', () => {
    it('should allow agent to access agent APIs', async () => {
      const response = await fetch(`http://localhost:3000/api/agent/${testAgent.id}`, {
        method: 'GET',
        headers: { 'Cookie': agentCookie }
      });
      
      expect(response.status).toBe(200);
    });

    it('should deny agent access to operator APIs (403 forbidden)', async () => {
      const response = await fetch('http://localhost:3000/api/wells', {
        method: 'POST',
        headers: {
          'Cookie': agentCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: 'test-well-create-agent',
          operatorId: testOperator.id,
          wellCode: 'TEST-WELL-003',
          location: 'Test Location 3',
          depth: 200,
          capacity: 2000
        })
      });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('forbidden');
      expect(data.needRole).toBe('OPERATOR');
    });
  });
});