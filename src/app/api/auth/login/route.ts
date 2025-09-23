import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '../../../../lib/auth/session';
import { Role } from '../../../../lib/types';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    // Validate request body
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: body.username }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(body.password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });

    // Set session cookie
    await setSessionCookie(response, {
      sub: user.id,
      name: user.name,
      role: user.role,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'internal_error', message: 'An internal error occurred' },
      { status: 500 }
    );
  }
}

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