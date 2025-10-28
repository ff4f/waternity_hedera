import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withSchemaAndIdempotency } from '@/lib/validator/withSchemaAndIdempotency';
import wellCreateSchema from '@/lib/validator/schemas/well_create.schema.json';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';
import { isValidTopicId } from '@/lib/hedera/ids';

export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    // Public read access - no authentication required
    
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
        select: {
          id: true,
          code: true,
          name: true,
          location: true,
          status: true,
          topicId: true,
          tokenId: true,
          operatorUserId: true,
          createdAt: true,
          operator: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              events: true,
              settlements: true,
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
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
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
    console.log('[WELLS] POST /api/wells - Creating new well');
    
    // Require OPERATOR role for well creation
    const user = await requireUser(req);
    assertRole(user, 'OPERATOR', 'ADMIN');
    
    const { code, name, location, topicId, operatorUserId, tokenId } = body;

    // Validate topicId format
    if (!isValidTopicId(topicId)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_topic_id',
          details: [`Invalid topicId format: ${topicId}. Expected format: x.y.z (e.g., 0.0.123)`]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if operator exists
    const operator = await prisma.user.findUnique({
      where: { id: operatorUserId },
      select: {
            id: true,
            name: true
          }
    });

    if (!operator) {
      console.log('[WELLS] Operator not found:', operatorUserId);
      return new Response(JSON.stringify({ error: 'Operator user not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if well code is unique
    const existingWell = await prisma.well.findFirst({
      where: { code }
    });

    if (existingWell) {
      console.log('[WELLS] Well code already exists:', code);
      return new Response(JSON.stringify({ error: 'Well code already exists' }), {
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
            name: true
          }
        }
      }
    });

    console.log('[WELLS] Well created successfully:', well.id, 'code:', code);
    
    return new Response(JSON.stringify({
      success: true,
      well
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[WELLS] Error creating well:', error);
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    return new Response(JSON.stringify({ error: 'Failed to create well' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}