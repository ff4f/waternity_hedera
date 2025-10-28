import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import { runSeed } from '../../../../prisma/seed';

/**
 * GET /api/health
 * Health check endpoint that verifies:
 * - Hedera environment variables and SDK readiness
 * - Database connectivity (Prisma)
 * Returns 200 with ok:false for missing env, or 503 for connectivity issues
 */
export async function GET(request: NextRequest) {
  console.log('[HEALTH] Health check initiated');
  
  // Auto-init database on first run (demo mode)
  try {
    const roles = await prisma.role.count();
    if (roles === 0) {
      console.log('[HEALTH] Empty DB detected. Running seed for demo...');
      await runSeed();
      console.log('[HEALTH] Seed completed');
    }
  } catch (e) {
    console.warn('[HEALTH] Seed check failed:', e);
  }
  
  // Check Hedera environment variables
  const hederaEnvVars = ['HEDERA_NETWORK', 'HEDERA_ACCOUNT_ID', 'HEDERA_PRIVATE_KEY'];
  const missingHederaVars = hederaEnvVars.filter(envVar => !process.env[envVar]);
  const hederaEnvValid = missingHederaVars.length === 0;
  
  // Determine network
  let network: 'testnet' | 'mainnet' | 'unknown' = 'unknown';
  if (process.env.HEDERA_NETWORK) {
    const networkValue = process.env.HEDERA_NETWORK.toLowerCase();
    if (networkValue === 'testnet' || networkValue === 'mainnet') {
      network = networkValue;
    }
  }
  
  // Test Hedera SDK readiness
  let sdkReady = false;
  if (hederaEnvValid) {
    try {
      // Validate account ID and private key format
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);
      
      // Create client to test SDK initialization
      const client = network === 'testnet' ? Client.forTestnet() : Client.forMainnet();
      client.setOperator(
        AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
        PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!)
      );
      client.close();
      
      sdkReady = true;
    } catch (error) {
      console.log('[HEALTH] Hedera SDK validation failed:', error instanceof Error ? error.message : 'Unknown error');
      sdkReady = false;
    }
  }
  
  // Test database connectivity
  let dbConnected = false;
  try {
    console.log('[HEALTH] Testing database connectivity');
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (error) {
    console.error('[HEALTH] Database connectivity failed:', error);
    dbConnected = false;
  }
  
  // Determine overall health status
  const overallOk = hederaEnvValid && sdkReady && dbConnected;
  
  const response = {
    ok: overallOk,
    hedera: {
      env: hederaEnvValid,
      network,
      sdkReady
    },
    db: {
      connected: dbConnected
    }
  };
  
  // Return 503 for connectivity issues, 200 for env issues
  if (!dbConnected) {
    console.log('[HEALTH] Health check failed - database connectivity issue');
    return NextResponse.json(response, { status: 503 });
  }
  
  if (!overallOk) {
    console.log('[HEALTH] Health check completed with issues - missing env or SDK not ready');
  } else {
    console.log('[HEALTH] Health check completed successfully');
  }
  
  return NextResponse.json(response, { status: 200 });
}

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}