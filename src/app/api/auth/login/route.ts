import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '../../../../lib/auth/session';
import { Role } from '../../../../lib/types';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { withSchemaAndIdempotency } from '@/lib/validator/withSchemaAndIdempotency';
import authLoginSchema from '@/lib/validator/schemas/auth_login.schema.json';

interface LoginRequest {
  username: string;
  password: string;
}

async function loginHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  try {
    const { username, password } = body;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'invalid_credentials', 
        message: 'Invalid username or password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return new Response(JSON.stringify({
        error: 'invalid_credentials', 
        message: 'Invalid username or password'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create response with user data
    const userData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    };

    const response = NextResponse.json(userData);

    // Set session cookie
    await setSessionCookie(response, {
      sub: user.id,
      name: user.name,
      role: user.role as Role,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(JSON.stringify({
      error: 'internal_error', 
      message: 'An internal error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: NextRequest) {
  return withSchemaAndIdempotency(authLoginSchema, loginHandler)(request);
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