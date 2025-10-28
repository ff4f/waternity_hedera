import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db/prisma';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '../../../../lib/auth/roles';
import { withSchemaAndIdempotency } from "../../../../lib/validator/withSchemaAndIdempotency";
import { v4 as uuidv4 } from 'uuid';
import { TopicMessageSubmitTransaction, TopicId, Hbar } from '@hashgraph/sdk';
import { createHederaClient } from "../../../../lib/hedera/client";
import { publishEvent } from "../../../../lib/hedera/hcs";
import { isValidTopicId } from "../../../../lib/hedera/ids";
import { rateLimit, createUserKey } from '@/lib/http/rateLimit';
import { logger } from '../../../../lib/log';

// JSON Schema for settlement cancellation
const cancelSettlementSchema = {
  type: 'object',
  properties: {
    settlementId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    cancellationReason: {
      type: 'string',
      minLength: 1,
      maxLength: 1000
    },
    operatorNotes: {
      type: 'string',
      maxLength: 1000
    }
  },
  required: ['settlementId', 'cancellationReason'],
  additionalProperties: false
};

interface CancelSettlementRequest {
  settlementId: string;
  cancellationReason: string;
  operatorNotes?: string;
}

async function handleCancelSettlement(
  request: NextRequest,
  res: any,
  body: CancelSettlementRequest
) {
  try {
    // Authentication and authorization
    const user = await requireUser(request);
    assertRole(user, 'OPERATOR', 'ADMIN');
    
    // Rate limiting: 30 requests per 5 minutes per user
    try {
      const rateLimitKey = createUserKey(user.id, 'settlements-cancel');
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
            details: ['Too many settlement cancellation requests. Please try again later.'],
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
    
    const { settlementId, cancellationReason, operatorNotes } = body;

    // Find the settlement
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        well: {
          include: {
            operator: true
          }
        }
      }
    });

    if (!settlement) {
      return new Response(
        JSON.stringify({
          error: 'settlement_not_found',
          details: ['Settlement not found']
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate topicId
    if (!isValidTopicId(settlement.well.topicId)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_topic_id',
          details: [`Invalid topicId format: ${settlement.well.topicId}. Expected format: x.y.z (e.g., 0.0.123)`]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if settlement is in correct state for cancellation
    if (!['REQUESTED', 'APPROVED'].includes(settlement.status)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_state',
          details: [`Settlement is in ${settlement.status} state, cannot cancel. Only REQUESTED or APPROVED settlements can be cancelled.`]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to cancel this settlement
    if (user.role?.name === 'OPERATOR' && settlement.well.operatorUserId !== user.id) {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          details: ['You can only cancel settlements for wells you operate']
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update settlement status to CANCELLED
    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellationReason,
        approveEventId: null,
        executeEventId: null
      },
      include: {
        well: true
      }
    });

    // Cancel any pending payouts
    await prisma.payout.updateMany({
      where: {
        settlementId,
        status: { in: ['PENDING', 'APPROVED'] }
      },
      data: {
        status: 'CANCELLED'
      }
    });

    // Submit to HCS
    const hcsResult = await publishEvent({
      topicId: settlement.well.topicId,
      messageJson: {
        eventType: 'settlement_cancellation',
        settlementId,
        cancelledBy: user.id,
        cancellationReason,
        operatorNotes,
        previousStatus: settlement.status,
        grossRevenue: settlement.grossRevenue,
        kwhTotal: settlement.kwhTotal,
        periodStart: settlement.periodStart?.toISOString(),
        periodEnd: settlement.periodEnd?.toISOString()
      }
    });

    // Record HCS event
    await prisma.hcsEvent.create({
      data: {
        messageId: hcsResult.messageId,
        wellId: settlement.wellId,
        type: 'settlement_cancellation',
        payloadJson: JSON.stringify({
          cancelledBy: user.id,
          cancellationReason,
          operatorNotes,
          previousStatus: settlement.status,
          timestamp: new Date().toISOString()
        })
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          settlementId: updatedSettlement.id,
          status: updatedSettlement.status,
          cancellationReason: cancellationReason,
          previousStatus: settlement.status,
          messageId: hcsResult.messageId
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    logger.error('Settlement cancellation failed', {
      requestId,
      settlementId: body.settlementId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return new Response(
          JSON.stringify({ error: 'unauthorized', details: ['Authentication required'] }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error.message.startsWith('FORBIDDEN:')) {
        return new Response(
          JSON.stringify({ error: 'forbidden', details: ['Insufficient permissions'] }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: 'internal_error',
        details: ['An unexpected error occurred']
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function POST(req: NextRequest) {
  try {
    return await withSchemaAndIdempotency(
      cancelSettlementSchema,
      handleCancelSettlement
    )(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('Settlement cancellation POST failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Failed to cancel settlement' }, { status: 500 });
  }
}

export { POST };