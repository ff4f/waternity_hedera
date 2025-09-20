import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db/prisma";
import { fetchTopicMessages } from "@/lib/hedera/mirror";

export async function POST(req: Request) {
  try {
    const { wellId } = await req.json();

    if (!wellId) {
      return NextResponse.json({ error: "wellId is required" }, { status: 400 });
    }

    const well = await db.well.findUnique({ where: { id: wellId } });
    if (!well || !well.topicId) {
      return NextResponse.json(
        { error: "Well or topic ID not found" },
        { status: 404 }
      );
    }

    // Find the latest consensus timestamp from local events
    const lastEvent = await db.hcsEvent.findFirst({
      where: { wellId },
      orderBy: { consensusTime: "desc" },
    });

    let fromTs = "0";
    if (lastEvent?.consensusTime) {
      // Add a small nanosecond to avoid fetching the same last message
      const lastTs = lastEvent.consensusTime.getTime();
      const seconds = Math.floor(lastTs / 1000);
      const nanos = (lastTs % 1000) * 1000000 + 1;
      fromTs = `${seconds}.${nanos.toString().padStart(9, "0")}`;
    }

    const mirrorMessages = await fetchTopicMessages({
      topicId: well.topicId,
      fromTs,
    });

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
          messageId: msg.consensusTime, // Using consensusTime as a unique ID
          consensusTime,
          sequenceNumber: BigInt(msg.sequenceNumber),
          runningHash: msg.runningHash,
          payloadJson,
        };
      });

      await db.hcsEvent.createMany({
        data: newEvents,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ ok: true, pulled: mirrorMessages.length });
  } catch (error) {
    console.error("Failed to pull topic messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}