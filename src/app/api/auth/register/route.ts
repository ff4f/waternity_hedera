import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Role } from '../../../../lib/types';
import bcrypt from 'bcryptjs';
import { withSchemaAndIdempotency } from '@/lib/validator/withSchemaAndIdempotency';
import authRegisterSchema from '@/lib/validator/schemas/auth_register.schema.json';



interface RegisterRequest {
  name: string;
  username: string;
  password: string;
  role?: string;
  walletEvm?: string;
  accountId?: string;
}

async function registerHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  try {
    const { name, accountId, publicKey, role } = body;
    
    // Generate username from accountId
    const username = accountId || `user_${Date.now()}`;
    const password = publicKey; // Use publicKey as password for now

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return new Response(JSON.stringify({
        error: 'User already exists'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        accountId,
        role: role as Role
      }
    });

    return new Response(JSON.stringify({
      id: user.id,
      name: user.name,
      accountId: user.accountId,
      role: user.role
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create user'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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