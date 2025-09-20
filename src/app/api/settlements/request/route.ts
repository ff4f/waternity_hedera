import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";

export async function POST(request: Request) {
  const { wellId, periodStart, periodEnd, kwhTotal, grossRevenue } = await request.json();

  const settlement = await prisma.settlement.create({
    data: {
      wellId,
      periodStart,
      periodEnd,
      kwhTotal,
      grossRevenue,
      status: "REQUESTED",
    },
  });

  const message = {
    type: "SETTLEMENT_REQUESTED",
    payload: {
      settlementId: settlement.id,
      wellId,
    },
  };

  const { messageId } = await submitMessage(message);

  await prisma.settlement.update({
    where: { id: settlement.id },
    data: { requestEventId: messageId },
  });

  return NextResponse.json(settlement);
}