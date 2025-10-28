import { NextRequest } from 'next/server';
import { withSchemaAndIdempotency } from '../../../../lib/validator/withSchemaAndIdempotency';
import { requireUser, assertRole, createForbiddenResponse, createUnauthorizedResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';
import { prisma } from '../../../../lib/db/prisma';
import { publishEvent } from '../../../../lib/hedera/hcs';
import { isValidTopicId } from '../../../../lib/hedera/ids';
import { forbidden, notFound, conflict, serverError } from '@/lib/http/errors';
import { rateLimit, createUserKey } from '@/lib/http/rateLimit';
import { logger } from '../../../../lib/log';

// JSON Schema for settlement approval
const approveSettlementSchema = {
  type: 'object',
  properties: {
    settlementId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    operatorNotes: {
      type: 'string',
      maxLength: 1000
    },
    approved: {
      type: 'boolean'
    }
  },
  required: ['settlementId', 'approved'],
  additionalProperties: false
};

interface ApproveSettlementRequest {
  settlementId: string;
  operatorNotes?: string;
  approved: boolean;
}

async function handleApproveSettlement(
  request: NextRequest,
  res: any,
  body: ApproveSettlementRequest
) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  logger.info('Settlement approval started', {
    requestId,
    settlementId: body.settlementId,
    approved: body.approved
  });
  
  try {
    // Authentication and authorization
    const user = await requireUser(request);
    assertRole(user, 'OPERATOR', 'ADMIN');
    
    // Rate limiting: 30 requests per 5 minutes per user
    try {
      const rateLimitKey = createUserKey(user.id, 'settlements-approve');
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
            details: ['Too many settlement approval requests. Please try again later.'],
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
    
    const { settlementId, operatorNotes, approved } = body;

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
      logger.warn('Settlement not found', {
        requestId,
        settlementId
      });
      return new Response(JSON.stringify({ error: 'Settlement not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
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

    // Check if settlement is in correct state
    if (settlement.status !== 'REQUESTED') {
      logger.warn('Settlement not in correct state', {
        requestId,
        settlementId,
        currentStatus: settlement.status,
        expectedStatus: 'REQUESTED'
      });
      return new Response(JSON.stringify({ error: `Settlement is in ${settlement.status} state, cannot approve` }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if user has permission to approve this settlement
    if (user.role?.name === 'OPERATOR' && settlement.well.operatorUserId !== user.id) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions', message: 'You can only approve settlements for wells you operate' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    // Update settlement status
    logger.info('Updating settlement status', {
      requestId,
      settlementId,
      approved,
      newStatus
    });
     const updatedSettlement = await prisma.settlement.update({
       where: { id: settlementId },
       data: {
          status: newStatus,
          approveEventId: approved ? 'pending' : null
        },
       include: {
         well: true
       }
     });

    // Submit to HCS
    logger.info('Publishing approval event to HCS', {
      requestId,
      settlementId,
      topicId: settlement.well.topicId,
      approved
    });
     const hcsResult = await publishEvent({
       topicId: settlement.well.topicId,
       messageJson: {
         eventType: 'settlement_approval',
         settlementId,
         approved,
         approvedBy: user.id,
         operatorNotes,
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
          type: 'settlement_approval',
          payloadJson: JSON.stringify({
            approved,
            approvedBy: user.id,
            operatorNotes,
            timestamp: new Date().toISOString()
          })
        }
      });

    logger.info('Settlement approval processed successfully', {
      requestId,
      settlementId,
      messageId: hcsResult.messageId,
      txId: hcsResult.transactionId,
      approved,
      newStatus
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
           settlementId: updatedSettlement.id,
          status: updatedSettlement.status,
          approveEventId: updatedSettlement.approveEventId,
          messageId: hcsResult.messageId
         }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Settlement approval failed', {
      requestId,
      settlementId: body.settlementId,
      approved: body.approved,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }

    return new Response(JSON.stringify({ error: 'Failed to process settlement approval' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export const POST = withSchemaAndIdempotency(
  approveSettlementSchema,
  handleApproveSettlement
);