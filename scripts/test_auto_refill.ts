#!/usr/bin/env tsx

/**
 * Test script for auto-refill functionality
 * This script tests the new account auto-refill feature for testnet
 */

// Load environment variables FIRST before any imports
require('dotenv').config({ path: '.env.local' });

// Now import after env vars are loaded
import { provisionHederaAccount, autoRefillNewTestnetAccount, getHbarBalance } from '../src/lib/hedera/client';

async function testAutoRefill() {
  console.log('🧪 Testing Auto-Refill Functionality');
  console.log('=====================================');
  console.log(`Network: ${process.env.HEDERA_NETWORK}`);
  console.log(`Mock Mode: ${process.env.HEDERA_MOCK_MODE}`);
  console.log('');

  if (process.env.HEDERA_NETWORK !== 'testnet') {
    console.log('❌ This test only works on testnet');
    process.exit(1);
  }

  if (process.env.HEDERA_MOCK_MODE === 'true') {
    console.log('❌ This test requires mock mode to be disabled');
    process.exit(1);
  }

  try {
    // Step 1: Create a new account
    console.log('📝 Step 1: Creating new Hedera account...');
    const newAccountId = await provisionHederaAccount();
    console.log(`✅ New account created: ${newAccountId}`);

    // Step 2: Check initial balance (should be 0)
    console.log('\n💰 Step 2: Checking initial balance...');
    const initialBalance = await getHbarBalance(newAccountId);
    console.log(`Initial balance: ${initialBalance.toString()}`);

    // Step 3: Test auto-refill
    console.log('\n🚀 Step 3: Testing auto-refill...');
    const refillResult = await autoRefillNewTestnetAccount(newAccountId);
    
    console.log('\n📊 Auto-refill Results:');
    console.log(`Success: ${refillResult.success}`);
    console.log(`Final Balance: ${refillResult.balance.toString()}`);
    if (refillResult.transactionId) {
      console.log(`Transaction ID: ${refillResult.transactionId}`);
    }

    // Step 4: Verify balance after refill
    console.log('\n🔍 Step 4: Verifying final balance...');
    const finalBalance = await getHbarBalance(newAccountId);
    console.log(`Verified balance: ${finalBalance.toString()}`);

    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`Account ID: ${newAccountId}`);
    console.log(`Initial Balance: ${initialBalance.toString()}`);
    console.log(`Auto-refill Success: ${refillResult.success}`);
    console.log(`Final Balance: ${finalBalance.toString()}`);
    
    if (refillResult.success && finalBalance.toBigNumber().isGreaterThan(initialBalance.toBigNumber())) {
      console.log('\n✅ AUTO-REFILL TEST PASSED!');
      console.log('New accounts will automatically receive HBAR on testnet.');
    } else {
      console.log('\n❌ AUTO-REFILL TEST FAILED!');
      console.log('Auto-refill did not work as expected.');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testAutoRefill().catch(console.error);