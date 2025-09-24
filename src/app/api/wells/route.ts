import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withSchemaAndIdempotency } from '@/lib/validator/withSchemaAndIdempotency';
import wellCreateSchema from '@/lib/validator/schemas/well_create.schema.json';
import { requireOperator } from '@/lib/auth/roles';
import { Role } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const operatorId = searchParams.get('operatorId');
    
    const skip = (page - 1) * limit;
    
    const where = operatorId ? { operatorUserId: operatorId } : {};
    
    const [wells, total] = await Promise.all([
      prisma.well.findMany({
        where,
        skip,
        take: limit,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.well.count({ where })
    ]);
    
    return NextResponse.json({
      wells,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching wells:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch wells'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: NextRequest) {
  return withSchemaAndIdempotency(wellCreateSchema, createWellHandler)(request);
}



async function createWellHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  try {
    // Require OPERATOR role for well creation
    const user = await requireOperator(req);
    
    const { code, name, location, topicId, operatorUserId, tokenId } = body;

    // Check if operator exists
    const operator = await prisma.user.findUnique({
      where: { id: operatorUserId }
    });

    if (!operator) {
      return new Response(JSON.stringify({
        error: 'Operator user not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if well code is unique
    const existingWell = await prisma.well.findFirst({
      where: { code }
    });

    if (existingWell) {
      return new Response(JSON.stringify({
        error: 'Well code already exists'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const well = await prisma.well.create({
      data: { code, name, location, topicId, operatorUserId, tokenId },
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

    return new Response(JSON.stringify(well), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating well:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create well'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}