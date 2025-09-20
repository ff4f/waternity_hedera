import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { SettlementState } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { wellId, periodStart, periodEnd, kwhTotal, grossRevenue } =
    await req.json();

  const settlement = await prisma.settlement.create({
    data: {
      wellId,
      periodStart,
      periodEnd,
      kwhTotal,
      grossRevenue,
      status: SettlementState.PENDING,
    },
  });

  await submitMessage(wellId, {
    type: "SETTLEMENT_REQUESTED",
    payload: {
      settlementId: settlement.id,
    },
  });

  return NextResponse.json(settlement);
}