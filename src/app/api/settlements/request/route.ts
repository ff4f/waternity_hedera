/**
 * Settlement Request API Route
 * POST /api/settlements/request
 * 
 * Initiates a settlement request for a well's revenue distribution
 * Requires OPERATOR or ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db/prisma';
import { publishEvent } from '../../../../lib/hedera/hcs';
import { isValidTopicId } from '../../../../lib/hedera/ids';
import { withSchemaAndIdempotency } from '../../../../lib/validator/withSchemaAndIdempotency';
import { calculateSettlement, validateSettlement } from '../../../../lib/settlement/calc';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '../../../../lib/auth/roles';
import { rateLimit, createUserKey } from '@/lib/http/rateLimit';
import { logger } from '../../../../lib/log';
// JSON Schema for settlement request
const settlementRequestSchema = {
  type: 'object',
  properties: {
    messageId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    wellId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    periodStart: {
      type: 'string',
      format: 'date-time'
    },
    periodEnd: {
      type: 'string',
      format: 'date-time'
    },
    grossRevenue: {
      type: 'number',
      minimum: 0
    },
    kwhTotal: {
      type: 'number',
      minimum: 0
    },
    operatorNotes: {
      type: 'string',
      maxLength: 1000
    },
    assetType: {
      type: 'string',
      enum: ['HBAR', 'TOKEN']
    },
    tokenId: {
      type: 'string',
      pattern: '^0\.0\.[0-9]+$'
    }
  },
  required: ['messageId', 'wellId', 'periodStart', 'periodEnd', 'grossRevenue', 'kwhTotal', 'assetType'],
  additionalProperties: false
};

interface SettlementRequestBody {
  messageId: string;
  wellId: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  grossRevenue: number;
  kwhTotal: number;
  operatorNotes?: string;
  assetType: 'HBAR' | 'TOKEN';
  tokenId?: string;
}

async function settlementRequestHandler(
  req: NextRequest,
  res: any,
  body: SettlementRequestBody
): Promise<Response> {
  try {
    // Authentication and authorizationuser
    const user = await requireUser(req);
    assertRole(user, 'OPERATOR', 'ADMIN');
    
    // Rate limiting: 30 requests per 5 minutes per user
    try {
      const rateLimitKey = createUserKey(user.id, 'settlements-request');
      await rateLimit({
        key: rateLimitKey,
        limit: 30,
        windowMs: 300000 // 5 minutes in milliseconds
      });
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED') {
        return new Response(
          JSON.stringify({ 
            error: 'rate_limit_exceeded', 
            details: ['Too many settlement request submissions. Please try again later.'],
            retryAfter: error.details.retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': error.details.retryAfter.toString()
            } 
          }
        );
      }
      throw error;
    }
    
    const {
      messageId,
      wellId,
      periodStart,
      periodEnd,
      grossRevenue,
      kwhTotal,
      operatorNotes,
      assetType,
      tokenId
    } = body;

    // Validate dates
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    if (startDate >= endDate) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          details: ['Period start date must be before end date']
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if well exists
    const well = await prisma.well.findUnique({
      where: { id: wellId },
      include: {
        memberships: {
          include: {
            user: true
          }
        }
      }
    });

    if (!well) {
      return new Response(
        JSON.stringify({
          error: 'not_found',
          details: ['Well not found']
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate topicId
    if (!isValidTopicId(well.topicId)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_topic_id',
          details: [`Invalid topicId format: ${well.topicId}. Expected format: x.y.z (e.g., 0.0.123)`]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for overlapping settlement periods
    const overlappingSettlement = await prisma.settlement.findFirst({
      where: {
        wellId,
        OR: [
          {
            AND: [
              { periodStart: { lte: startDate } },
              { periodEnd: { gt: startDate } }
            ]
          },
          {
            AND: [
              { periodStart: { lt: endDate } },
              { periodEnd: { gte: endDate } }
            ]
          },
          {
            AND: [
              { periodStart: { gte: startDate } },
              { periodEnd: { lte: endDate } }
            ]
          }
        ],
        status: {
           in: ['PENDING', 'APPROVED', 'EXECUTED']
         }
      }
    });

    if (overlappingSettlement) {
      return new Response(
        JSON.stringify({
          error: 'conflict',
          details: ['Settlement period overlaps with existing settlement'],
          conflictingSettlement: {
            id: overlappingSettlement.id,
            periodStart: overlappingSettlement.periodStart,
            periodEnd: overlappingSettlement.periodEnd,
            status: overlappingSettlement.status
          }
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate settlement distribution
    const recipients = well.memberships
      .filter(membership => membership.shareBps && membership.shareBps > 0)
      .map((membership, index) => ({
        id: `investor-${index}`,
        address: membership.user.hederaAccountId || '',
        percentage: (membership.shareBps || 0) / 100, // Convert basis points to percentage
        role: 'INVESTOR' as const
      }));

    // Add platform fee recipient (5%)
    recipients.push({
      id: 'platform-fee',
      address: process.env.PLATFORM_FEE_ACCOUNT || '0.0.123456',
      percentage: 5.0,
      role: 'INVESTOR' as const
    });

    const settlement = calculateSettlement(grossRevenue, recipients);
    
    // Validate settlement calculation
    const validation = validateSettlement(settlement);
    if (!validation) {
      return new Response(
        JSON.stringify({
          error: 'calculation_error',
          details: ['Settlement calculation validation failed']
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create settlement record in database
    const newSettlement = await prisma.settlement.create({
      data: {
        wellId,
        periodStart: startDate,
        periodEnd: endDate,
        grossRevenue,
        kwhTotal,
        status: 'PENDING'
      },
      include: {
         well: {
           include: {
             memberships: {
               include: {
                 user: true
               }
             }
           }
         }
       }
    });

    // Submit to HCS
    await publishEvent({
      topicId: well.topicId,
      messageId,
      messageJson: {
        type: 'SETTLEMENT_REQUESTED',
        wellId,
        emittedBy: 'OPERATOR',
        version: 1,
        payload: {
          settlementId: newSettlement.id,
          periodStart,
          periodEnd,
          grossRevenue,
          kwhTotal,
          assetType,
          tokenId,
          requestedBy: user.id,
          operatorNotes,
          recipientCount: settlement.recipients.length,
          totalDistribution: settlement.totalPayout,
          timestamp: new Date().toISOString()
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        settlement: {
          id: newSettlement.id,
          wellId: newSettlement.wellId,
          periodStart: newSettlement.periodStart,
          periodEnd: newSettlement.periodEnd,
          grossRevenue: newSettlement.grossRevenue,
          kwhTotal: newSettlement.kwhTotal,
          status: newSettlement.status,
          assetType,
           tokenId,
           operatorNotes,
          createdAt: newSettlement.createdAt
        },
        messageId
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Settlement request failed', {
      messageId: body.messageId,
      wellId: body.wellId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }

    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        details: ['An unexpected error occurred']
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Export the POST handler with schema validation and idempotency
async function POST(req: NextRequest) {
  try {
    return await withSchemaAndIdempotency(
      settlementRequestSchema,
      settlementRequestHandler
    )(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('Settlement request POST failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Failed to create settlement request' }, { status: 500 });
  }
}

export { POST };