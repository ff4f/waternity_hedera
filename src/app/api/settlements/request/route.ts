import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import settlementRequestSchema from "@/lib/validator/schemas/settlement_request.schema.json";
import { requireOperator } from "@/lib/auth/roles";
import { Role } from "@/lib/types";

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

async function handlePOST(request: NextRequest, res: any, body: SettlementRequestBody) {
  try {
    // Require OPERATOR role for settlement requests
    const user = await requireOperator(request);
        // Validate well exists
        const well = await prisma.well.findUnique({
          where: { code: body.wellId },
        });

        if (!well) {
          throw new Error(`Well ${body.wellId} not found`);
        }

        // Check if settlement already exists for this period
        const existingSettlement = await prisma.settlement.findFirst({
          where: {
            wellId: well.id,
            periodStart: new Date(body.periodStart),
            periodEnd: new Date(body.periodEnd),
          },
        });

        if (existingSettlement) {
          throw new Error(
            `Settlement already exists for well ${body.wellId} in period ${body.periodStart} to ${body.periodEnd}`
          );
        }

        // Create settlement record
        const settlement = await prisma.settlement.create({
          data: {
            wellId: well.id,
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
        const { messageId } = await submitMessage(well.id, hcsMessage);

        // Update settlement with HCS event reference
        const updatedSettlement = await prisma.settlement.update({
          where: { id: settlement.id },
          data: { requestEventId: messageId },
        });

    return NextResponse.json(updatedSettlement, { status: 201 });
    
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

export const POST = withSchemaAndIdempotency(settlementRequestSchema, handlePOST);