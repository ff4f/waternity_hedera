import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { SettlementState } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";
import settlementApproveSchema from "@/lib/validator/schemas/settlement_approve.schema.json";

async function settlementApproveHandler(req: NextRequest, context?: any) {
  const body = (req as any).parsedBody;
  const idempotencyKey = (req as any).idempotencyKey;
  const { messageId, settlementId, approvedBy, approvalNotes, escrowTxId, timestamp } = body;

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency key is required" },
      { status: 400 }
    );
  }

  const result = await ensureIdempotent(
    idempotencyKey,
    'settlement_approve',
    async () => {
      const settlement = await prisma.settlement.update({
        where: { id: settlementId },
        data: { status: SettlementState.APPROVED },
      });

      await submitMessage(settlement.wellId, {
        type: "SETTLEMENT_APPROVED",
        payload: {
          settlementId: settlement.id,
          messageId,
          approvedBy,
          approvalNotes,
          escrowTxId,
          timestamp,
        },
      });

      return NextResponse.json(settlement);
    }
  );

  return result.result || NextResponse.json({ error: "Operation failed" }, { status: 500 });
}

export const POST = withSchema(settlementApproveSchema, settlementApproveHandler);