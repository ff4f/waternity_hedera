import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { createSession, setSessionCookie } from '../../../../lib/auth/session';
import { rateLimit, createIpKey, getClientIp } from '../../../../lib/http/rateLimit';

import { provisionHederaAccount, ensureMinimumHbarBalance } from '@/lib/hedera/client';

export const runtime = 'nodejs';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    role: {
      id: string;
      name: string;
    };
    hederaAccountId: string | null;
    createdAt: Date;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[AUTH] POST /api/auth/login - Login attempt initiated');
    
    
    // Apply rate limiting: 10 requests per 5 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimitKey = createIpKey(clientIp, 'auth_login');
    
    try {
      await rateLimit({
        key: rateLimitKey,
        limit: 10,
        windowMs: 5 * 60 * 1000, // 5 minutes
      });
    } catch (rateLimitError: any) {
      console.log('[AUTH] Rate limit exceeded for IP:', clientIp);
      return NextResponse.json(
        { 
          error: 'rate_limited',
          message: 'Too many login attempts. Please try again later.',
          details: {
            retryAfter: rateLimitError.details?.retryAfter || 300
          }
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitError.details?.retryAfter || 300)
          }
        }
      );
    }
    
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      console.log('[AUTH] Login validation failed - missing email or password');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[AUTH] Login validation failed - invalid email format:', email);
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      console.log('[AUTH] Login failed - user not found for email:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      console.log('[AUTH] Login failed - invalid password for user:', user.id);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session token and set cookie
    const token = await createSession(user.id, user.email);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        hederaAccountId: user.hederaAccountId || null,
      },
    });
    setSessionCookie(response, token);

    // Auto-provision Hedera account if missing
    if (!user.hederaAccountId) {
      try {
        const newAccountId = await provisionHederaAccount();
        await prisma.user.update({
          where: { id: user.id },
          data: { hederaAccountId: newAccountId, walletEvm: newAccountId },
        });
        console.log('[AUTH] Hedera account provisioned for user:', user.id, newAccountId);

        // Ensure minimum HBAR balance for the new account
        try {
          const balanceResult = await ensureMinimumHbarBalance(newAccountId);
          console.log('[AUTH] Login HBAR top-up result:', { 
            accountId: newAccountId, 
            toppedUp: balanceResult.toppedUp, 
            balance: balanceResult.currentBalance.toString() 
          });
        } catch (topupError) {
          console.warn('[AUTH] Failed to ensure minimum HBAR balance at login:', topupError);
        }

        // Update response body after provisioning
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            role: user.role.name,
            hederaAccountId: newAccountId,
          },
        }, { headers: response.headers });
      } catch (e) {
        console.error('[AUTH] Failed to auto-provision Hedera account:', e);
        // Still return login success with session cookie
        return response;
      }
    } else if (user.hederaAccountId) {
      // Ensure minimum HBAR balance for existing account on login
      try {
        const balanceResult = await ensureMinimumHbarBalance(user.hederaAccountId);
        console.log('[AUTH] Login HBAR check/top-up for existing account:', { 
          accountId: user.hederaAccountId, 
          toppedUp: balanceResult.toppedUp, 
          balance: balanceResult.currentBalance.toString() 
        });
      } catch (topupError) {
        console.warn('[AUTH] Failed to ensure minimum HBAR balance for existing account at login:', topupError);
      }
    }

    console.log('[AUTH] Login successful for user:', user.id, 'email:', email);
    return response;
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login' }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'method_not_allowed',
      message: 'GET method not supported for login endpoint',
    },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'method_not_allowed',
      message: 'PUT method not supported for login endpoint',
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'method_not_allowed',
      message: 'DELETE method not supported for login endpoint',
    },
    { status: 405 }
  );
}