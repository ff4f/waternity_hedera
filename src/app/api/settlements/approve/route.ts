import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { calcPayouts } from "@/lib/settlement/calc";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";

interface SettlementApproveBody {
  messageId: string;
  settlementId: string;
  approvedBy: string;
  timestamp: string;
}

async function handlePOST(request: NextRequest, context: any, body: SettlementApproveBody): Promise<Response> {
  const { messageId } = body;
  
  const result = await ensureIdempotent(messageId, 'settlement_approve', async () => {
    // Get settlement with well memberships
    const settlement = await prisma.settlement.findUnique({
      where: { id: body.settlementId },
      include: {
        well: {
          include: {
            memberships: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!settlement) {
      throw new Error(`Settlement ${body.settlementId} not found`);
    }

    if (settlement.status !== "REQUESTED") {
      throw new Error(
        `Settlement ${body.settlementId} is not in REQUESTED status (current: ${settlement.status})`
      );
    }

    // Calculate payouts using deterministic algorithm
     const payouts = await calcPayouts({
       wellId: settlement.wellId,
       grossRevenue: settlement.grossRevenue || 0,
     });

    // Update settlement status and create payouts
    const updatedSettlement = await prisma.$transaction(async (tx) => {
      // Update settlement
      const updated = await tx.settlement.update({
        where: { id: body.settlementId },
        data: {
          status: "APPROVED",
          approvalEventId: body.messageId,
        },
      });

      // Create payout records
       await tx.payout.createMany({
         data: payouts.map((payout) => ({
           settlementId: body.settlementId,
           recipientAccount: payout.account,
           amount: payout.amount,
           assetType: "HBAR",
           status: "PENDING",
         })),
       });

      return updated;
    });

    // Submit HCS message
    await submitMessage(settlement.wellId, {
      type: "SETTLEMENT_APPROVED",
      payload: {
        settlementId: body.settlementId,
        approvedBy: body.approvedBy,
        timestamp: body.timestamp,
        payouts: payouts.map((p) => ({
           recipientAccount: p.account,
           amount: p.amount,
           assetType: "HBAR",
         })),
      },
    });

    return {
       settlement: updatedSettlement,
       payouts,
     };
   });
   
   return NextResponse.json(result);
}

// Simple schema for now
const settlementApproveSchema = {
  type: "object",
  properties: {
    messageId: { type: "string" },
    settlementId: { type: "string" },
    approvedBy: { type: "string" },
    timestamp: { type: "string" }
  },
  required: ["messageId", "settlementId", "approvedBy", "timestamp"],
  additionalProperties: false
};

export const POST = withSchema(settlementApproveSchema, handlePOST);
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};