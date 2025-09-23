import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { withSchema, getParsedBody, getIdempotencyKey } from "@/lib/validator/withSchema";
import { withIdempotency } from "@/lib/validator/idempotency";

interface SettlementRequestBody {
  messageId: string;
  wellId: string;
  periodStart: string;
  periodEnd: string;
  kwhTotal: number;
  grossRevenue: number;
  payouts: Array<{
    recipientAccount: string;
    assetType: "HBAR" | "TOKEN";
    amount: number;
    tokenId?: string;
  }>;
  requestedBy: string;
  timestamp: string;
}

async function handlePOST(request: NextRequest) {
  try {
    const body: SettlementRequestBody = getParsedBody(request);
    const idempotencyKey = getIdempotencyKey(request);
    
    // Check idempotency
    const idempotencyResult = await withIdempotency(
      idempotencyKey!,
      "settlements_request",
      async () => {
        // Check if settlement already exists for this period
        const existingSettlement = await prisma.settlement.findFirst({
          where: {
            wellId: body.wellId,
            periodStart: new Date(body.periodStart),
            periodEnd: new Date(body.periodEnd),
          },
        });

        if (existingSettlement) {
          throw new Error(
            `Settlement already exists for well ${body.wellId} in period ${body.periodStart} to ${body.periodEnd}`
          );
        }

        // Validate well exists
        const well = await prisma.well.findUnique({
          where: { id: body.wellId },
        });

        if (!well) {
          throw new Error(`Well ${body.wellId} not found`);
        }

        // Create settlement record
        const settlement = await prisma.settlement.create({
          data: {
            wellId: body.wellId,
            periodStart: new Date(body.periodStart),
            periodEnd: new Date(body.periodEnd),
            kwhTotal: body.kwhTotal,
            grossRevenue: body.grossRevenue,
            status: "REQUESTED",
          },
        });

        // Prepare HCS message
        const hcsMessage = {
          type: "SETTLEMENT_REQUESTED",
          payload: {
            settlementId: settlement.id,
            wellId: body.wellId,
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
            kwhTotal: body.kwhTotal,
            grossRevenue: body.grossRevenue,
            requestedBy: body.requestedBy,
            timestamp: body.timestamp,
          },
        };

        // Submit to HCS
        const { messageId } = await submitMessage(body.wellId, hcsMessage);

        // Update settlement with HCS event reference
        const updatedSettlement = await prisma.settlement.update({
          where: { id: settlement.id },
          data: { requestEventId: messageId },
        });

        return updatedSettlement;
      }
    );

    if (idempotencyResult.isExisting) {
      return NextResponse.json(idempotencyResult.result, { status: 200 });
    }

    return NextResponse.json(idempotencyResult.result, { status: 201 });
    
  } catch (error) {
    console.error("Settlement request error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withSchema('settlement_request.schema.json', handlePOST);