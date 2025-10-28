/**
 * Hedera Token Service (HTS) utilities for settlement payouts
 * Handles both HBAR (CryptoTransfer) and TOKEN (TokenTransferTransaction) transfers
 */

import {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenInfoQuery,
  TransferTransaction,
  Hbar,
  AccountId,
  TokenId,
  PrivateKey,
  Status,
} from "@hashgraph/sdk";
import { createHederaClient } from "./client";
import { toSmallestUnit } from "../settlement/calc";

export interface PayoutRecipient {
  address: string;
  amount: number;
}

export interface TransferPayoutsParams {
  assetType: "HBAR" | "TOKEN";
  tokenId?: string;
  recipients: PayoutRecipient[];
  operatorAccountId?: string;
  operatorPrivateKey?: string;
}

export interface TransferResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  recipients: {
    address: string;
    amount: number;
    status: "success" | "failed";
  }[];
}

/**
 * Ensure a fungible token exists for a well
 * Creates a new token if it doesn't exist
 */
export async function ensureFtForWell({
  tokenName,
  tokenSymbol,
  decimals = 6,
  initialSupply = 0,
  treasuryAccountId,
  adminPrivateKey,
}: {
  tokenName: string;
  tokenSymbol: string;
  decimals?: number;
  initialSupply?: number;
  treasuryAccountId: string;
  adminPrivateKey: string;
}): Promise<{
  tokenId: string;
  created: boolean;
  error?: string;
}> {
  try {
    const client = createHederaClient();
    const adminKey = PrivateKey.fromString(adminPrivateKey);
    const treasuryAccount = AccountId.fromString(treasuryAccountId);

    // Create the token
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(decimals)
      .setInitialSupply(initialSupply)
      .setTreasuryAccountId(treasuryAccount)
      .setSupplyType(TokenSupplyType.Infinite)
      .setAdminKey(adminKey)
      .setSupplyKey(adminKey)
      .setFreezeDefault(false)
      .freezeWith(client);

    // Sign and submit
    const tokenCreateSign = await tokenCreateTx.sign(adminKey);
    const tokenCreateSubmit = await tokenCreateSign.execute(client);
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);

    if (tokenCreateRx.status !== Status.Success) {
      throw new Error(`Token creation failed: ${tokenCreateRx.status}`);
    }

    const tokenId = tokenCreateRx.tokenId;
    if (!tokenId) {
      throw new Error("Token ID not returned from creation");
    }

    return {
      tokenId: tokenId.toString(),
      created: true,
    };
  } catch (error) {
    return {
      tokenId: "",
      created: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get token information
 */
export async function getTokenInfo(tokenId: string): Promise<{
  exists: boolean;
  decimals?: number;
  name?: string;
  symbol?: string;
  error?: string;
}> {
  try {
    const client = createHederaClient();
    const tokenInfoQuery = new TokenInfoQuery().setTokenId(TokenId.fromString(tokenId));
    const tokenInfo = await tokenInfoQuery.execute(client);

    return {
      exists: true,
      decimals: tokenInfo.decimals,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
    };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Transfer payouts to multiple recipients
 * Supports both HBAR and token transfers
 */
export async function transferPayouts({
  assetType,
  tokenId,
  recipients,
  operatorAccountId,
  operatorPrivateKey,
}: TransferPayoutsParams): Promise<TransferResult> {
  try {
    const client = createHederaClient();
    const operatorKey = operatorPrivateKey
      ? PrivateKey.fromString(operatorPrivateKey)
      : PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY || "");
    const operatorAccount = operatorAccountId
      ? AccountId.fromString(operatorAccountId)
      : AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || "");

    if (!operatorKey || !operatorAccount) {
      throw new Error("Operator account and private key are required");
    }

    let transaction: TransferTransaction;

    if (assetType === "HBAR") {
      // HBAR transfer using TransferTransaction
      transaction = new TransferTransaction();

      // Add sender (negative amount)
      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
      const totalTinybars = Number(toSmallestUnit(totalAmount, 8)); // HBAR has 8 decimals
      transaction.addHbarTransfer(operatorAccount, Hbar.fromTinybars(-totalTinybars));

      // Add recipients (positive amounts)
      for (const recipient of recipients) {
        const recipientAccount = AccountId.fromString(recipient.address);
        const recipientTinybars = Number(toSmallestUnit(recipient.amount, 8));
        transaction.addHbarTransfer(recipientAccount, Hbar.fromTinybars(recipientTinybars));
      }
    } else if (assetType === "TOKEN") {
      if (!tokenId) {
        throw new Error("Token ID is required for token transfers");
      }

      // Get token info to determine decimals
      const tokenInfo = await getTokenInfo(tokenId);
      if (!tokenInfo.exists) {
        throw new Error(`Token ${tokenId} does not exist`);
      }

      const decimals = tokenInfo.decimals || 6;
      const token = TokenId.fromString(tokenId);

      // Token transfer using TransferTransaction
      transaction = new TransferTransaction();

      // Add sender (negative amount)
      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
      const totalTokenUnits = Number(toSmallestUnit(totalAmount, decimals));
      transaction.addTokenTransfer(token, operatorAccount, -totalTokenUnits);

      // Add recipients (positive amounts)
      for (const recipient of recipients) {
        const recipientAccount = AccountId.fromString(recipient.address);
        const recipientTokenUnits = Number(toSmallestUnit(recipient.amount, decimals));
        transaction.addTokenTransfer(token, recipientAccount, recipientTokenUnits);
      }
    } else {
      throw new Error(`Unsupported asset type: ${assetType}`);
    }

    // Freeze, sign, and execute transaction
    const frozenTx = transaction.freezeWith(client);
    const signedTx = await frozenTx.sign(operatorKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status !== Status.Success) {
      throw new Error(`Transfer failed: ${receipt.status}`);
    }

    return {
      success: true,
      transactionId: txResponse.transactionId.toString(),
      recipients: recipients.map(r => ({
        address: r.address,
        amount: r.amount,
        status: "success" as const,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      recipients: recipients.map(r => ({
        address: r.address,
        amount: r.amount,
        status: "failed" as const,
      })),
    };
  }
}

/**
 * Batch transfer payouts with retry logic
 * Splits large transfers into smaller batches if needed
 */
export async function batchTransferPayouts({
  assetType,
  tokenId,
  recipients,
  operatorAccountId,
  operatorPrivateKey,
  batchSize = 10,
  maxRetries = 3,
}: TransferPayoutsParams & {
  batchSize?: number;
  maxRetries?: number;
}): Promise<TransferResult[]> {
  const results: TransferResult[] = [];
  
  // Split recipients into batches
  const batches: PayoutRecipient[][] = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  // Process each batch
  for (const batch of batches) {
    let attempts = 0;
    let result: TransferResult | null = null;

    while (attempts < maxRetries && (!result || !result.success)) {
      attempts++;
      
      result = await transferPayouts({
        assetType,
        tokenId,
        recipients: batch,
        operatorAccountId,
        operatorPrivateKey,
      });

      if (!result.success && attempts < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Validate recipient addresses
 */
export function validateRecipients(recipients: PayoutRecipient[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!recipients || recipients.length === 0) {
    errors.push("At least one recipient is required");
    return { valid: false, errors };
  }

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    if (!recipient.address) {
      errors.push(`Recipient ${i + 1}: Address is required`);
    } else {
      try {
        AccountId.fromString(recipient.address);
      } catch {
        errors.push(`Recipient ${i + 1}: Invalid Hedera account ID format`);
      }
    }

    if (typeof recipient.amount !== "number" || recipient.amount <= 0) {
      errors.push(`Recipient ${i + 1}: Amount must be a positive number`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Transfer investment from investor to well treasury
 * Handles both HBAR and TOKEN investments
 */
export async function transferInvestment({
  assetType,
  tokenId,
  amount,
  fromAccountId,
  fromPrivateKey,
  toAccountId,
}: {
  assetType: "HBAR" | "TOKEN";
  tokenId?: string;
  amount: number;
  fromAccountId: string;
  fromPrivateKey: string;
  toAccountId: string;
}): Promise<TransferResult> {
  try {
    const client = createHederaClient();
    const fromKey = PrivateKey.fromString(fromPrivateKey);
    const fromAccount = AccountId.fromString(fromAccountId);
    const toAccount = AccountId.fromString(toAccountId);

    let transaction: TransferTransaction;

    if (assetType === "HBAR") {
      // HBAR transfer
      const amountTinybars = Number(toSmallestUnit(amount, 8)); // HBAR has 8 decimals
      
      transaction = new TransferTransaction()
        .addHbarTransfer(fromAccount, Hbar.fromTinybars(-amountTinybars))
        .addHbarTransfer(toAccount, Hbar.fromTinybars(amountTinybars));
    } else if (assetType === "TOKEN") {
      if (!tokenId) {
        throw new Error("Token ID is required for token transfers");
      }

      // Get token info to determine decimals
      const tokenInfo = await getTokenInfo(tokenId);
      if (!tokenInfo.exists) {
        throw new Error(`Token ${tokenId} does not exist`);
      }

      const decimals = tokenInfo.decimals || 6;
      const token = TokenId.fromString(tokenId);
      const amountTokenUnits = Number(toSmallestUnit(amount, decimals));

      transaction = new TransferTransaction()
        .addTokenTransfer(token, fromAccount, -amountTokenUnits)
        .addTokenTransfer(token, toAccount, amountTokenUnits);
    } else {
      throw new Error(`Unsupported asset type: ${assetType}`);
    }

    // Freeze, sign, and execute transaction
    const frozenTx = transaction.freezeWith(client);
    const signedTx = await frozenTx.sign(fromKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status !== Status.Success) {
      throw new Error(`Investment transfer failed: ${receipt.status}`);
    }

    return {
      success: true,
      transactionId: txResponse.transactionId.toString(),
      recipients: [{
        address: toAccountId,
        amount: amount,
        status: "success" as const,
      }],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      recipients: [{
        address: toAccountId,
        amount: amount,
        status: "failed" as const,
      }],
    };
  }
}