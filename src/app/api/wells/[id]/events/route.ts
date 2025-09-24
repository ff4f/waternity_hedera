import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { pullAndUpsert, consensusTimestampToDate } from "@/lib/mirror/cursors";
import { generateEventLinks } from "@/lib/hedera/links";
import { z } from "zod";

const QuerySchema = z.object({
  refresh: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
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
  links: {
    hashscan: string;
    mirror: string;
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

    // If refresh=true, trigger pullAndUpsert to get latest messages
    if (query.refresh) {
      try {
        await pullAndUpsert({ topicId: well.topicId, wellId: well.id });
      } catch (error) {
        console.warn('Failed to refresh messages from mirror:', error);
        // Continue with existing local events
      }
    }

    // Fetch local events for the well (including those without consensusTime)
    const localEvents = await prisma.hcsEvent.findMany({
      where: {
        wellId: wellId
      },
      orderBy: [
        { consensusTime: 'asc' },
        { sequenceNumber: 'asc' },
        { createdAt: 'asc' }
      ],
      take: query.limit,
      skip: query.offset
    });

    const eventsWithLinks: EventWithLinks[] = localEvents.map(event => {
      // Generate links only if we have sequenceNumber (from consensus)
      const links = event.sequenceNumber 
        ? generateEventLinks(well.topicId, event.sequenceNumber.toString())
        : { hashscan: '', mirror: '' };
      
      return {
        id: event.id,
        type: event.type,
        messageId: event.messageId,
        consensusTime: event.consensusTime,
        sequenceNumber: event.sequenceNumber,
        txId: event.txId,
        payload: typeof event.payloadJson === 'string' ? JSON.parse(event.payloadJson) : event.payloadJson,
        runningHash: event.hash,
        createdAt: event.createdAt,
        links: {
          hashscan: links.hashscan,
          mirror: links.mirror
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        wellId: well.id,
        wellName: well.name,
        topicId: well.topicId,
        events: eventsWithLinks,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: eventsWithLinks.length,
          hasMore: eventsWithLinks.length === query.limit
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