import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";

export async function POST(request: Request) {
  const { settlementId } = await request.json();

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  });

  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const updatedSettlement = await prisma.settlement.update({
    where: { id: settlementId },
    data: { status: "EXECUTED" },
  });

  const message = {
    type: "SETTLEMENT_EXECUTED",
    payload: {
      settlementId,
    },
  };

  const { messageId } = await submitMessage(settlement.wellId, message);

  await prisma.settlement.update({
    where: { id: settlementId },
    // @ts-ignore
    data: { executeEventId: messageId },
  });

  return NextResponse.json(updatedSettlement);
}