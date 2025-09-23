import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createWellSchema = z.object({
  code: z.string().min(1, 'Well code is required'),
  name: z.string().min(1, 'Well name is required'),
  location: z.string().min(1, 'Location is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  operatorUserId: z.string().min(1, 'Operator user ID is required'),
  tokenId: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = operatorId ? { operatorUserId: operatorId } : {};

    const wells = await prisma.well.findMany({
      where,
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            accountId: true
          }
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                accountId: true
              }
            }
          }
        },
        _count: {
          select: {
            events: true,
            settlements: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.well.count({ where });

    return NextResponse.json({
      wells,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching wells:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wells' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createWellSchema.parse(body);

    // Check if operator exists
    const operator = await prisma.user.findUnique({
      where: { id: validatedData.operatorUserId }
    });

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator user not found' },
        { status: 404 }
      );
    }

    // Check if well code is unique
    const existingWell = await prisma.well.findFirst({
      where: { code: validatedData.code }
    });

    if (existingWell) {
      return NextResponse.json(
        { error: 'Well code already exists' },
        { status: 409 }
      );
    }

    const well = await prisma.well.create({
      data: validatedData,
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            accountId: true
          }
        }
      }
    });

    return NextResponse.json(well, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating well:', error);
    return NextResponse.json(
      { error: 'Failed to create well' },
      { status: 500 }
    );
  }
}