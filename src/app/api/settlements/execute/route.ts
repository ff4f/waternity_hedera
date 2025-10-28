import { NextRequest, NextResponse } from 'next/server';
import { withSchemaAndIdempotency } from '../../../../lib/validator/withSchemaAndIdempotency';
import { prisma } from '../../../../lib/db/prisma';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '../../../../lib/auth/roles';
import { publishEvent } from '../../../../lib/hedera/hcs';
import { isValidTopicId } from '../../../../lib/hedera/ids';
import { transferPayouts, PayoutRecipient } from '../../../../lib/hedera/hts';
import { calculateSettlement } from '../../../../lib/settlement/calc';
import { rateLimit, createUserKey } from '@/lib/http/rateLimit';
import { logger } from '../../../../lib/log';

// JSON Schema for settlement execution
const executeSettlementSchema = {
  type: 'object',
  properties: {
    settlementId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    assetType: {
      type: 'string',
      enum: ['HBAR', 'TOKEN']
    },
    tokenId: {
      type: 'string',
      pattern: '^0\.0\.[0-9]+$'
    },
    operatorNotes: {
      type: 'string',
      maxLength: 1000
    }
  },
  required: ['settlementId', 'assetType'],
  additionalProperties: false
};

interface ExecuteSettlementRequest {
  settlementId: string;
  assetType: 'HBAR' | 'TOKEN';
  tokenId?: string;
  operatorNotes?: string;
}

async function handleExecuteSettlement(
  request: NextRequest,
  res: any,
  body: ExecuteSettlementRequest
) {
  try {
    // Authentication and authorization
    const user = await requireUser(request);
    assertRole(user, 'OPERATOR', 'ADMIN');
    
    // Rate limiting: 30 requests per 5 minutes per user
    try {
      const rateLimitKey = createUserKey(user.id, 'settlements-execute');
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
            details: ['Too many settlement execution requests. Please try again later.'],
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
    
    const { settlementId, assetType, tokenId, operatorNotes } = body;

    // Validate token requirement
    if (assetType === 'TOKEN' && !tokenId) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          details: ['tokenId is required when assetType is TOKEN']
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find the settlement with payouts
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        well: {
          include: {
            operator: true,
            memberships: {
              include: {
                user: true
              }
            }
          }
        },
        payouts: true
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

    // Check if settlement is in correct state
    if (settlement.status !== 'APPROVED') {
      return new Response(
        JSON.stringify({
          error: 'invalid_state',
          details: [`Settlement is in ${settlement.status} state, cannot execute`]
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to execute this settlement
    if (user.role?.name === 'OPERATOR' && settlement.well.operatorUserId !== user.id) {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          details: ['You can only execute settlements for wells you operate']
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate settlement distribution if payouts don't exist
    let recipients: PayoutRecipient[];
    
    if (settlement.payouts.length === 0) {
      // Calculate recipients from well memberships
      const membershipRecipients = settlement.well.memberships
        .filter(membership => membership.shareBps && membership.shareBps > 0)
        .map((membership, index) => ({
          id: `investor-${index}`,
          address: membership.user.hederaAccountId || '',
          percentage: (membership.shareBps || 0) / 100,
          role: 'INVESTOR' as const
        }));

      // Add platform fee recipient (5%)
      membershipRecipients.push({
        id: 'platform-fee',
        address: process.env.PLATFORM_FEE_ACCOUNT || '0.0.123456',
        percentage: 5.0,
        role: 'INVESTOR' as const
      });

      const settlementCalc = calculateSettlement(settlement.grossRevenue || 0, membershipRecipients);
      
      recipients = settlementCalc.payouts.map(payout => ({
        address: payout.address,
        amount: payout.amount
      }));
    } else {
      // Use existing payouts
      recipients = settlement.payouts.map(payout => ({
        address: payout.recipientAccount,
        amount: payout.amount
      }));
    }

    // Execute the transfer
    const transferResult = await transferPayouts({
      assetType,
      tokenId,
      recipients
    });

    if (!transferResult.success) {
      return new Response(
        JSON.stringify({
          error: 'transfer_failed',
          details: transferResult.error ? [transferResult.error] : ['Transfer execution failed']
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update settlement status
    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'EXECUTED',
        executeEventId: transferResult.transactionId
      },
      include: {
        well: true
      }
    });

    // Update payout records
    if (settlement.payouts.length > 0) {
      await prisma.payout.updateMany({
        where: { settlementId },
        data: {
          status: 'COMPLETED',
          txId: transferResult.transactionId
        }
      });
    } else {
      // Create payout records
      await prisma.payout.createMany({
        data: recipients.map(recipient => ({
          settlementId,
          recipientAccount: recipient.address,
          amount: recipient.amount,
          assetType,
          tokenId: tokenId || null,
          status: 'COMPLETED',
          txId: transferResult.transactionId
        }))
      });
    }

    // Submit to HCS
    const hcsResult = await publishEvent({
      topicId: settlement.well.topicId,
      messageJson: {
        eventType: 'settlement_execution',
        settlementId,
        executedBy: user.id,
        assetType,
        tokenId,
        transactionId: transferResult.transactionId,
        recipientCount: recipients.length,
        totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
        operatorNotes
      }
    });

    // Record HCS event
    await prisma.hcsEvent.create({
      data: {
        messageId: hcsResult.messageId,
        wellId: settlement.wellId,
        type: 'settlement_execution',
        payloadJson: JSON.stringify({
          executedBy: user.id,
          assetType,
          tokenId,
          transactionId: transferResult.transactionId,
          recipientCount: recipients.length,
          totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
          operatorNotes,
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
          executeEventId: updatedSettlement.executeEventId,
          transactionId: transferResult.transactionId,
          recipientCount: recipients.length,
          totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
          messageId: hcsResult.messageId
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    logger.error('Settlement execution failed', {
      requestId,
      settlementId: body.settlementId,
      assetType: body.assetType,
      tokenId: body.tokenId,
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
      executeSettlementSchema,
      handleExecuteSettlement
    )(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('Settlement execution POST failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Failed to execute settlement' }, { status: 500 });
  }
}

export { POST };