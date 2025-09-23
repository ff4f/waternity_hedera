import { prisma } from "@/lib/db/prisma";
import { SettlementState } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";

async function settlementExecuteHandler(req: NextRequest, context?: any) {
  const body = (req as any).parsedBody;
  const idempotencyKey = (req as any).idempotencyKey;
  const { messageId, settlementId, executedBy, payoutTransactions, executionNotes, timestamp } = body;

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency key is required" },
      { status: 400 }
    );
  }

  const result = await ensureIdempotent(
    idempotencyKey,
    'settlement_execute',
    async () => {
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        return NextResponse.json(
          { error: "Settlement not found" },
          { status: 404 }
        );
      }

      for (const transfer of payoutTransactions) {
        await prisma.payout.updateMany({
          where: {
            settlementId: settlementId,
            recipientAccount: transfer.recipientAccount,
          },
          data: {
            txId: transfer.transactionId,
            status: "EXECUTED",
          },
        });
      }

      const updatedSettlement = await prisma.settlement.update({
        where: { id: settlementId },
        data: { status: SettlementState.EXECUTED },
      });

      return NextResponse.json(updatedSettlement);
    }
  );

  return result.result || NextResponse.json({ error: "Operation failed" }, { status: 500 });
}

export const POST = withSchema('settlement_execute.schema.json', settlementExecuteHandler);