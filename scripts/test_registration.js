#!/usr/bin/env node

/**
 * Test script for registration with auto-refill
 * This script tests the registration endpoint to verify auto-refill works
 */

const fetch = require('node-fetch');

async function testRegistration() {
  console.log('🧪 Testing Registration with Auto-Refill');
  console.log('=========================================');

  const baseUrl = 'http://localhost:3001';
  const testUser = {
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    roleId: 'USER'
  };

  try {
    console.log('📝 Creating test user...');
    console.log(`Email: ${testUser.email}`);
    console.log(`Name: ${testUser.name}`);

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const result = await response.json();

    console.log('\n📊 Registration Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${response.ok}`);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log(`User ID: ${result.user?.id}`);
      console.log(`Hedera Account: ${result.user?.hederaAccountId}`);
      console.log(`HBAR Balance: ${result.hbarBalance || 'Not provided'}`);
      console.log(`Auto-refill: ${result.hbarToppedUp ? 'Yes' : 'No'}`);
      
      if (result.user?.hederaAccountId && result.hbarToppedUp) {
        console.log('\n🎉 AUTO-REFILL TEST PASSED!');
        console.log('New account was created and automatically refilled with HBAR.');
      } else if (result.user?.hederaAccountId) {
        console.log('\n⚠️  Account created but auto-refill status unclear.');
        console.log('Check server logs for more details.');
      } else {
        console.log('\n❌ No Hedera account was created.');
      }
    } else {
      console.log('❌ Registration failed:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001');
    return response.ok || response.status === 404; // 404 is fine, means server is running
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3001');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }

  await testRegistration();
}

main().catch(console.error);