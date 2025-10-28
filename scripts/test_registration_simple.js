#!/usr/bin/env node

/**
 * Simple test to verify auto-refill functionality
 * This script creates a test user and checks if auto-refill works
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

async function testRegistration() {
  console.log('🧪 Testing Registration with Auto-Refill');
  console.log('=========================================');
  
  // Generate random test user
  const timestamp = Date.now();
  // Use the correct OPERATOR role ID from database
  const testUser = {
    messageId: crypto.randomUUID(),
    email: `test${timestamp}@example.com`,
    password: 'password123',
    name: `Test User ${timestamp}`,
    roleId: 'OPERATOR', // Role name, not ID
  };
  
  console.log(`Testing with user: ${testUser.email}`);
  
  // First, get CSRF token
  console.log('\n📝 Step 1: Getting CSRF token...');
  
  try {
    const csrfData = await getCsrfToken();
    console.log('✅ CSRF token obtained');
    
    // Now register user
    console.log('\n🚀 Step 2: Registering user...');
    const result = await registerUser(testUser, csrfData.token, csrfData.cookies);
    
    console.log('\n📊 Registration Results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.id && result.hederaAccountId) {
      console.log('\n✅ REGISTRATION SUCCESSFUL!');
      console.log(`User ID: ${result.id}`);
      console.log(`Hedera Account ID: ${result.hederaAccountId}`);
      console.log(`Role: ${result.role?.name || 'Unknown'}`);
      
      if (result.hbarBalance) {
        console.log(`HBAR Balance: ${result.hbarBalance}`);
        const balanceNum = parseFloat(result.hbarBalance.replace(' ℏ', ''));
        if (balanceNum > 0) {
          console.log('✅ AUTO-REFILL WORKED! Account has HBAR balance.');
        } else {
          console.log('⚠️  Account created but no HBAR balance detected.');
        }
      }
      
      if (result.hbarToppedUp) {
        console.log('✅ HBAR TOP-UP CONFIRMED!');
      }
    } else {
      console.log('\n❌ REGISTRATION FAILED');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

function getCsrfToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/csrf',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const cookies = res.headers['set-cookie'];
          resolve({ token: parsed.csrfToken, cookies });
        } catch (e) {
          reject(new Error('Failed to parse CSRF response'));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function registerUser(user, csrfToken, cookies) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(user);
    
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-CSRF-Token': csrfToken
    };
    
    // Add cookies if available
    if (cookies && cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ');
    }
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Run the test
testRegistration().catch(console.error);