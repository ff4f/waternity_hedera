import {
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TransferTransaction,
  Hbar,
} from "@hashgraph/sdk";
import { prisma } from "@/lib/db/prisma";
import { getOperator } from "./client";
import { env } from "@/lib/env";

export async function ensureFtForWell(wellId: string) {
  const { client, operatorAccountId, operatorPrivateKey } = getOperator();
  
  // Check if token already exists for this well
  const existingToken = await prisma.token.findFirst({ where: { wellId } });
  if (existingToken) {
    return existingToken;
  }

  // Get decimals from environment or use default
  const decimals = process.env.TOKEN_DECIMALS ? parseInt(process.env.TOKEN_DECIMALS) : 6;
  
  // Create new fungible token for the well
  const tx = new TokenCreateTransaction()
    .setTokenName(`Waternity Well ${wellId}`)
    .setTokenSymbol("H2O")
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(decimals)
    .setInitialSupply(0)
    .setTreasuryAccountId(operatorAccountId)
    .setAdminKey(operatorPrivateKey.publicKey)
    .setSupplyKey(operatorPrivateKey.publicKey)
    .setFreezeDefault(false);

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const tokenId = receipt.tokenId;

  if (!tokenId) {
    throw new Error("Token creation failed - no token ID returned");
  }

  // Store token information in database
  const newToken = await prisma.token.create({
    data: {
      tokenId: tokenId.toString(),
      wellId,
      type: "FungibleCommon",
      name: `Waternity Well ${wellId}`,
      symbol: "H2O",
      treasuryAccount: operatorAccountId.toString(),
      decimals,
    },
  });

  return newToken;
}

export async function transferPayouts({
  assetType,
  tokenId,
  recipients,
}: {
  assetType: "HBAR" | "TOKEN";
  tokenId?: string;
  recipients: { account: string; amount: number }[];
}) {
  const { client, operatorAccountId } = getOperator();
  
  if (recipients.length === 0) {
    return [];
  }

  let txResponse;
  
  if (assetType === "TOKEN") {
    if (!tokenId) {
      throw new Error("Token ID is required for token transfers");
    }
    
    // Use TransferTransaction for batching all token recipients
    const tx = new TransferTransaction();
    
    // Calculate total amount to transfer from treasury
    const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
    
    // Transfer from treasury to recipients
    tx.addTokenTransfer(tokenId, operatorAccountId, -totalAmount);
    
    for (const recipient of recipients) {
      if (recipient.amount > 0) {
        tx.addTokenTransfer(tokenId, recipient.account, recipient.amount);
      }
    }
    
    txResponse = await tx.execute(client);
    
  } else {
    // Use CryptoTransferTransaction for HBAR - one transaction including all transfers
    const tx = new TransferTransaction();
    
    // Calculate total amount to transfer from treasury
    const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
    
    // Transfer from treasury to recipients
    tx.addHbarTransfer(operatorAccountId, Hbar.fromTinybars(-totalAmount));
    
    for (const recipient of recipients) {
      if (recipient.amount > 0) {
        tx.addHbarTransfer(recipient.account, Hbar.fromTinybars(recipient.amount));
      }
    }
    
    txResponse = await tx.execute(client);
  }

  // Wait for transaction to be processed
  await txResponse.getReceipt(client);

  // Return transaction details for each recipient
  return recipients.map((r) => ({
    account: r.account,
    txId: txResponse.transactionId.toString(),
  }));
}