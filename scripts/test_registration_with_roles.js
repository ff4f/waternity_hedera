const fetch = require('node-fetch');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001';

async function getRoles() {
  try {
    // This endpoint might not exist, but let's try
    const response = await fetch(`${BASE_URL}/api/roles`);
    if (response.ok) {
      return await response.json();
    }
    
    // If that doesn't work, we'll try to get roles from a user endpoint or similar
    console.log('Direct roles endpoint not available, will use fallback approach');
    return null;
  } catch (error) {
    console.log('Could not fetch roles:', error.message);
    return null;
  }
}

async function getCsrfToken() {
  const response = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status}`);
  }
  
  const data = await response.json();
  const cookies = response.headers.get('set-cookie');
  
  return { token: data.token, cookies };
}

async function registerUser(userData, csrfToken, cookies) {
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  };
  
  // Add cookies if available
  if (cookies) {
    headers['Cookie'] = cookies;
  }
  
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Registration failed: ${result.error || response.statusText}`);
  }
  
  return result;
}

async function testRegistrationWithRoles() {
  try {
    console.log('🔍 Testing registration with role validation...');
    
    // Step 1: Try to get available roles
    console.log('📋 Fetching available roles...');
    const roles = await getRoles();
    
    if (roles) {
      console.log('✅ Available roles:', roles);
    } else {
      console.log('⚠️  Could not fetch roles, will try common role names');
    }
    
    // Step 2: Get CSRF token
    console.log('🔐 Getting CSRF token...');
    const { token: csrfToken, cookies } = await getCsrfToken();
    console.log('✅ CSRF token obtained');
    
    // Step 3: Try registration with different role approaches
    const timestamp = Date.now();
    const commonRoleNames = ['OPERATOR', 'INVESTOR', 'AGENT', 'ADMIN'];
    
    for (const roleName of commonRoleNames) {
      try {
        console.log(`\n🧪 Testing registration with role: ${roleName}`);
        
        const testUser = {
          email: `test${timestamp}_${roleName.toLowerCase()}@example.com`,
          name: `Test User ${timestamp} ${roleName}`,
          password: 'password123',
          roleId: roleName, // Try using role name directly
          messageId: crypto.randomUUID()
        };
        
        const result = await registerUser(testUser, csrfToken, cookies);
        
        console.log('✅ Registration successful!');
        console.log('📊 User created:', {
          email: result.user?.email,
          name: result.user?.name,
          hederaAccountId: result.user?.hederaAccountId,
          hbarBalance: result.hbarBalance
        });
        
        // If we get here, auto-refill worked!
        if (result.user?.hederaAccountId && result.hbarBalance !== undefined) {
          console.log('🎉 AUTO-REFILL FUNCTIONALITY VERIFIED!');
          console.log(`💰 New user received ${result.hbarBalance} HBAR`);
          console.log(`🏦 Hedera Account: ${result.user.hederaAccountId}`);
          return true;
        }
        
        break; // Success with this role, no need to try others
        
      } catch (error) {
        console.log(`❌ Failed with role ${roleName}:`, error.message);
        
        // If it's not a role error, break the loop
        if (!error.message.includes('role') && !error.message.includes('Role')) {
          console.log('🔍 Error seems unrelated to role, stopping role attempts');
          break;
        }
      }
    }
    
    console.log('\n❌ All role attempts failed');
    return false;
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

// Run the test
testRegistrationWithRoles()
  .then(success => {
    if (success) {
      console.log('\n🎉 AUTO-REFILL TEST PASSED!');
      process.exit(0);
    } else {
      console.log('\n❌ AUTO-REFILL TEST FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });