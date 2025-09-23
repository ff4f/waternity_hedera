import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { calcPayouts } from "@/lib/settlement/calc";
import { withSchema, getParsedBody, getIdempotencyKey } from "@/lib/validator/withSchema";
import { withIdempotency } from "@/lib/validator/idempotency";

interface SettlementApproveBody {
  messageId: string;
  settlementId: string;
  approvedBy: string;
  timestamp: string;
}

async function handlePOST(request: NextRequest) {
  try {
    const body: SettlementApproveBody = getParsedBody(request);
    const idempotencyKey = getIdempotencyKey(request);
    
    // Check idempotency
    const idempotencyResult = await withIdempotency(
      idempotencyKey!,
      "settlements_approve",
      async () => {
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
          grossRevenue: settlement.grossRevenue,
        });

        // Create payout records
        const payoutRecords = await Promise.all(
          payouts.map(async (payout) => {
            return prisma.payout.create({
              data: {
                settlementId: settlement.id,
                recipientAccount: payout.account,
                amount: payout.amount,
                assetType: "HBAR",
                status: "PENDING",
              },
            });
          })
        );

        // Update settlement status
        const updatedSettlement = await prisma.settlement.update({
          where: { id: body.settlementId },
          data: {
            status: "APPROVED",
          },
        });

        // Prepare HCS message
        const hcsMessage = {
          type: "SETTLEMENT_APPROVED",
          payload: {
            settlementId: body.settlementId,
            approvedBy: body.approvedBy,
            timestamp: body.timestamp,
            payouts: payouts.map(p => ({
              recipientAccount: p.account,
              amount: p.amount,
              assetType: "HBAR",
            })),
          },
        };

        // Submit to HCS
        const { messageId } = await submitMessage(settlement.wellId, hcsMessage);

        return {
          settlement: updatedSettlement,
          payouts: payoutRecords,
        };
      }
    );

    if (idempotencyResult.isExisting) {
      return NextResponse.json(idempotencyResult.result);
    }

    return NextResponse.json(idempotencyResult.result);
  } catch (error) {
    console.error("Settlement approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withSchema('settlement_approve.schema.json', handlePOST);