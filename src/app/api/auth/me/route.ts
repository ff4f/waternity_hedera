import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '../../../../lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Get user session from cookie
    const user = await getSessionFromCookie();

    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return user profile (excluding sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user.sub,
        name: user.name,
        role: user.role,
        issuedAt: user.iat,
        expiresAt: user.exp,
      },
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    
    return NextResponse.json(
      { error: 'internal_error', message: 'An internal error occurred' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
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