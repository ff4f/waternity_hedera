import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Role } from '../../../../lib/types';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['INVESTOR', 'OPERATOR', 'AGENT', 'ADMIN']).default('INVESTOR'),
  walletEvm: z.string().optional(),
  accountId: z.string().optional(),
});

interface RegisterRequest {
  name: string;
  username: string;
  password: string;
  role?: string;
  walletEvm?: string;
  accountId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    
    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'validation_error', 
          message: 'Invalid input data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { name, username, password, role, walletEvm, accountId } = validation.data;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'username_taken', message: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
        walletEvm,
        accountId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        walletEvm: true,
        accountId: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
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