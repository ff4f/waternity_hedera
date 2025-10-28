import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/hedera/hcs";
import { isValidTopicId } from "@/lib/hedera/ids";
import { generateHcsLinks } from "@/lib/hedera/links";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import anchorDocSchema from "@/lib/schemas/anchor_doc.schema.json";
import { logger } from "@/lib/log";
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from "@/lib/auth/roles";

async function anchorDocumentHandler(req: NextRequest, body: any) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  logger.info('Document anchoring started', {
    requestId,
    messageId: body.messageId,
    wellId: body.wellId,
    documentType: body.documentType,
    cid: body.cid,
    hfsFileId: body.hfsFileId
  });
  
  try {
    // Authentication and authorization
    const user = await requireUser(req);
    assertRole(user, 'OPERATOR', 'ADMIN');
    
    const { messageId, wellId, documentType, cid, hfsFileId, digestAlgo, digestHex, bundleContentBase64, metadata, anchoredBy, timestamp } = body;
    const { filename, fileSize, mimeType, description } = metadata || {};

    // Validate well exists and get topicId
    const well = await prisma.well.findUnique({ where: { id: wellId } });
    if (!well) {
      return new Response(
        JSON.stringify({ error: 'well_not_found', details: ['Well not found'] }),
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
    
    const topicId = well.topicId;

    const messageJson = {
      eventType: 'DOC_ANCHORED',
      payload: {
        messageId,
        wellId,
        documentType,
        cid,
        hfsFileId,
        digestAlgo,
        digestHex,
        metadata: { filename, fileSize, mimeType, description },
        anchoredBy,
        bundleContentBase64,
        timestamp: timestamp || new Date().toISOString(),
      },
    };

    // Publish event to HCS
    const hcsResult = await publishEvent({
      topicId,
      messageJson,
      messageId,
    });

    // Create HcsEvent record
    const hcsEvent = await prisma.hcsEvent.create({
      data: {
        wellId,
        type: 'DOC_ANCHORED',
        messageId: hcsResult.messageId,
        payloadJson: JSON.stringify(messageJson.payload),
        txId: hcsResult.transactionId,
        consensusTime: hcsResult.consensusTimestamp ? new Date(hcsResult.consensusTimestamp) : null,
        sequenceNumber: hcsResult.sequenceNumber ? BigInt(hcsResult.sequenceNumber) : null,
        hash: hcsResult.messageHash,
      },
    });

    // Create Document and Anchor within a transaction
    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          wellId,
          type: documentType,
          name: filename ?? undefined,
          cid: cid ?? undefined,
          hfsFileId: hfsFileId ?? undefined,
          digestAlgo: digestAlgo ?? undefined,
          digestHex: digestHex ?? undefined,
          anchoredEventId: hcsEvent.id,
        },
      });

      const anc = await tx.anchor.create({
        data: {
          sourceType: 'DOCUMENT',
          sourceId: doc.id,
          hcsEventId: hcsEvent.id,
          digestAlgo: digestAlgo,
          digestHex: digestHex,
          cid: cid ?? undefined,
          hfsFileId: hfsFileId ?? undefined,
        },
      });

      return { document: doc, anchor: anc };
    });

    const links = generateHcsLinks(topicId, hcsResult.sequenceNumber, hcsResult.transactionId);

    logger.info('Document anchored successfully', {
      requestId,
      messageId: hcsResult.messageId,
      txId: hcsResult.transactionId,
      documentId: created.document.id,
      anchorId: created.anchor.id,
      topicId,
      sequenceNumber: hcsResult.sequenceNumber,
      consensusTimestamp: hcsResult.consensusTimestamp
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          document: created.document,
          anchor: created.anchor,
          hcsEvent: {
            messageId: hcsResult.messageId,
            transactionId: hcsResult.transactionId,
            consensusTimestamp: hcsResult.consensusTimestamp,
            sequenceNumber: hcsResult.sequenceNumber,
            topicId,
            eventId: hcsEvent.id,
            links,
          },
        }
      }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('Document anchoring failed', {
      requestId,
      messageId: body.messageId,
      wellId: body.wellId,
      documentType: body.documentType,
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
      anchorDocSchema,
      anchorDocumentHandler
    )(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('Documents anchor POST handler failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ error: 'Failed to anchor document' }, { status: 500 });
  }
}

export { POST };