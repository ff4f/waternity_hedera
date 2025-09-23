import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { SettlementState } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";

async function settlementRequestHandler(req: NextRequest, context?: any) {
  const body = (req as any).parsedBody;
  const idempotencyKey = (req as any).idempotencyKey;
  const { messageId, wellId, periodStart, periodEnd, kwhTotal, grossRevenue, payouts, requestedBy, timestamp } = body;

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency key is required" },
      { status: 400 }
    );
  }

  const result = await ensureIdempotent(
    idempotencyKey,
    'settlement_request',
    async () => {
      const settlement = await prisma.settlement.create({
        data: {
          wellId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          kwhTotal,
          grossRevenue,
          status: SettlementState.PENDING,
        },
      });

      await submitMessage(wellId, {
        type: "SETTLEMENT_REQUESTED",
        payload: {
          settlementId: settlement.id,
          messageId,
          payouts,
          requestedBy,
          timestamp,
        },
      });

      return NextResponse.json(settlement);
    }
  );

  return result.result || NextResponse.json({ error: "Operation failed" }, { status: 500 });
}

export const POST = withSchema('settlement_request.schema.json', settlementRequestHandler);