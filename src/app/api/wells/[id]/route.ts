import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateWellSchema = z.object({
  code: z.string().min(1, 'Well code is required').optional(),
  name: z.string().min(1, 'Well name is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  topicId: z.string().min(1, 'Topic ID is required').optional(),
  operatorUserId: z.string().min(1, 'Operator user ID is required').optional(),
  tokenId: z.string().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const well = await prisma.well.findUnique({
      where: { id: params.id },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        events: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        settlements: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            payouts: true
          }
        },
        tokens: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            events: true,
            settlements: true,
            memberships: true
          }
        }
      }
    });

    if (!well) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(well);
  } catch (error) {
    console.error('Error fetching well:', error);
    return NextResponse.json(
      { error: 'Failed to fetch well' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const body = await request.json();
    const validatedData = updateWellSchema.parse(body);

    // Check if well exists
    const existingWell = await prisma.well.findUnique({
      where: { id: params.id }
    });

    if (!existingWell) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    // If updating operator, check if new operator exists
    if (validatedData.operatorUserId) {
      const operator = await prisma.user.findUnique({
        where: { id: validatedData.operatorUserId }
      });

      if (!operator) {
        return NextResponse.json(
          { error: 'Operator user not found' },
          { status: 404 }
        );
      }
    }

    // If updating code, check uniqueness
    if (validatedData.code && validatedData.code !== existingWell.code) {
      const codeExists = await prisma.well.findFirst({
        where: {
          code: validatedData.code,
          id: { not: params.id }
        }
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Well code already exists' },
          { status: 409 }
        );
      }
    }

    const updatedWell = await prisma.well.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        operator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedWell);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating well:', error);
    return NextResponse.json(
      { error: 'Failed to update well' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Check if well exists
    const existingWell = await prisma.well.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            events: true,
            settlements: true,
            memberships: true
          }
        }
      }
    });

    if (!existingWell) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    // Check if well has dependencies
    const hasData = existingWell._count.events > 0 || 
                   existingWell._count.settlements > 0 || 
                   existingWell._count.memberships > 0;

    if (hasData) {
      return NextResponse.json(
        { 
          error: 'Cannot delete well with existing data',
          details: {
            events: existingWell._count.events,
            settlements: existingWell._count.settlements,
            memberships: existingWell._count.memberships
          }
        },
        { status: 409 }
      );
    }

    await prisma.well.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Well deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting well:', error);
    return NextResponse.json(
      { error: 'Failed to delete well' },
      { status: 500 }
    );
  }
}