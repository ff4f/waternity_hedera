import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { syncTopicMessages } from "@/lib/hedera/mirror";
import { getNextSyncTimestamp, updateSyncCursor } from "@/lib/mirror/cursors";
import { z } from "zod";

const PullTopicSchema = z.object({
  wellId: z.string().optional(),
  topicId: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  forceSync: z.boolean().default(false)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wellId, topicId, limit, forceSync } = PullTopicSchema.parse(body);

    // Validate that either wellId or topicId is provided
    if (!wellId && !topicId) {
      return NextResponse.json(
        { error: "Either wellId or topicId is required" },
        { status: 400 }
      );
    }

    let targetTopicId: string;
    let targetWellId: string | null = null;

    if (wellId) {
      // Get topic ID from well
      const well = await prisma.well.findUnique({
        where: { id: wellId },
        select: { id: true, topicId: true, name: true }
      });

      if (!well || !well.topicId) {
        return NextResponse.json(
          { error: "Well not found or has no topic ID" },
          { status: 404 }
        );
      }

      targetTopicId = well.topicId;
      targetWellId = well.id;
    } else {
      // Use provided topic ID directly
      targetTopicId = topicId!;
    }

    // Get the next sync timestamp (cursor-based)
    const fromTimestamp = forceSync ? "0" : await getNextSyncTimestamp(targetTopicId);

    // Sync messages from mirror node
    const syncResult = await syncTopicMessages(targetTopicId, fromTimestamp || "0", limit);

    let newEventsCount = 0;
    let updatedEventsCount = 0;

    if (syncResult.messages.length > 0) {
      // Process and upsert events
      const eventData = syncResult.messages.map((msg) => {
        const eventType = msg.payload?.type || 'UNKNOWN';
        const payloadJson = JSON.stringify(msg.payload);

        return {
          ...(targetWellId && { wellId: targetWellId }),
          type: eventType,
          messageId: msg.messageId || `mirror-${msg.sequenceNumber}`,
          consensusTime: new Date(msg.consensusTime),
          sequenceNumber: BigInt(msg.sequenceNumber),
          hash: msg.runningHash,
          payloadJson
        };
      });

      // Use transaction for atomic operations
      await prisma.$transaction(async (tx) => {
        for (const event of eventData) {
          const result = await tx.hcsEvent.upsert({
            where: {
              messageId: event.messageId
            },
            update: {
              type: event.type,
              consensusTime: event.consensusTime,
              sequenceNumber: event.sequenceNumber,
              hash: event.hash,
              payloadJson: event.payloadJson
            },
            create: event
          });

          // Count new vs updated events (simplified)
          if (result.createdAt.getTime() === result.consensusTime?.getTime()) {
            newEventsCount++;
          } else {
            updatedEventsCount++;
          }
        }
      });

      // Update sync cursor with the latest consensus timestamp
      if (syncResult.messages.length > 0) {
        const latestMessage = syncResult.messages[syncResult.messages.length - 1];
        await updateSyncCursor(targetTopicId, latestMessage.consensusTime);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        topicId: targetTopicId,
        wellId: targetWellId,
        messagesFound: syncResult.messages.length,
        newEvents: newEventsCount,
        updatedEvents: updatedEventsCount,
        hasMore: syncResult.hasMore,
        fromTimestamp,
        forceSync
      }
    });

  } catch (error) {
    console.error('Failed to pull topic messages:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}