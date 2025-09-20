import {
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TransferTransaction,
} from "@hashgraph/sdk";
import { prisma } from "@/lib/db/prisma";
import { getOperator } from "./client";

export async function ensureFtForWell(wellId: string) {
  const { client, operatorAccountId, operatorPrivateKey } = getOperator();
  const token = await prisma.token.findFirst({ where: { wellId } });

  if (token) {
    return token;
  }

  const tx = new TokenCreateTransaction()
    .setTokenName(`Waternity Well ${wellId}`)
    .setTokenSymbol("H2O")
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(3)
    .setInitialSupply(0)
    .setTreasuryAccountId(operatorAccountId)
    .setAdminKey(operatorPrivateKey.publicKey)
    .setSupplyKey(operatorPrivateKey.publicKey);

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const tokenId = receipt.tokenId;

  if (!tokenId) {
    throw new Error("Token creation failed");
  }

  const newToken = await prisma.token.create({
    data: {
      tokenId: tokenId.toString(),
      wellId,
      type: "FungibleCommon",
      name: `Waternity Well ${wellId}`,
      symbol: "H2O",
      treasuryAccount: operatorAccountId.toString(),
      decimals: 3,
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
  const tx = new TransferTransaction();

  if (assetType === "TOKEN") {
    if (!tokenId) {
      throw new Error("Token ID is required for token transfers");
    }
    for (const recipient of recipients) {
      tx.addTokenTransfer(tokenId, recipient.account, recipient.amount);
    }
    // The treasury account must be involved in the transaction
    tx.addTokenTransfer(tokenId, operatorAccountId, 0);
  } else {
    for (const recipient of recipients) {
      tx.addHbarTransfer(recipient.account, recipient.amount);
    }
    // The treasury account must be involved in the transaction
    tx.addHbarTransfer(operatorAccountId, 0);
  }

  const txResponse = await tx.execute(client);
  await txResponse.getReceipt(client);

  return recipients.map((r) => ({
    account: r.account,
    txId: txResponse.transactionId.toString(),
  }));
}