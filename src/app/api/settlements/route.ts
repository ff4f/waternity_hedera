import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import settlementRequestSchema from "@/lib/validator/schemas/settlement_request.schema.json";
import { 
  TransferTransaction,
  TokenId,
  AccountId,
  Hbar
} from "@hashgraph/sdk";
import { createHederaClient } from "@/lib/hedera/client";

// Settlement creation function
async function createSettlement({ 
  fromAccountId,
  toAccountId,
  tokenId,
  amount,
  hbarAmount = 0
}: { 
  fromAccountId: string;
  toAccountId: string;
  tokenId?: string;
  amount?: number;
  hbarAmount?: number;
}) {
  // Use mock mode for development
  if (process.env.HEDERA_MOCK_MODE === 'true') {
    console.log('Mock Settlement Creation:', { fromAccountId, toAccountId, tokenId, amount, hbarAmount });
    return {
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
      status: 'SUCCESS',
      settlementId: `settlement_${Date.now()}`
    };
  }

  const client = createHederaClient();
  
  let transaction;
  
  if (tokenId && amount) {
    // Token transfer
    transaction = new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccountId), -amount)
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccountId), amount)
      .setMaxTransactionFee(new Hbar(20));
  } else if (hbarAmount > 0) {
    // HBAR transfer
    transaction = new TransferTransaction()
      .addHbarTransfer(AccountId.fromString(fromAccountId), new Hbar(-hbarAmount))
      .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(hbarAmount))
      .setMaxTransactionFee(new Hbar(20));
  } else {
    throw new Error('Either token transfer or HBAR transfer must be specified');
  }

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
    status: receipt.status.toString(),
    settlementId: `settlement_${Date.now()}`
  };
}

async function createSettlementHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  const { 
    wellId, 
    buyerAccountId, 
    sellerAccountId, 
    waterAmount, 
    pricePerLiter, 
    paymentMethod = 'TOKEN' 
  } = body;
  
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key header is required" }, { status: 400 });
  }

  // Find the well
  const well = await prisma.well.findUnique({
    where: { id: wellId },
    include: { operator: true }
  });

  if (!well) {
    return NextResponse.json({ error: "Well not found" }, { status: 404 });
  }

  const totalPrice = waterAmount * pricePerLiter;

  // Create settlement record in database
  const settlement = await prisma.settlement.create({
    data: {
      wellId,
      buyerAccountId,
      sellerAccountId: sellerAccountId || well.operator.accountId,
      waterAmount,
      pricePerLiter,
      totalPrice,
      paymentMethod,
      status: 'PENDING'
    }
  });

  // Execute the settlement transaction
  let settlementResult;
  if (paymentMethod === 'TOKEN' && well.tokenId) {
    settlementResult = await createSettlement({
      fromAccountId: buyerAccountId,
      toAccountId: sellerAccountId || well.operator.accountId,
      tokenId: well.tokenId,
      amount: waterAmount
    });
  } else {
    settlementResult = await createSettlement({
      fromAccountId: buyerAccountId,
      toAccountId: sellerAccountId || well.operator.accountId,
      hbarAmount: totalPrice
    });
  }

  // Update settlement with transaction details
  const updatedSettlement = await prisma.settlement.update({
    where: { id: settlement.id },
    data: {
      transactionId: settlementResult.transactionId,
      status: settlementResult.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED'
    }
  });

  return new Response(JSON.stringify({
    settlement: updatedSettlement,
    transaction: settlementResult
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}

async function getSettlementsHandler(req: NextRequest, context?: any) {
  const url = new URL(req.url);
  const wellCode = url.searchParams.get('wellId'); // This is actually well code
  const buyerAccountId = url.searchParams.get('buyerAccountId');
  const sellerAccountId = url.searchParams.get('sellerAccountId');
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const where: any = {};
  
  // If wellCode is provided, find the well by code first
  if (wellCode) {
    const well = await prisma.well.findUnique({
      where: { code: wellCode }
    });
    if (well) {
      where.wellId = well.id;
    } else {
      // If well not found, return empty results
      return NextResponse.json({
        settlements: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      });
    }
  }
  
  if (buyerAccountId) where.buyerAccountId = buyerAccountId;
  if (sellerAccountId) where.sellerAccountId = sellerAccountId;
  if (status) where.status = status;

  const [settlements, total] = await Promise.all([
    prisma.settlement.findMany({
      where,
      include: {
        well: {
          include: {
            operator: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.settlement.count({ where })
  ]);

  return NextResponse.json({
    settlements,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

// Handle different HTTP methods
export async function POST(req: NextRequest) {
  return withSchemaAndIdempotency(settlementRequestSchema, createSettlementHandler)(req);
}

export async function GET(req: NextRequest) {
  return getSettlementsHandler(req);
}