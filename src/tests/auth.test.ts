import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '../lib/types';

describe('Authentication System Tests', () => {
  let testUser: any;
  let adminUser: any;

  beforeAll(async () => {
    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ['testuser', 'adminuser']
        }
      }
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        username: 'testuser',
        password: hashedPassword,
        role: 'OPERATOR',
        walletEvm: '0x123456789'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        username: 'adminuser',
        password: hashedPassword,
        role: 'ADMIN',
        walletEvm: '0x987654321'
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ['testuser', 'adminuser', 'newuser']
        }
      }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up any test data created during tests
    await prisma.user.deleteMany({
      where: {
        username: 'newuser'
      }
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New User',
          username: 'newuser',
          password: 'newpassword123',
          role: 'INVESTOR',
          walletEvm: '0x111111111'
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('newuser');
      expect(data.user.name).toBe('New User');
      expect(data.user.role).toBe('INVESTOR');
      expect(data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject registration with duplicate username', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Duplicate User',
          username: 'testuser', // Already exists
          password: 'password123',
          role: 'INVESTOR'
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('username_taken');
    });

    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test',
          username: 'ab', // Too short
          password: '123', // Too short
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpassword123'
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('testuser');
      expect(data.user.role).toBe('OPERATOR');
      
      // Check if session cookie is set
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('wty_sess=');
    });

    it('should reject login with invalid username', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'nonexistent',
          password: 'testpassword123'
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('invalid_credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'wrongpassword'
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('invalid_credentials');
    });

    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser'
          // Missing password
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      // First login to get session cookie
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpassword123'
        }),
      });

      const cookies = loginResponse.headers.get('set-cookie');
      
      // Use session cookie to access profile
      const response = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Cookie': cookies || ''
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.id).toBe(testUser.id);
      expect(data.user.role).toBe('OPERATOR');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('unauthorized');
    });
  });
});