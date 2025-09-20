import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { event } = req.body;

    if (!event || !event.messageId) {
      return res.status(400).json({ message: "Invalid event payload" });
    }

    // Idempotency check
    const existingEvent = await prisma.hcsEvent.findUnique({
      where: {
        messageId: event.messageId,
      },
    });

    if (existingEvent) {
      return res.status(200).json({ message: "Event already processed" });
    }

    await prisma.hcsEvent.create({
      data: {
        well: {
          connect: {
            id: event.wellId,
          },
        },
        type: "not-implemented",
        messageId: event.messageId,
        payloadJson: JSON.stringify(event),
        consensusTime: null,
        sequenceNumber: null,
      },
    });

    return res.status(202).json({ message: "Event accepted" });
  }
  res.setHeader("Allow", "POST");
  res.status(405).end("Method Not Allowed");
}