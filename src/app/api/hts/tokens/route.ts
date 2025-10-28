import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import htsTokenCreateSchema from '@/lib/validator/schemas/hts_token_create.schema.json';
import htsMintSchema from '@/lib/validator/schemas/hts_mint.schema.json';
import { forbidden, serverError } from '@/lib/http/errors';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';
import { 
  TokenCreateTransaction, 
  TokenType, 
  TokenSupplyType,
  Hbar,
  TokenMintTransaction,
  TokenId
} from "@hashgraph/sdk";
import { createHederaClient } from "@/lib/hedera/client";
import { env } from "@/lib/env";
import { rateLimit, createUserKey } from "@/lib/http/rateLimit";

// HTS Token creation function
async function createWaterToken({ 
  name, 
  symbol, 
  decimals = 2, 
  initialSupply = 0,
  treasuryAccountId 
}: { 
  name: string; 
  symbol: string; 
  decimals?: number; 
  initialSupply?: number;
  treasuryAccountId: string;
}) {
  // Use mock mode for development
  if (process.env.HEDERA_MOCK_MODE === 'true') {
    console.log('Mock HTS Token Creation:', { name, symbol, decimals, initialSupply, treasuryAccountId });
    return {
      tokenId: `0.0.${Math.floor(Math.random() * 1000000)}`,
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
      status: 'SUCCESS'
    };
  }

  const client = createHederaClient();
  
  const transaction = new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(decimals)
    .setInitialSupply(initialSupply)
    .setTreasuryAccountId(treasuryAccountId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setMaxTransactionFee(new Hbar(30));

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    tokenId: receipt.tokenId?.toString() || '',
    transactionId: response.transactionId.toString(),
    status: receipt.status.toString()
  };
}

// HTS Token minting function
async function mintWaterToken({ 
  tokenId, 
  amount 
}: { 
  tokenId: string; 
  amount: number; 
}) {
  // Use mock mode for development
  if (process.env.HEDERA_MOCK_MODE === 'true') {
    console.log('Mock HTS Token Mint:', { tokenId, amount });
    return {
      transactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
      newTotalSupply: Math.floor(Math.random() * 1000000).toString(),
      status: 'SUCCESS'
    };
  }

  const client = createHederaClient();
  
  const transaction = new TokenMintTransaction()
    .setTokenId(TokenId.fromString(tokenId))
    .setAmount(amount)
    .setMaxTransactionFee(new Hbar(20));

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
    newTotalSupply: receipt.totalSupply?.toString() || '0',
    status: receipt.status.toString()
  };
}

async function createTokenHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  console.log('[HTS] POST /api/hts/tokens - Creating HTS token');
  
  // Require OPERATOR or ADMIN role
  const user = await requireUser(req);
  assertRole(user, 'OPERATOR', 'ADMIN');

  // Rate limiting: restrict token creation frequency per user
  try {
    const rateKey = createUserKey(user.id, 'hts-create');
    await rateLimit({ key: rateKey, limit: 5, windowMs: 60 * 60 * 1000 }); // 5 per hour
  } catch (error: any) {
    if (error.code === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ 
          error: 'rate_limit_exceeded', 
          details: ['Too many token creation requests. Please try again later.'],
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
  
  // Accept schema-aligned fields and fallback to legacy names
  const wellId: string = body.wellId;
  const name: string = body.name ?? body.tokenName;
  const symbol: string = body.symbol ?? body.tokenSymbol;
  const decimals: number = typeof body.decimals === 'number' ? body.decimals : 2;
  const initialSupplyRaw = body.initialSupply ?? 0;
  const initialSupply: number = typeof initialSupplyRaw === 'string' ? parseInt(initialSupplyRaw, 10) : Number(initialSupplyRaw);

  // Find the well
  const well = await prisma.well.findUnique({
    where: { id: wellId },
    include: { 
      operator: true
    }
  });

  if (!well) {
    return NextResponse.json({ error: "Well not found" }, { status: 404 });
  }

  if (well.tokenId) {
    return NextResponse.json({ error: "Well already has a token" }, { status: 400 });
  }

  try {
      console.log('[HTS] Creating token on Hedera:', name, symbol);
      const htsResult = await createWaterToken({
        name,
        symbol,
        decimals,
        initialSupply,
        treasuryAccountId: env.HEDERA_ACCOUNT_ID
      });

      // Update well with token ID
      await prisma.well.update({
        where: { id: wellId },
        data: { tokenId: htsResult.tokenId }
      });

    console.log('[HTS] Token created successfully - tokenId:', htsResult.tokenId, 'txId:', htsResult.transactionId);
    
    return new Response(JSON.stringify({
      ...htsResult,
      wellId,
      tokenName: name,
      tokenSymbol: symbol
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[HTS] Error creating token:', error);
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}

async function mintTokenHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  // Require OPERATOR or ADMIN role
  const user = await requireUser(req);
  assertRole(user, 'OPERATOR', 'ADMIN');

  // Rate limiting: allow frequent minting but protect abuse
  try {
    const rateKey = createUserKey(user.id, 'hts-mint');
    await rateLimit({ key: rateKey, limit: 60, windowMs: 60 * 1000 }); // 60 per minute
  } catch (error: any) {
    if (error.code === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ 
          error: 'rate_limit_exceeded', 
          details: ['Too many token mint requests. Please try again later.'],
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
  
  // Accept schema-aligned fields
  const tokenId: string = body.tokenId;
  const amountRaw = body.amount;
  const amount: number = typeof amountRaw === 'string' ? parseInt(amountRaw, 10) : Number(amountRaw);

  if (!tokenId) {
    return new Response(JSON.stringify({ error: "Token ID is required" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Optionally find the well by tokenId (for contextual response)
  const well = await prisma.well.findFirst({
    where: { tokenId },
    select: { id: true }
  });

  try {
    const htsResult = await mintWaterToken({
      tokenId,
      amount
    });

    return new Response(JSON.stringify({
      ...htsResult,
      wellId: well?.id,
      tokenId,
      amount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error minting token:', error);
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    return new Response(JSON.stringify({
      error: 'Failed to mint token'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle different HTTP methods
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  
  if (action === 'mint') {
    return withSchemaAndIdempotency(htsMintSchema, mintTokenHandler)(req);
  } else {
    return withSchemaAndIdempotency(htsTokenCreateSchema, createTokenHandler)(req);
  }
}