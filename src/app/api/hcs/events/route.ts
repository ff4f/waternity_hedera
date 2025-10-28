import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import { publishEvent } from "@/lib/hedera/hcs";
import { generateHcsLinks } from "@/lib/hedera/links";
import { isValidTopicId } from "@/lib/hedera/ids";
import hcsEventSchema from "@/lib/schemas/hcs_event.schema.json";
import { logger } from "@/lib/log";

import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from "@/lib/auth/roles";
import { rateLimit, createUserKey } from "@/lib/http/rateLimit";

async function hcsEventsHandler(req: NextRequest, res: any, body: any) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  logger.info('HCS event publish started', { 
    requestId, 
    messageId: body.messageId,
    wellId: body.wellId,
    eventType: body.eventType 
  });
  
  try {
    let user: any = null;
    
    // Skip authentication in mock mode
    if (process.env.HEDERA_MOCK_MODE === 'true') {
      logger.info('Mock mode enabled - skipping authentication', { requestId });
      user = { id: 'mock-user', role: { name: 'OPERATOR' } };
    } else {
      // Authentication and authorization
      user = await requireUser(req);
      assertRole(user, 'OPERATOR', 'ADMIN');
    }
    
    // Rate limiting: 60 requests per 1 minute per user
    try {
      const rateLimitKey = createUserKey(user.id, 'hcs-events');
      await rateLimit({
        key: rateLimitKey,
        limit: 60,
        windowMs: 60 * 1000 // 60 seconds
      });
    } catch (rateLimitError: any) {
      if (rateLimitError.code === 'RATE_LIMITED') {
        return new Response(
          JSON.stringify({ 
            error: 'rate_limit_exceeded', 
            details: ['Too many HCS publish requests. Please try again later.'],
            retryAfter: rateLimitError.details.retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': rateLimitError.details.retryAfter.toString()
            } 
          }
        );
      }
      throw rateLimitError;
    }
    
    const { messageId, wellId, topicId, eventType, payload, submittedBy, timestamp } = body;

    // Validate well exists if wellId is provided
    let well = null;
    if (wellId) {
      well = await prisma.well.findUnique({
        where: { id: wellId },
      });

      if (!well) {
        logger.warn('Well not found for HCS event', { requestId, wellId, messageId: body.messageId });
        return new Response(
          JSON.stringify({ error: "well_not_found", details: ["Well not found"] }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use well's topicId if not provided in request
    const finalTopicId = topicId || well?.topicId;
    
    // Validate topicId format - fail fast if missing or invalid
    if (!isValidTopicId(finalTopicId)) {
      logger.warn('Invalid topic ID for HCS event', { 
        requestId, 
        topicId: finalTopicId, 
        wellId, 
        messageId: body.messageId 
      });
      return new Response(
        JSON.stringify({ 
          error: "invalid_topic_id", 
          details: ["Topic ID must be in format x.y.z (e.g., 0.0.123)"] 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, upsert the HcsEvent record with initial data
    const hcsEvent = await prisma.hcsEvent.upsert({
      where: { messageId },
      create: {
        wellId,
        type: eventType,
        messageId,
        payloadJson: JSON.stringify(payload),
        txId: null,
        consensusTime: null,
        sequenceNumber: null,
      },
      update: {
        wellId,
        type: eventType,
        payloadJson: JSON.stringify(payload),
      },
    });

    try {
      let hcsResult: any;
      
      // Use mock mode for development
      if (process.env.HEDERA_MOCK_MODE === 'true') {
        logger.info('Mock mode enabled - simulating HCS publish', { requestId, messageId });
        hcsResult = {
          messageId,
          transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
          consensusTimestamp: new Date().toISOString(),
          sequenceNumber: Math.floor(Math.random() * 1000000),
          messageHash: `mock-hash-${Date.now()}`,
          status: 'SUCCESS'
        };
      } else {
        // Publish to HCS
        hcsResult = await publishEvent({
          topicId: finalTopicId,
          messageJson: {
            eventType,
            payload,
            submittedBy,
            timestamp: timestamp || new Date().toISOString(),
          },
          messageId,
        });
      }

      // Update the HcsEvent record with HCS results
      const updatedHcsEvent = await prisma.hcsEvent.update({
        where: { id: hcsEvent.id },
        data: {
          txId: hcsResult.transactionId,
          consensusTime: hcsResult.consensusTimestamp ? new Date(hcsResult.consensusTimestamp) : null,
          sequenceNumber: hcsResult.sequenceNumber ? BigInt(hcsResult.sequenceNumber) : null,
          hash: hcsResult.messageHash,
        },
      });

      // Generate response links
      const links = generateHcsLinks(
        finalTopicId,
        hcsResult.sequenceNumber,
        hcsResult.transactionId
      );

      logger.info('HCS event published successfully', {
        requestId,
        messageId: hcsResult.messageId,
        txId: hcsResult.transactionId,
        topicId: finalTopicId,
        sequenceNumber: hcsResult.sequenceNumber,
        consensusTimestamp: hcsResult.consensusTimestamp
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            messageId: hcsResult.messageId,
            transactionId: hcsResult.transactionId,
            consensusTimestamp: hcsResult.consensusTimestamp,
            sequenceNumber: hcsResult.sequenceNumber,
            topicId: finalTopicId,
            eventId: updatedHcsEvent.id,
            links,
          }
        }),
        { status: 202, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (hcsError) {
      // If HCS publishing fails, keep the database record but mark it as failed
      await prisma.hcsEvent.update({
        where: { id: hcsEvent.id },
        data: {
          txId: `FAILED: ${hcsError instanceof Error ? hcsError.message : 'Unknown error'}`,
        },
      });
      
      throw hcsError;
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('HCS event publishing failed', {
      requestId,
      messageId: body.messageId,
      wellId: body.wellId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return new Response(
      JSON.stringify({ error: 'internal_server_error', details: ['An unexpected error occurred'] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function POST(req: NextRequest) {
  try {
    return await withSchemaAndIdempotency(
      hcsEventSchema,
      hcsEventsHandler
    )(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('HCS events POST handler failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ error: 'Failed to publish HCS event' }, { status: 500 });
  }
}

export { POST };