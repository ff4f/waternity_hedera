import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";
import { TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import { createHederaClient } from "@/lib/hedera/client";

// Simple HCS message publishing function
async function publishHcsMessage({ topicId, message }: { topicId: string; message: any }) {
  // Use mock mode for development
  if (process.env.HEDERA_MOCK_MODE === 'true') {
    console.log('Mock HCS Message:', { topicId, message });
    return {
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
      sequenceNumber: Math.floor(Math.random() * 1000).toString(),
      status: 'SUCCESS'
    };
  }

  const client = createHederaClient();
  
  const transaction = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(JSON.stringify(message));

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
    sequenceNumber: receipt.topicSequenceNumber?.toString() || '0',
    status: receipt.status.toString()
  };
}

async function hcsEventsHandler(req: NextRequest, context?: any) {
  const body = (req as any).parsedBody;
  const idempotencyKey = (req as any).idempotencyKey;
  const { messageId, wellId, topicId, eventType, payload, submittedBy, timestamp } = body;

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency key is required" },
      { status: 400 }
    );
  }

  const well = await prisma.well.findUnique({
    where: { id: wellId },
  });

  if (!well) {
    return NextResponse.json({ error: "Well not found" }, { status: 404 });
  }

  const result = await ensureIdempotent(
    idempotencyKey,
    'hcs_events',
    async () => {
      const hcsResult = await publishHcsMessage({
        topicId: topicId || well.topicId,
        message: body,
      });

      return hcsResult;
    }
  );

  if (result.isNew) {
    // New operation - return 202
    return NextResponse.json(result.result, {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    // Existing operation - return 200
    return NextResponse.json({ message: "Operation already processed", resultHash: result.resultHash }, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const POST = withSchema('hcs_event.schema.json', hcsEventsHandler);