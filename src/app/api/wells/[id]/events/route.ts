import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isValidTopicId } from "@/lib/hedera/ids";
import { generateHcsLinks } from "@/lib/hedera/links";


interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  console.log('[WELLS] GET /api/wells/[id]/events - Fetching well events');
  
  try {
    const { id: wellId } = params;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // Get well information
    const well = await prisma.well.findUnique({
      where: { id: wellId },
      select: { id: true, topicId: true, name: true },
    });

    if (!well) {
      console.log('[WELLS] Well not found:', wellId);
      return new Response(JSON.stringify({ error: "Well not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
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

    // Optional refresh: pull latest events from Mirror Node
    if (refresh) {
      console.log('[WELLS] Refreshing events from mirror node for well:', wellId);
      try {
        // Call the pull-topic endpoint internally
        const pullResponse = await fetch(
          new URL("/api/system/pull-topic", request.url),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ wellId }),
          }
        );

        if (!pullResponse.ok) {
          console.warn("Failed to refresh events from Mirror Node:", pullResponse.statusText);
          // Continue with existing events even if refresh fails
        }
      } catch (error) {
        console.warn("Failed to refresh events:", error);
        // Continue with existing events even if refresh fails
      }
    }

    // Fetch events from database, sorted by consensusTime then sequenceNumber
    console.log('[WELLS] Fetching events from database for well:', wellId);
    const events = await prisma.hcsEvent.findMany({
      where: { wellId },
      orderBy: [
        { consensusTime: "asc" },
        { sequenceNumber: "asc" },
      ],
      select: {
        id: true,
        messageId: true,
        type: true,
        consensusTime: true,
        sequenceNumber: true,
        txId: true,
        hash: true,
        payloadJson: true,
        createdAt: true,
      },
    });

    // Transform events and add links
    const eventsWithLinks = events.map((event) => {
      // Parse payload JSON
      let payload = null;
      try {
        payload = event.payloadJson ? JSON.parse(event.payloadJson) : null;
      } catch (error) {
        console.warn(`Failed to parse payload for event ${event.id}:`, error);
      }

      // Generate consensus timestamp in Hedera format (handle null consensusTime)
      let consensusTimestamp = "0.0";
      if (event.consensusTime) {
        consensusTimestamp = `${Math.floor(event.consensusTime.getTime() / 1000)}.${(
          (event.consensusTime.getTime() % 1000) * 1_000_000
        ).toString().padStart(9, "0")}`;
      }

      // Generate Hedera links
      const links = generateHcsLinks(
        well.topicId,
        event.sequenceNumber ? Number(event.sequenceNumber) : undefined,
        event.txId || undefined
      );

      return {
        id: event.id,
        messageId: event.messageId,
        type: event.type,
        consensusTime: event.consensusTime?.toISOString() || null,
        consensusTimestamp,
        sequenceNumber: event.sequenceNumber ? Number(event.sequenceNumber) : null,
        transactionId: event.txId,
        hash: event.hash,
        payload,
        links,
        createdAt: event.createdAt.toISOString(),
      };
    });

    console.log('[WELLS] Successfully fetched', eventsWithLinks.length, 'events for well:', wellId);
    
    return new Response(
      JSON.stringify({
        success: true,
        well: {
          id: well.id,
          name: well.name,
          topicId: well.topicId,
        },
        events: eventsWithLinks,
        total: eventsWithLinks.length,
        refreshed: refresh,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('[WELLS] Error fetching well events:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch well events' }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}