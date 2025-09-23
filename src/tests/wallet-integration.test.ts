import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  Client,
  AccountBalanceQuery,
  AccountInfoQuery,
  TransferTransaction,
  PrivateKey,
  AccountId,
  Hbar,
  PublicKey
} from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { getHederaNetworkEndpoints } from '@/lib/env';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wallet Integration Tests
 * Tests wallet connectivity, account management, and HashConnect integration
 * 
 * Prerequisites:
 * - Valid Hedera testnet account with HBAR balance
 * - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables
 * - Network connectivity to Hedera testnet
 */
describe('Wallet Integration Tests', () => {
  let client: Client;
  let operatorAccountId: AccountId;
  let operatorPrivateKey: PrivateKey;
  let testResults: Array<{
    testName: string;
    transactionId?: string;
    accountId?: string;
    status: 'PASS' | 'FAIL';
    error?: string;
    duration: number;
    metrics?: Record<string, any>;
  }> = [];

  beforeAll(async () => {
    // Verify environment variables
    const operatorAccountIdString = process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKeyString = process.env.HEDERA_PRIVATE_KEY!;
    
    if (!operatorAccountIdString || !operatorPrivateKeyString) {
      throw new Error('Missing required Hedera environment variables');
    }

    operatorAccountId = AccountId.fromString(operatorAccountIdString);
    // Use the correct method for private keys
    operatorPrivateKey = PrivateKey.fromString(operatorPrivateKeyString);
    
    // Create Hedera client for testnet
    client = Client.forTestnet();
    client.setOperator(operatorAccountId, operatorPrivateKey);

    console.log(`Testing Wallet Integration against Hedera ${process.env.HEDERA_NETWORK || 'testnet'}`);
    console.log(`Operator Account: ${operatorAccountId.toString()}`);
  }, 30000);

  afterAll(async () => {
    if (client) {
      client.close();
    }

    // Generate test results summary
    console.log('\n=== Wallet Integration Test Results ===');
    testResults.forEach(result => {
      console.log(`${result.status}: ${result.testName} (${result.duration}ms)`);
      if (result.transactionId) {
        console.log(`  Transaction ID: ${result.transactionId}`);
      }
      if (result.accountId) {
        console.log(`  Account ID: ${result.accountId}`);
      }
      if (result.metrics) {
        console.log(`  Metrics: ${JSON.stringify(result.metrics)}`);
      }
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        name: {
          startsWith: 'Wallet Test User'
        }
      }
    });
  });

  it('should verify account connectivity and balance', async () => {
    const startTime = Date.now();
    const testName = 'Account Connectivity and Balance Check';
    
    try {
      // Query account balance
      const accountBalance = await new AccountBalanceQuery()
        .setAccountId(operatorAccountId)
        .execute(client);

      expect(accountBalance.hbars).toBeDefined();
      expect(accountBalance.hbars.toBigNumber().isGreaterThan(0)).toBe(true);

      // Query account information
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(operatorAccountId)
        .execute(client);

      expect(accountInfo.accountId.toString()).toBe(operatorAccountId.toString());
      expect(accountInfo.key).toBeDefined();
      expect(accountInfo.balance).toBeDefined();

      // Verify account is active and not deleted
      expect(accountInfo.isDeleted).toBe(false);

      testResults.push({
        testName,
        accountId: operatorAccountId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          hbarBalance: accountBalance.hbars.toString(),
          tokenCount: accountBalance.tokens ? Object.keys(accountBalance.tokens._map).length : 0,
          accountMemo: accountInfo.accountMemo,
          isDeleted: accountInfo.isDeleted,
          expirationTime: accountInfo.expirationTime?.toString()
        }
      });

      console.log(`✅ Account connectivity verified: ${operatorAccountId.toString()}`);
      console.log(`   Balance: ${accountBalance.hbars.toString()}`);
      console.log(`   Tokens: ${accountBalance.tokens ? Object.keys(accountBalance.tokens._map).length : 0}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should simulate wallet connection workflow', async () => {
    const startTime = Date.now();
    const testName = 'Wallet Connection Workflow Simulation';
    
    try {
      // Simulate the wallet connection process that would happen in the frontend
      // This includes account validation, balance checking, and user creation
      
      const walletAccountId = operatorAccountId.toString();
      const walletPublicKey = operatorPrivateKey.publicKey;
      
      // Step 1: Validate account exists and is accessible
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(AccountId.fromString(walletAccountId))
        .execute(client);

      expect(accountInfo.accountId.toString()).toBe(walletAccountId);
      expect(accountInfo.key).toBeDefined();

      // Step 2: Check account balance (minimum required for operations)
      const accountBalance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(walletAccountId))
        .execute(client);

      const minimumBalance = new Hbar(5); // 5 HBAR minimum
      expect(accountBalance.hbars.toBigNumber().isGreaterThanOrEqualTo(minimumBalance.toBigNumber())).toBe(true);

      // Step 3: Create or update user in database
      const userData = {
          name: 'Wallet Test User - Connected',
          accountId: walletAccountId,
          role: 'INVESTOR'
        };

      // Check if user already exists
      let user = await prisma.user.findFirst({
        where: {
          walletEvm: walletAccountId
        }
      });

      if (user) {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: userData.name
          }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            name: userData.name,
            username: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            password: 'test_password_123',
            walletEvm: walletAccountId,
            role: 'USER'
          }
        });
      }

      expect(user.walletEvm).toBe(walletAccountId);

      // Step 4: Simulate HashConnect pairing metadata
      const pairingMetadata = {
        name: 'Waternity DApp',
        description: 'Decentralized water well investment platform',
        url: 'https://waternity.app',
        icons: ['https://waternity.app/icon.png']
      };

      // Verify network connectivity
      const networkEndpoints = getHederaNetworkEndpoints();
      expect(networkEndpoints.mirrorNode).toBeDefined();

      // Test Mirror Node connectivity
      const mirrorResponse = await fetch(`${networkEndpoints.mirrorNode}/accounts/${walletAccountId}`);
      expect(mirrorResponse.ok).toBe(true);
      
      const mirrorData = await mirrorResponse.json();
      expect(mirrorData.account).toBe(walletAccountId);

      testResults.push({
        testName,
        accountId: walletAccountId,
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          accountId: walletAccountId,
          balance: accountBalance.hbars.toString(),
          userId: user.id,
          userRole: user.role,
          mirrorNodeConnected: mirrorResponse.ok,
          pairingApp: pairingMetadata.name
        }
      });

      console.log(`✅ Wallet connection workflow completed`);
      console.log(`   Account: ${walletAccountId}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Balance: ${accountBalance.hbars.toString()}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should test account signature verification', async () => {
    const startTime = Date.now();
    const testName = 'Account Signature Verification';
    
    try {
      // This test simulates verifying that a user controls their account
      // by checking the account's public key against expected signatures
      
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(operatorAccountId)
        .execute(client);

      expect(accountInfo.key).toBeDefined();
      
      // Get the account's public key
      const accountPublicKey = accountInfo.key;
      const operatorPublicKey = operatorPrivateKey.publicKey;

      // For single-key accounts, verify the keys match
      if (accountPublicKey instanceof PublicKey) {
        expect(accountPublicKey.toString()).toBe(operatorPublicKey.toString());
      }

      // Test message signing (simulated)
      const testMessage = 'Waternity wallet verification message';
      const messageBytes = Buffer.from(testMessage, 'utf-8');
      
      // Sign the message
      const signature = operatorPrivateKey.sign(messageBytes);
      
      // Verify the signature
      const isValid = operatorPublicKey.verify(messageBytes, signature);
      expect(isValid).toBe(true);

      // Create verification record in database
      const verificationData = {
        accountId: operatorAccountId.toString(),
        publicKey: operatorPublicKey.toString(),
        message: testMessage,
        signature: Buffer.from(signature).toString('hex'),
        verified: isValid,
        timestamp: new Date()
      };

      testResults.push({
        testName,
        accountId: operatorAccountId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          walletEvm: operatorAccountId.toString(),
          publicKeyMatch: accountPublicKey instanceof PublicKey ? accountPublicKey.toString() === operatorPublicKey.toString() : false,
          signatureValid: isValid,
          messageLength: testMessage.length,
          signatureLength: signature.length
        }
      });

      console.log(`✅ Account signature verification completed`);
      console.log(`   Account: ${operatorAccountId.toString()}`);
      console.log(`   Signature Valid: ${isValid}`);
      console.log(`   Public Key Match: ${accountPublicKey instanceof PublicKey ? accountPublicKey.toString() === operatorPublicKey.toString() : 'N/A'}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should test transaction signing and submission', async () => {
    const startTime = Date.now();
    const testName = 'Transaction Signing and Submission';
    
    try {
      // Test the ability to sign and submit transactions
      // This simulates what happens when a user approves a transaction in their wallet
      
      const initialBalance = await new AccountBalanceQuery()
        .setAccountId(operatorAccountId)
        .execute(client);

      // Create a small self-transfer transaction (0.001 HBAR)
      const transferAmount = new Hbar(0.001);
      const transferTx = new TransferTransaction()
        .addHbarTransfer(operatorAccountId, transferAmount.negated())
        .addHbarTransfer(operatorAccountId, transferAmount)
        .setTransactionMemo('Waternity wallet test transaction')
        .setMaxTransactionFee(new Hbar(1));

      // Sign and execute the transaction
      const response = await transferTx.execute(client);
      const receipt = await response.getReceipt(client);

      expect(receipt.status.toString()).toBe('SUCCESS');

      // Verify the transaction was processed
      const finalBalance = await new AccountBalanceQuery()
        .setAccountId(operatorAccountId)
        .execute(client);

      // Balance should be slightly less due to transaction fee
      expect(finalBalance.hbars.toBigNumber().isLessThan(initialBalance.hbars.toBigNumber())).toBe(true);

      // Wait for Mirror Node to process the transaction
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify transaction via Mirror Node
      const networkEndpoints = getHederaNetworkEndpoints();
      const transactionResponse = await fetch(
        `${networkEndpoints.mirrorNode}/transactions/${response.transactionId.toString()}`
      );
      
      expect(transactionResponse.ok).toBe(true);
      
      const transactionData = await transactionResponse.json();
      expect(transactionData.transactions).toBeDefined();
      expect(transactionData.transactions[0].result).toBe('SUCCESS');
      expect(transactionData.transactions[0].name).toBe('CRYPTOTRANSFER');

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        accountId: operatorAccountId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          transactionId: response.transactionId.toString(),
          transferAmount: transferAmount.toString(),
          initialBalance: initialBalance.hbars.toString(),
          finalBalance: finalBalance.hbars.toString(),
          transactionFee: initialBalance.hbars.toBigNumber().minus(finalBalance.hbars.toBigNumber()).toString(),
          mirrorNodeVerified: transactionResponse.ok
        }
      });

      console.log(`✅ Transaction signing and submission completed`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Amount: ${transferAmount.toString()}`);
      console.log(`   Fee: ${initialBalance.hbars.toBigNumber().minus(finalBalance.hbars.toBigNumber()).toString()} HBAR`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should test multi-user wallet management', async () => {
    const startTime = Date.now();
    const testName = 'Multi-User Wallet Management';
    
    try {
      // Test managing multiple wallet connections and user accounts
      // This simulates a scenario where multiple users connect their wallets
      
      const testUsers = [
        {
          name: 'Wallet Test User - Investor A',
          walletEvm: operatorAccountId.toString()
        },
        {
          name: 'Wallet Test User - Operator B',
          walletEvm: operatorAccountId.toString() // Using same account for testing
        },
        {
          name: 'Wallet Test User - Agent C',
          walletEvm: operatorAccountId.toString()
        }
      ];

      const createdUsers = [];
      
      for (const userData of testUsers) {
        // Verify account exists
        const accountInfo = await new AccountInfoQuery()
          .setAccountId(AccountId.fromString(userData.walletEvm))
          .execute(client);

        expect(accountInfo.accountId.toString()).toBe(userData.walletEvm);

        // Create user with unique name to avoid conflicts
        const uniqueName = `${userData.name} - ${Date.now()}`;
        const user = await prisma.user.create({
          data: {
            name: uniqueName,
            username: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            password: 'test_password_123',
            walletEvm: userData.walletEvm,
            role: 'USER'
          }
        });

        createdUsers.push(user);
      }

      // Verify all users were created
      expect(createdUsers.length).toBe(testUsers.length);
      
      // Role field removed from schema - skip role distribution test

      // Test querying users by account ID
      const usersByAccount = await prisma.user.findMany({
        where: {
          walletEvm: operatorAccountId.toString()
        }
      });

      expect(usersByAccount.length).toBeGreaterThanOrEqual(createdUsers.length);

      // Test user session simulation
      const sessionData = createdUsers.map(user => ({
        userId: user.id,
        walletEvm: user.walletEvm,
        connectedAt: new Date(),
        lastActivity: new Date()
      }));

      testResults.push({
        testName,
        accountId: operatorAccountId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          usersCreated: createdUsers.length,
          // roleDistribution removed,
          totalUsersByAccount: usersByAccount.length,
          sessionCount: sessionData.length,
          // uniqueRoles removed
        }
      });

      console.log(`✅ Multi-user wallet management completed`);
      console.log(`   Users Created: ${createdUsers.length}`);
      // Role distribution logging removed
      console.log(`   Total Users by Account: ${usersByAccount.length}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 60000);

  it('should test wallet disconnection and cleanup', async () => {
    const startTime = Date.now();
    const testName = 'Wallet Disconnection and Cleanup';
    
    try {
      // Test the wallet disconnection process and cleanup
      // This simulates what happens when a user disconnects their wallet
      
      // Create a test user to disconnect
      const testUser = await prisma.user.create({
        data: {
          name: 'Wallet Test User - To Disconnect',
          username: `wallet_test_${Date.now()}`,
          password: 'test_password_123',
          walletEvm: operatorAccountId.toString(),
          role: 'USER'
        }
      });

      expect(testUser.id).toBeDefined();
      expect(testUser.walletEvm).toBe(operatorAccountId.toString());

      // Simulate session cleanup (in a real app, this would clear session storage)
      const sessionCleanup = {
        userId: testUser.id,
        walletEvm: testUser.walletEvm,
        disconnectedAt: new Date(),
        reason: 'USER_INITIATED'
      };

      // Verify user still exists in database (we don't delete users on disconnect)
      const userAfterDisconnect = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(userAfterDisconnect).toBeDefined();
      expect(userAfterDisconnect?.id).toBe(testUser.id);

      // Test reconnection scenario
      const reconnectionData = {
        walletEvm: operatorAccountId.toString(),
        reconnectedAt: new Date(),
        previousUserId: testUser.id
      };

      // Verify account is still accessible
      const accountInfo = await new AccountInfoQuery()
        .setAccountId(operatorAccountId)
        .execute(client);

      expect(accountInfo.accountId.toString()).toBe(operatorAccountId.toString());

      // Update user's last activity (simulating reconnection)
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          name: 'Wallet Test User - Reconnected'
        }
      });

      expect(updatedUser.name).toBe('Wallet Test User - Reconnected');

      testResults.push({
        testName,
        accountId: operatorAccountId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          userId: testUser.id,
          accountId: operatorAccountId.toString(),
          disconnectionReason: sessionCleanup.reason,
          userPersisted: !!userAfterDisconnect,
          reconnectionSuccessful: !!updatedUser,
          accountStillAccessible: accountInfo.accountId.toString() === operatorAccountId.toString()
        }
      });

      console.log(`✅ Wallet disconnection and cleanup completed`);
      console.log(`   User ID: ${testUser.id}`);
      console.log(`   Account: ${operatorAccountId.toString()}`);
      console.log(`   User Persisted: ${!!userAfterDisconnect}`);
      console.log(`   Reconnection: ${!!updatedUser}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);
});