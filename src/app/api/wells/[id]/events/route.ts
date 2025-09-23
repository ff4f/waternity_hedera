import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { fetchTopicMessages, ParsedMirrorMessage } from "@/lib/hedera/mirror";
import { getNextSyncTimestamp, consensusTimestampToDate } from "@/lib/mirror/cursors";
import { generateHashScanTopicUrl, generateMirrorTopicUrl, generateHashScanTxUrl } from "@/lib/hedera/hcs";
import { z } from "zod";

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  includeLocal: z.coerce.boolean().default(true),
  includeMirror: z.coerce.boolean().default(true),
  fromTimestamp: z.string().optional(),
});

interface EventWithLinks {
  id: string;
  type: string;
  messageId: string;
  consensusTime: Date | null;
  sequenceNumber: bigint | null;
  txId: string | null;
  payload: any;
  runningHash: string | null;
  createdAt: Date;
  source: 'local' | 'mirror';
  links: {
    hashscanTopicUrl: string;
    mirrorTopicUrl: string;
    hashscanTxUrl?: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wellId = params.id;
    const url = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(url.searchParams));

    // Get well and validate it exists
    const well = await prisma.well.findUnique({
      where: { id: wellId },
      select: {
        id: true,
        topicId: true,
        name: true
      }
    });

    if (!well) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    const events: EventWithLinks[] = [];

    // Fetch local events if requested
    if (query.includeLocal) {
      const localEvents = await prisma.hcsEvent.findMany({
        where: {
          wellId: wellId,
          ...(query.fromTimestamp && {
            consensusTime: {
              gte: new Date(query.fromTimestamp)
            }
          })
        },
        orderBy: [
          { consensusTime: 'asc' },
          { createdAt: 'asc' }
        ],
        take: query.limit,
        skip: query.offset
      });

      const localEventsWithLinks: EventWithLinks[] = localEvents.map(event => ({
         id: event.id,
         type: event.type,
         messageId: event.messageId,
         consensusTime: event.consensusTime,
         sequenceNumber: event.sequenceNumber,
         txId: event.txId,
         payload: typeof event.payloadJson === 'string' ? JSON.parse(event.payloadJson) : event.payloadJson,
         runningHash: event.hash,
         createdAt: event.createdAt,
         source: 'local' as const,
         links: {
           hashscanTopicUrl: generateHashScanTopicUrl(well.topicId),
           mirrorTopicUrl: generateMirrorTopicUrl(well.topicId),
           ...(event.txId && {
             hashscanTxUrl: generateHashScanTxUrl(event.txId)
           })
         }
       }));

      events.push(...localEventsWithLinks);
    }

    // Fetch mirror events if requested
    if (query.includeMirror) {
      try {
        const fromTimestamp = query.fromTimestamp 
          ? (new Date(query.fromTimestamp).getTime() * 1_000_000).toString()
          : await getNextSyncTimestamp(well.topicId);

        const mirrorResult = await fetchTopicMessages({
          topicId: well.topicId,
          fromTs: fromTimestamp || undefined,
          limit: query.limit
        });

        const mirrorEventsWithLinks: EventWithLinks[] = mirrorResult.messages.map((msg, index) => ({
          id: `mirror-${well.topicId}-${msg.sequenceNumber}`,
          type: msg.payload.type || 'UNKNOWN',
          messageId: msg.messageId || `mirror-${msg.sequenceNumber}`,
          consensusTime: consensusTimestampToDate(msg.consensusTime),
          sequenceNumber: BigInt(msg.sequenceNumber),
          txId: null, // Mirror messages don't include txId directly
          payload: msg.payload,
          runningHash: msg.runningHash,
          createdAt: consensusTimestampToDate(msg.consensusTime),
          source: 'mirror' as const,
          links: {
            hashscanTopicUrl: generateHashScanTopicUrl(well.topicId),
            mirrorTopicUrl: generateMirrorTopicUrl(well.topicId)
          }
        }));

        events.push(...mirrorEventsWithLinks);
      } catch (error) {
        console.error('Failed to fetch mirror events:', error);
        // Continue with local events only
      }
    }

    // Sort events chronologically by consensusTime (fallback to createdAt)
    events.sort((a, b) => {
      const aTime = a.consensusTime || a.createdAt;
      const bTime = b.consensusTime || b.createdAt;
      return aTime.getTime() - bTime.getTime();
    });

    // Apply pagination to the merged results
    const paginatedEvents = events.slice(query.offset, query.offset + query.limit);

    return NextResponse.json({
      success: true,
      data: {
        wellId: well.id,
        wellName: well.name,
        topicId: well.topicId,
        events: paginatedEvents,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: events.length,
          hasMore: events.length > query.offset + query.limit
        },
        links: {
          hashscanTopicUrl: generateHashScanTopicUrl(well.topicId),
          mirrorTopicUrl: generateMirrorTopicUrl(well.topicId)
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch well events:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}