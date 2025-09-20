import { prisma } from "@/lib/db/prisma";
import { SettlementState } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { settlementId, executedTransactions } = await req.json();

  if (!settlementId || !executedTransactions) {
    return NextResponse.json(
      { error: "Missing settlementId or executedTransactions" },
      { status: 400 }
    );
  }

  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "Settlement not found" },
        { status: 404 }
      );
    }

    for (const transfer of executedTransactions) {
      await prisma.payout.updateMany({
        where: {
          settlementId: settlementId,
          recipientWallet: transfer.account,
        },
        data: {
          txId: transfer.txId,
          status: "EXECUTED",
        },
      });
    }

    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: { status: SettlementState.EXECUTED },
    });

    return NextResponse.json(updatedSettlement);
  } catch (error) {
    console.error("Failed to execute settlement:", error);
    return NextResponse.json(
      { error: "Failed to execute settlement" },
      { status: 500 }
    );
  }
}