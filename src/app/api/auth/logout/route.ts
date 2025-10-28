import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../lib/auth/session';
import { serverError, methodNotAllowed } from '@/lib/http/errors';

interface LogoutResponse {
  success: boolean;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[AUTH] POST /api/auth/logout - Logout initiated');
    
    // Create response with success message
    const responseData: LogoutResponse = {
      success: true,
      message: 'Successfully logged out',
    };

    // Create response and clear session cookie
    const response = NextResponse.json(responseData, { status: 200 });
    clearSessionCookie(response);
    
    console.log('[AUTH] Logout successful');
    return response;
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during logout' }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  console.log('[AUTH] GET /api/auth/logout - Method not allowed');
  return methodNotAllowed('GET method not supported for logout endpoint');
}

export async function PUT(): Promise<NextResponse> {
  console.log('[AUTH] PUT /api/auth/logout - Method not allowed');
  return methodNotAllowed('PUT method not supported for logout endpoint');
}

export async function DELETE(): Promise<NextResponse> {
  console.log('[AUTH] DELETE /api/auth/logout - Method not allowed');
  return methodNotAllowed('DELETE method not supported for logout endpoint');
}