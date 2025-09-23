import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { ensureFtForWell, transferPayouts } from "@/lib/hedera/hts";
import { withSchema, getParsedBody, getIdempotencyKey } from "@/lib/validator/withSchema";
import { withIdempotency } from "@/lib/validator/idempotency";

interface SettlementExecuteBody {
  messageId: string;
  settlementId: string;
  executedBy: string;
  timestamp: string;
}

async function handlePOST(request: NextRequest) {
  try {
    const body: SettlementExecuteBody = getParsedBody(request);
    const idempotencyKey = getIdempotencyKey(request);
    
    // Check idempotency
    const idempotencyResult = await withIdempotency(
      idempotencyKey!,
      "settlements_execute",
      async () => {
        // Get settlement with payouts
        const settlement = await prisma.settlement.findUnique({
          where: { id: body.settlementId },
          include: {
            payouts: true,
            well: true,
          },
        });

        if (!settlement) {
          throw new Error(`Settlement ${body.settlementId} not found`);
        }

        if (settlement.status !== "APPROVED") {
          throw new Error(
            `Settlement ${body.settlementId} is not in APPROVED status (current: ${settlement.status})`
          );
        }

        // Check if payouts exist
        if (!settlement.payouts || settlement.payouts.length === 0) {
          throw new Error(
            `No payouts found for settlement ${body.settlementId}. Settlement must be approved first.`
          );
        }

        // Ensure token exists for the well (if needed)
        const tokenInfo = await ensureFtForWell(settlement.wellId);

        // Prepare payouts for transfer
        const payoutsForTransfer = settlement.payouts.map((payout) => ({
          account: payout.recipientAccount,
          amount: Number(payout.amount),
        }));

        // Execute transfers
        const transferResult = await transferPayouts({
          assetType: "HBAR", // Default to HBAR for now
          recipients: payoutsForTransfer,
        });

        // Update payout statuses
        await Promise.all(
          settlement.payouts.map((payout) =>
            prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: "COMPLETED",
              },
            })
          )
        );

        // Update settlement status
        await prisma.settlement.update({
          where: { id: settlement.id },
          data: {
            status: "EXECUTED",
          },
        });

        // Prepare HCS message
        const hcsMessage = {
          type: "SETTLEMENT_EXECUTED",
          payload: {
            settlementId: body.settlementId,
            executedBy: body.executedBy,
            timestamp: body.timestamp,
            transactionId: transferResult[0]?.txId || "",
            payouts: payoutsForTransfer.map(p => ({
              recipientAccount: p.account,
              amount: p.amount,
            })),
          },
        };

        // Submit to HCS
        const { messageId } = await submitMessage(settlement.wellId, hcsMessage);

        // Update settlement with HCS event reference
        await prisma.settlement.update({
          where: { id: body.settlementId },
          data: { executeEventId: messageId },
        });

        return {
          settlement: settlement,
          transactionId: transferResult[0]?.txId || "",
          payouts: settlement.payouts.length,
        };
      }
    );

    if (idempotencyResult.isExisting) {
      return NextResponse.json(idempotencyResult.result, { status: 200 });
    }

    return NextResponse.json(idempotencyResult.result, { status: 200 });
    
  } catch (error) {
    console.error("Settlement execute error:", error);
    
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

export const POST = withSchema('settlement_execute.schema.json', handlePOST);