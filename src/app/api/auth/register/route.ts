import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Role } from '../../../../lib/types';
import bcrypt from 'bcryptjs';
import { withSchemaAndIdempotency } from '@/lib/validator/withSchemaAndIdempotency';
import authRegisterSchema from '@/lib/validator/schemas/auth_register_traditional.schema.json';

import { provisionHederaAccount, ensureMinimumHbarBalance, autoRefillNewTestnetAccount } from '@/lib/hedera/client';



interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  roleId?: string;
  walletEvm?: string;
  hederaAccountId?: string;
}

async function registerHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  console.log('[AUTH] POST /api/auth/register - User registration attempt');
  
  try {
    const { name, email, password, roleId, walletEvm, hederaAccountId } = body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User registration failed - user already exists:', { email });
      return new Response(JSON.stringify({ error: 'User already exists', message: 'A user with this email already exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate role
    const validRole = await prisma.role.findUnique({
      where: { name: roleId || 'USER' }
    });

    if (!validRole) {
      console.log('User registration failed - invalid role:', { role: roleId || 'USER' });
      return new Response(JSON.stringify({ error: 'Invalid role', message: 'The specified role does not exist' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Auto-provision Hedera account if none provided
    let finalAccountId = hederaAccountId || null;
    let hbarToppedUp = false;
    let finalBalance: string | null = null;
    let isNewAccount = false;
    
    try {
      if (!finalAccountId) {
        finalAccountId = await provisionHederaAccount();
        isNewAccount = true;
        console.log('[AUTH] Hedera account provisioned at register:', finalAccountId);
      }
      
      // Handle HBAR balance for newly created vs provided accounts
      if (finalAccountId) {
        if (isNewAccount) {
          // Use aggressive auto-refill for newly created testnet accounts
          const refillResult = await autoRefillNewTestnetAccount(finalAccountId);
          hbarToppedUp = refillResult.success;
          finalBalance = refillResult.balance.toString();
          console.log('[AUTH] New account auto-refill:', { 
            accountId: finalAccountId, 
            success: refillResult.success, 
            balance: finalBalance,
            transactionId: refillResult.transactionId
          });
        } else {
          // Use standard balance check for provided accounts
          const balanceResult = await ensureMinimumHbarBalance(finalAccountId);
          hbarToppedUp = balanceResult.toppedUp;
          finalBalance = balanceResult.currentBalance.toString();
          console.log('[AUTH] Existing account balance check:', { 
            accountId: finalAccountId, 
            toppedUp: hbarToppedUp, 
            balance: finalBalance 
          });
        }
      }
    } catch (e) {
      console.error('[AUTH] Failed to provision/top-up Hedera account during register:', e);
      // Continue without failing registration; hedera account can be provisioned on login
    }

    // Create user
    console.log('Creating new user:', { email, name, role: validRole.name });
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        salt,
        walletEvm: walletEvm || finalAccountId || null,
        hederaAccountId: finalAccountId,
        roleId: validRole.id
      },
      include: { role: true }
    });

    console.log('User registration successful:', {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      hederaAccountId: user.hederaAccountId,
      hbarToppedUp,
      hbarBalance: finalBalance
    });
    
    return new Response(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      hederaAccountId: user.hederaAccountId,
      walletEvm: user.walletEvm,
      role: user.role,
      hbarToppedUp,
      hbarBalance: finalBalance
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(request: NextRequest) {
  return withSchemaAndIdempotency(authRegisterSchema, registerHandler)(request);
}

// POST_OLD function removed - invalid export for Next.js routes

// Handle unsupported methods
export async function GET() {
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