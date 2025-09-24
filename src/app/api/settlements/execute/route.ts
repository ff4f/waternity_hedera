import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { submitMessage } from "@/lib/hedera/hcs";
import { ensureFtForWell, transferPayouts } from "@/lib/hedera/hts";
import { calcPayouts } from "@/lib/settlement/calc";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";
import { requireAgent } from "@/lib/auth/roles";
import { Role } from "@/lib/types";

interface SettlementExecuteBody {
  messageId: string;
  settlementId: string;
  executedBy: string;
  timestamp: string;
  assetType?: "HBAR" | "TOKEN"; // Optional, defaults to TOKEN
}

async function handlePOST(request: NextRequest, context: any, body: SettlementExecuteBody): Promise<Response> {
  try {
    // Require AGENT role for settlement execution
    const user = await requireAgent(request);
    const result = await ensureIdempotent(
      body.messageId,
      "/api/settlements/execute",
      async () => {
    // Get settlement
    const settlement = await prisma.settlement.findUnique({
      where: { id: body.settlementId },
      include: {
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

    // Compute recipients via calcPayouts
    const recipients = await calcPayouts({
      wellId: settlement.wellId,
      grossRevenue: settlement.grossRevenue || 0,
    });

    if (recipients.length === 0) {
      throw new Error("No valid recipients found for settlement");
    }

    // Determine asset type (default to TOKEN)
    const assetType = body.assetType || "TOKEN";
    let tokenId: string | undefined;
    let transferResults: { account: string; txId: string }[];

    if (assetType === "TOKEN") {
      // Ensure FT exists for well
      const token = await ensureFtForWell(settlement.wellId);
      tokenId = token.tokenId;

      // Execute token transfers
      transferResults = await transferPayouts({
        assetType: "TOKEN",
        tokenId,
        recipients,
      });
    } else {
      // Execute HBAR transfers
      transferResults = await transferPayouts({
        assetType: "HBAR",
        recipients,
      });
    }

    // Update settlement and upsert payout records
    const updatedSettlement = await prisma.$transaction(async (tx) => {
      // Update settlement
      const updated = await tx.settlement.update({
        where: { id: body.settlementId },
        data: {
          status: "EXECUTED",
          executeEventId: body.messageId,
        },
      });

      // Upsert payout records (unique by settlementId+recipient+assetType)
      for (const recipient of recipients) {
        const transferResult = transferResults.find(r => r.account === recipient.account);
        
        await tx.payout.upsert({
          where: {
            settlementId_recipientAccount_assetType: {
              settlementId: body.settlementId,
              recipientAccount: recipient.account,
              assetType,
            },
          },
          update: {
            amount: recipient.amount,
            tokenId,
            txId: transferResult?.txId,
            status: "COMPLETED",
          },
          create: {
            settlementId: body.settlementId,
            recipientAccount: recipient.account,
            assetType,
            amount: recipient.amount,
            tokenId,
            txId: transferResult?.txId,
            status: "COMPLETED",
          },
        });
      }

      return updated;
    });

    // Emit two HCS events as required
    
    // 1. PAYOUT_DISTRIBUTED event with recipients array
    await submitMessage(settlement.wellId, {
      type: "PAYOUT_DISTRIBUTED",
      payload: {
        settlementId: body.settlementId,
        assetType,
        tokenId,
        recipients: recipients.map(r => ({
          account: r.account,
          amount: r.amount,
        })),
        transferResults,
        timestamp: body.timestamp,
      },
    });

    // 2. SETTLEMENT_EXECUTED event
    await submitMessage(settlement.wellId, {
      type: "SETTLEMENT_EXECUTED",
      payload: {
        settlementId: body.settlementId,
        executedBy: body.executedBy,
        timestamp: body.timestamp,
        assetType,
        tokenId,
        totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
        recipientCount: recipients.length,
      },
    });

    return {
      settlement: updatedSettlement,
      assetType,
      tokenId,
      recipients,
      transferResults,
    };
      }
    );
  
  return NextResponse.json(result);
  } catch (error) {
    console.error('Settlement execute error:', error);
    return NextResponse.json(
      { error: 'internal_server_error', details: [error instanceof Error ? error.message : 'An unexpected error occurred'] },
      { status: 500 }
    );
  }
}

// Simple schema for now
const settlementExecuteSchema = {
  type: "object",
  properties: {
    messageId: { type: "string" },
    settlementId: { type: "string" },
    executedBy: { type: "string" },
    timestamp: { type: "string" }
  },
  required: ["messageId", "settlementId", "executedBy", "timestamp"],
  additionalProperties: false
};

export const POST = withSchema(settlementExecuteSchema, handlePOST);
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