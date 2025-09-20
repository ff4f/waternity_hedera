import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db/prisma";
import { fetchTopicMessages } from "@/lib/hedera/mirror";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const wellId = params.id;

    // 1. Query local HcsEvent first, ordered by consensusTime (or createdAt as fallback)
    const localEvents = await db.hcsEvent.findMany({
      where: { wellId },
      orderBy: [{ consensusTime: "asc" }, { createdAt: "asc" }],
    });

    // 2. Find the latest consensus timestamp from local events
    const lastEvent =
      localEvents.length > 0 ? localEvents[localEvents.length - 1] : null;

    let fromTs = "0";
    if (lastEvent?.consensusTime) {
      // Add a small nanosecond to avoid fetching the same last message
      const lastTs = lastEvent.consensusTime.getTime();
      const seconds = Math.floor(lastTs / 1000);
      const nanos = (lastTs % 1000) * 1000000 + 1;
      fromTs = `${seconds}.${nanos.toString().padStart(9, "0")}`;
    }

    // 3. Fetch new messages from the mirror node
    const well = await db.well.findUnique({ where: { id: wellId } });
    if (!well || !well.topicId) {
      return NextResponse.json(
        { error: "Well or topic ID not found" },
        { status: 404 }
      );
    }

    const mirrorMessages = await fetchTopicMessages({
      topicId: well.topicId,
      fromTs,
    });

    // 4. Merge and update local DB
    if (mirrorMessages.length > 0) {
      const newEvents = mirrorMessages.map((msg) => {
        let eventType = "unknown";
        let payloadJson = msg.message;
        try {
          const payload = JSON.parse(msg.message);
          if (payload && typeof payload.type === "string") {
            eventType = payload.type;
          }
          payloadJson = JSON.stringify(payload);
        } catch (e) {
          // Not a JSON message, keep original
        }

        const [seconds, nanos] = msg.consensusTime.split(".").map(Number);
        const consensusTime = new Date(seconds * 1000 + nanos / 1000000);

        return {
          wellId,
          type: eventType,
          messageId: msg.consensusTime,
          consensusTime,
          sequenceNumber: BigInt(msg.sequenceNumber),
          runningHash: msg.runningHash,
          payloadJson,
        };
      });

      // Use a transaction to create new events
      await db.hcsEvent.createMany({
        data: newEvents,
        skipDuplicates: true, // Avoid inserting duplicates
      });

      // Re-fetch to get a merged and sorted list
      const allEvents = await db.hcsEvent.findMany({
        where: { wellId },
        orderBy: [{ consensusTime: "asc" }, { createdAt: "asc" }],
      });

      return NextResponse.json(allEvents);
    }

    // If no new messages, just return local events
    return NextResponse.json(localEvents);
  } catch (error) {
    console.error("Failed to get timeline:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}