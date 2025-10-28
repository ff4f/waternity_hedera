import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import settlementRequestSchema from "@/lib/validator/schemas/settlement_request.schema.json";
import { logger } from "@/lib/log";
import { 
  TransferTransaction,
  TokenId,
  AccountId,
  Hbar
} from "@hashgraph/sdk";
import { createHederaClient } from "@/lib/hedera/client";

export const runtime = 'nodejs';


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
    const mockTxId = `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`;
    logger.info('Mock settlement creation', { 
      fromAccountId, 
      toAccountId, 
      tokenId, 
      amount, 
      hbarAmount,
      txId: mockTxId
    });
    return {
      transactionId: mockTxId,
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
  // Require OPERATOR or ADMIN role for creating settlements
  const user = await requireUser(req);
  assertRole(user, 'OPERATOR', 'ADMIN');
  
  // Rate limiting: 30 requests per 5 minutes per user
  try {
    const rateLimitKey = createUserKey(user.id, 'settlements');
    await rateLimit({
      key: rateLimitKey,
      limit: 30,
      windowMs: 300000 // 5 minutes in milliseconds
    });
  } catch (error: any) {
    if (error.code === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ 
          error: 'rate_limit_exceeded', 
          details: ['Too many settlement requests. Please try again later.'],
          retryAfter: error.details.retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': error.details.retryAfter.toString()
          } 
        }
      );
    }
    throw error;
  }
  
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
      periodStart: new Date(),
      periodEnd: new Date(),
      kwhTotal: 0,
      grossRevenue: totalPrice,
      status: 'DRAFT'
    }
  });

  // Execute the settlement transaction
  let settlementResult;
  if (paymentMethod === 'TOKEN' && well.tokenId) {
    settlementResult = await createSettlement({
      fromAccountId: buyerAccountId,
      toAccountId: sellerAccountId || well.operator.hederaAccountId,
      tokenId: well.tokenId,
      amount: waterAmount
    });
  } else {
    settlementResult = await createSettlement({
      fromAccountId: buyerAccountId,
      toAccountId: sellerAccountId || well.operator.hederaAccountId,
      hbarAmount: totalPrice
    });
  }

  // Update settlement with transaction result
  await prisma.settlement.update({
    where: { id: settlement.id },
    data: {
      status: settlementResult.status === 'SUCCESS' ? 'EXECUTED' : 'FAILED'
    }
  });

  return new Response(JSON.stringify({
    settlement: settlement,
    transaction: settlementResult
  }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}

import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from "@/lib/auth/roles";
import { rateLimit, createUserKey } from "@/lib/http/rateLimit";

async function getSettlementsHandler(req: NextRequest, context?: any) {
  try {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
    logger.info('Settlements fetch started', { requestId });
    
    // Authentication and authorization
    const user = await requireUser(req);
    assertRole(user, 'OPERATOR', 'ADMIN', 'INVESTOR');
    
    // Rate limiting: 30 requests per 5 minutes per user
    try {
      const rateLimitKey = createUserKey(user.id, 'settlements-get');
      await rateLimit({
        key: rateLimitKey,
        limit: 30,
        windowMs: 300000 // 5 minutes in milliseconds
      });
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED') {
        return NextResponse.json({ 
          error: 'rate_limit_exceeded', 
          details: ['Too many settlement fetch requests. Please try again later.'],
          retryAfter: error.details.retryAfter
        }, { 
          status: 429,
          headers: {
            'Retry-After': error.details.retryAfter.toString()
          }
        });
      }
      throw error;
    }
    
    const url = new URL(req.url);
    const wellCode = url.searchParams.get('wellCode');
    const wellId = url.searchParams.get('wellId');
    const status = url.searchParams.get('status');
    const periodStart = url.searchParams.get('periodStart');
    const periodEnd = url.searchParams.get('periodEnd');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100); // Max 100
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

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
    
    // Direct wellId filter
    if (wellId) {
      where.wellId = wellId;
    }
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Date range filters
    if (periodStart) {
      where.periodStart = { gte: new Date(periodStart) };
    }
    if (periodEnd) {
      where.periodEnd = { lte: new Date(periodEnd) };
    }
    
    // Role-based filtering
    if (user.role?.name === 'OPERATOR') {
      // Operators can only see settlements for wells they operate
      const operatorWells = await prisma.well.findMany({
        where: { operatorUserId: user.id },
        select: { id: true }
      });
      const wellIds = operatorWells.map(w => w.id);
      
      if (where.wellId) {
        // If wellId is specified, check if operator has access
        if (!wellIds.includes(where.wellId)) {
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
      } else {
        // Filter to only wells the operator manages
        where.wellId = { in: wellIds };
      }
    } else if (user.role?.name === 'INVESTOR') {
      // Investors can only see settlements for wells they have membership in
      const investorWells = await prisma.wellMembership.findMany({
        where: { userId: user.id },
        select: { wellId: true }
      });
      const wellIds = investorWells.map(m => m.wellId);
      
      if (where.wellId) {
        // If wellId is specified, check if investor has access
        if (!wellIds.includes(where.wellId)) {
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
      } else {
        // Filter to only wells the investor has membership in
        where.wellId = { in: wellIds };
      }
    }
    // Admins can see all settlements (no additional filtering)

    // Build orderBy object
    const orderBy: any = {};
    if (sortBy === 'periodStart' || sortBy === 'periodEnd' || sortBy === 'createdAt' || sortBy === 'grossRevenue' || sortBy === 'kwhTotal') {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          well: {
            include: {
              operator: {
                 select: {
                   id: true,
                   name: true
                 }
               }
            }
          },
          payouts: {
            select: {
              id: true,
              recipientAccount: true,
              assetType: true,
              amount: true,
              status: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.settlement.count({ where })
    ]);

    logger.info('Settlements fetched successfully', {
      requestId,
      userId: user.id,
      count: settlements.length,
      total,
      limit,
      offset
    });
    
    return NextResponse.json({
      settlements,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
    logger.error('Settlements fetch failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}

// Handle different HTTP methods
export async function POST(req: NextRequest) {
  try {
    return await withSchemaAndIdempotency(settlementRequestSchema, createSettlementHandler)(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('Settlement creation failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    return await getSettlementsHandler(req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    logger.error('Settlements GET failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}