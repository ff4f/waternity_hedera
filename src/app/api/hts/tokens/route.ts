import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import htsTokenCreateSchema from '@/lib/validator/schemas/hts_token_create.schema.json';
import htsMintSchema from '@/lib/validator/schemas/hts_mint.schema.json';
import { 
  TokenCreateTransaction, 
  TokenType, 
  TokenSupplyType,
  Hbar,
  TokenMintTransaction,
  TokenId
} from "@hashgraph/sdk";
import { createHederaClient } from "@/lib/hedera/client";

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
  const { wellId, tokenName, tokenSymbol, initialSupply = 0 } = body;
  


  // Find the well
  const well = await prisma.well.findUnique({
    where: { id: wellId },
    include: { operator: true }
  });

  if (!well) {
    return NextResponse.json({ error: "Well not found" }, { status: 404 });
  }

  if (well.tokenId) {
    return NextResponse.json({ error: "Well already has a token" }, { status: 400 });
  }

  try {
      const htsResult = await createWaterToken({
        name: tokenName,
        symbol: tokenSymbol,
        decimals: 2,
        initialSupply,
        treasuryAccountId: well.operator.accountId || ''
      });

      // Update well with token ID
      await prisma.well.update({
        where: { id: wellId },
        data: { tokenId: htsResult.tokenId }
      });

    return new Response(JSON.stringify({
      ...htsResult,
      wellId,
      tokenName,
      tokenSymbol
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create token'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function mintTokenHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  const { wellId, amount } = body;

  // Find the well
  const well = await prisma.well.findUnique({
    where: { id: wellId },
    include: { operator: true }
  });

  if (!well) {
    return new Response(JSON.stringify({ error: "Well not found" }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!well.tokenId) {
    return new Response(JSON.stringify({ error: "Well does not have a token" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const htsResult = await mintWaterToken({
      tokenId: well.tokenId!,
      amount
    });

    return new Response(JSON.stringify({
      ...htsResult,
      wellId,
      tokenId: well.tokenId,
      amount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error minting token:', error);
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