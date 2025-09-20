import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { SettlementState } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { settlementId } = await req.json();

  const settlement = await prisma.settlement.update({
    where: { id: settlementId },
    data: { status: SettlementState.APPROVED },
  });

  await submitMessage(settlement.wellId, {
    type: "SETTLEMENT_APPROVED",
    payload: {
      settlementId: settlement.id,
    },
  });

  return NextResponse.json(settlement);
}