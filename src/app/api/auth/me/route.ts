import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth/session';
import { requireUser } from '../../../../lib/auth/roles';
import { methodNotAllowed } from '@/lib/http/errors';
import { getHbarBalance } from '@/lib/hedera/client';

export const runtime = 'nodejs';

interface MeResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: {
      id: string;
      name: string;
    };
    hederaAccountId: string | null;
    hbarBalance?: string | null;
    createdAt: Date;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[AUTH] GET /api/auth/me - User info request');
    
    // Get authenticated user from request
    const user = await getUserFromRequest(request);
    
    // Check if user is authenticated
    if (!user) {
      console.log('[AUTH] User info request failed - not authenticated');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Optionally fetch HBAR balance if hederaAccountId exists
    let hbarBalance: string | null = null;
    try {
      if (user.hederaAccountId) {
        const bal = await getHbarBalance(user.hederaAccountId);
        hbarBalance = bal.toString();
      }
    } catch (e) {
      console.warn('[AUTH] Failed to fetch HBAR balance in /me:', e);
    }

    console.log('[AUTH] User info request successful for user:', user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        hederaAccountId: user.hederaAccountId,
        hbarBalance,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[AUTH] Error fetching user data:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching user data' }, { status: 500 });
  }
}

export async function POST(): Promise<NextResponse> {
  console.log('[AUTH] POST /api/auth/me - Method not allowed');
  return methodNotAllowed('POST method not supported for user info endpoint');
}

export async function PUT(): Promise<NextResponse> {
  console.log('[AUTH] PUT /api/auth/me - Method not allowed');
  return methodNotAllowed('PUT method not supported for user info endpoint');
}

export async function DELETE(): Promise<NextResponse> {
  console.log('[AUTH] DELETE /api/auth/me - Method not allowed');
  return methodNotAllowed('DELETE method not supported for user info endpoint');
}