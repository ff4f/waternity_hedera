import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { SettlementState } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";
import settlementExecuteSchema from "@/lib/validator/schemas/settlement_execute.schema.json";

async function settlementExecuteHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  const { messageId, settlementId, executedBy, payoutTransactions, executionNotes, timestamp } = body;

  const result = await ensureIdempotent(
    messageId,
    'settlement_execute',
    async () => {
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        throw new Error("Settlement not found");
      }

      for (const transfer of payoutTransactions || []) {
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

      return updatedSettlement;
    }
  );

  return NextResponse.json(result);
}

export const POST = withSchema(settlementExecuteSchema, settlementExecuteHandler);