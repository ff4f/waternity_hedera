import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";
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

async function createTokenHandler(req: NextRequest, context?: any) {
  const body = await req.json();
  const { wellId, tokenName, tokenSymbol, initialSupply = 0 } = body;
  
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

  if (well.tokenId) {
    return NextResponse.json({ error: "Well already has a token" }, { status: 400 });
  }

  const result = await ensureIdempotent(
    idempotencyKey,
    'hts_create_token',
    async () => {
      const htsResult = await createWaterToken({
        name: tokenName,
        symbol: tokenSymbol,
        decimals: 2,
        initialSupply,
        treasuryAccountId: well.operator.accountId
      });

      // Update well with token ID
      await prisma.well.update({
        where: { id: wellId },
        data: { tokenId: htsResult.tokenId }
      });

      return {
        ...htsResult,
        wellId,
        tokenName,
        tokenSymbol
      };
    }
  );

  if (result.isNew) {
    return NextResponse.json(result.result, {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return NextResponse.json({ message: "Token already created", resultHash: result.resultHash }, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function mintTokenHandler(req: NextRequest, context?: any) {
  const body = await req.json();
  const { wellId, amount } = body;
  
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

  if (!well.tokenId) {
    return NextResponse.json({ error: "Well does not have a token" }, { status: 400 });
  }

  const result = await ensureIdempotent(
    idempotencyKey,
    'hts_mint_token',
    async () => {
      const htsResult = await mintWaterToken({
        tokenId: well.tokenId!,
        amount
      });

      return {
        ...htsResult,
        wellId,
        tokenId: well.tokenId,
        amount
      };
    }
  );

  if (result.isNew) {
    return NextResponse.json(result.result, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return NextResponse.json({ message: "Mint operation already processed", resultHash: result.resultHash }, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Handle different HTTP methods
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  
  if (action === 'mint') {
    return withSchema('hts_mint.schema.json', mintTokenHandler)(req);
  } else {
    return withSchema('hts_create.schema.json', createTokenHandler)(req);
  }
}