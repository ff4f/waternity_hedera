import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { env } from "@/lib/env";
import { AccountCreateTransaction, Hbar } from "@hashgraph/sdk";
import { AccountBalanceQuery, TransferTransaction, Status } from "@hashgraph/sdk";

/**
 * Initialize Hedera SDK client from environment variables
 * @returns Configured Hedera client
 */
export function createHederaClient(): Client {
  // Only create client on server side
  if (typeof window !== 'undefined') {
    throw new Error('Hedera client should only be created on server side');
  }

  const operatorAccountId = AccountId.fromString(env.HEDERA_ACCOUNT_ID);
  const operatorPrivateKey = PrivateKey.fromString(env.HEDERA_PRIVATE_KEY);

  let client: Client;
  
  switch (env.HEDERA_NETWORK) {
    case 'mainnet':
      client = Client.forMainnet();
      break;
    case 'testnet':
      client = Client.forTestnet();
      break;
    case 'previewnet':
      client = Client.forPreviewnet();
      break;
    default:
      throw new Error(`Unsupported Hedera network: ${env.HEDERA_NETWORK}`);
  }

  client.setOperator(operatorAccountId, operatorPrivateKey);

  return client;
}

/**
 * Get operator account information
 * @returns Operator account ID and private key
 */
export function getOperator() {
  const operatorAccountId = AccountId.fromString(env.HEDERA_ACCOUNT_ID);
  const operatorPrivateKey = PrivateKey.fromString(env.HEDERA_PRIVATE_KEY);
  const client = createHederaClient();

  return { client, operatorAccountId, operatorPrivateKey };
}

/**
 * Get Hedera network configuration
 * @returns Network name and endpoints
 */
export function getNetworkConfig() {
  return {
    network: env.HEDERA_NETWORK,
    mirrorNodeUrl: env.MIRROR_NODE_URL,
    hashscanBase: env.HASHSCAN_BASE
  };
}

/**
 * Auto-refill a newly created testnet account with HBAR
 * This is more aggressive than ensureMinimumHbarBalance for new accounts
 */
export async function autoRefillNewTestnetAccount(accountId: string): Promise<{ success: boolean; balance: Hbar; transactionId?: string; }> {
  try {
    // Only auto-refill on testnet
    if (env.HEDERA_NETWORK !== 'testnet') {
      console.log(`[Hedera] Auto-refill skipped: not on testnet (current: ${env.HEDERA_NETWORK})`);
      const balance = await getHbarBalance(accountId);
      return { success: false, balance };
    }

    // Skip in mock mode
    if (env.HEDERA_MOCK_MODE as unknown as boolean) {
      console.log(`[Hedera] Auto-refill skipped: mock mode enabled`);
      return { success: false, balance: new Hbar(0) };
    }

    const REFILL_AMOUNT = Number(process.env.HEDERA_NEW_ACCOUNT_REFILL_HBAR || '20'); // 20 HBAR for new accounts
    const { client, operatorAccountId } = getOperator();

    console.log(`[Hedera] Auto-refilling new testnet account ${accountId} with ${REFILL_AMOUNT} HBAR`);

    // Check operator balance
    const operatorBalance = await getHbarBalance(operatorAccountId.toString());
    if (operatorBalance.toBigNumber().isLessThan(new Hbar(REFILL_AMOUNT + 2).toBigNumber())) {
      console.warn(`[Hedera] Insufficient operator balance for new account refill. Required: ${REFILL_AMOUNT + 2} HBAR, Available: ${operatorBalance.toString()}`);
      const balance = await getHbarBalance(accountId);
      return { success: false, balance };
    }

    // Perform refill transfer
    const transferTx = new TransferTransaction()
      .addHbarTransfer(operatorAccountId, new Hbar(-REFILL_AMOUNT))
      .addHbarTransfer(AccountId.fromString(accountId), new Hbar(REFILL_AMOUNT))
      .setMaxTransactionFee(new Hbar(2))
      .setTransactionMemo(`Waternity New Account Refill: ${REFILL_AMOUNT} HBAR`);

    const exec = await transferTx.execute(client);
    const receipt = await exec.getReceipt(client);

    if (receipt.status !== Status.Success) {
      console.warn(`[Hedera] New account refill failed with status: ${receipt.status}`);
      const balance = await getHbarBalance(accountId);
      return { success: false, balance };
    }

    // Wait for balance to update
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const updatedBalance = await getHbarBalance(accountId);
    console.log(`[Hedera] New account refill successful. Transaction: ${exec.transactionId.toString()}, Balance: ${updatedBalance.toString()}`);
    
    return { 
      success: true, 
      balance: updatedBalance, 
      transactionId: exec.transactionId.toString() 
    };
  } catch (error) {
    console.error('[Hedera] autoRefillNewTestnetAccount error:', error);
    try {
      const balance = await getHbarBalance(accountId);
      return { success: false, balance };
    } catch {
      return { success: false, balance: new Hbar(0) };
    }
  }
}

export async function provisionHederaAccount(): Promise<string> {
  const { client } = getOperator();
  // Generate a new ED25519 key for the account
  const newPrivateKey = PrivateKey.generateED25519();
  const newPublicKey = newPrivateKey.publicKey;

  // Create a new Hedera account with zero initial balance (operator pays tx fee)
  const tx = new AccountCreateTransaction()
    .setKey(newPublicKey)
    .setInitialBalance(new Hbar(0));

  const resp = await tx.execute(client);
  const receipt = await resp.getReceipt(client);
  const accountId = receipt.accountId?.toString() || "";

  if (!accountId) {
    throw new Error("Failed to provision Hedera account: missing accountId in receipt");
  }
  
  // NOTE: We intentionally do NOT return or log the private key to avoid leaking secrets.
  return accountId;
}

/**
 * Get HBAR balance for a given account
 */
export async function getHbarBalance(accountId: string): Promise<Hbar> {
  const { client } = getOperator();
  const query = new AccountBalanceQuery().setAccountId(AccountId.fromString(accountId));
  const balance = await query.execute(client);
  return balance.hbars;
}

/**
 * Ensure an account has at least a minimum HBAR balance.
 * If below threshold, top-up from operator account.
 * Enhanced for testnet with better error handling and logging.
 */
export async function ensureMinimumHbarBalance(accountId: string): Promise<{ toppedUp: boolean; currentBalance: Hbar; }> {
  try {
    // Read configuration with safe defaults
    const TOPUP_ENABLED = (process.env.HEDERA_TOPUP_ENABLED || 'true').toLowerCase() in { true: 1, '1': 1, yes: 1 };
    const MIN_BALANCE = Number(process.env.HEDERA_MIN_BALANCE_HBAR || '2'); // Reduced to 2 HBAR for testnet
    const TOPUP_AMOUNT = Number(process.env.HEDERA_TOPUP_AMOUNT_HBAR || '10'); // 10 HBAR top-up

    console.log(`[Hedera] Checking balance for account: ${accountId}`);
    console.log(`[Hedera] Configuration - TOPUP_ENABLED: ${TOPUP_ENABLED}, MIN_BALANCE: ${MIN_BALANCE}, TOPUP_AMOUNT: ${TOPUP_AMOUNT}`);
    console.log(`[Hedera] Network: ${env.HEDERA_NETWORK}, Mock Mode: ${env.HEDERA_MOCK_MODE}`);

    // Skip in mock mode but still return current balance
    if (env.HEDERA_MOCK_MODE as unknown as boolean) {
      console.log(`[Hedera] Mock mode enabled, skipping actual balance check`);
      try {
        const current = await getHbarBalance(accountId);
        return { toppedUp: false, currentBalance: current };
      } catch {
        return { toppedUp: false, currentBalance: new Hbar(0) };
      }
    }

    if (!TOPUP_ENABLED) {
      console.log(`[Hedera] Top-up disabled by configuration`);
      const current = await getHbarBalance(accountId);
      return { toppedUp: false, currentBalance: current };
    }

    const { client, operatorAccountId } = getOperator();
    
    // Check operator balance first
    const operatorBalance = await getHbarBalance(operatorAccountId.toString());
    console.log(`[Hedera] Operator balance: ${operatorBalance.toString()}`);
    
    if (operatorBalance.toBigNumber().isLessThan(new Hbar(TOPUP_AMOUNT + 2).toBigNumber())) {
      console.warn(`[Hedera] Insufficient operator balance for top-up. Required: ${TOPUP_AMOUNT + 2} HBAR, Available: ${operatorBalance.toString()}`);
      const current = await getHbarBalance(accountId);
      return { toppedUp: false, currentBalance: current };
    }

    const currentBalance = await getHbarBalance(accountId);
    console.log(`[Hedera] Current account balance: ${currentBalance.toString()}`);

    // If balance is already sufficient, do nothing
    if (currentBalance.toBigNumber().isGreaterThanOrEqualTo(new Hbar(MIN_BALANCE).toBigNumber())) {
      console.log(`[Hedera] Balance sufficient, no top-up needed`);
      return { toppedUp: false, currentBalance };
    }

    console.log(`[Hedera] Balance below minimum (${MIN_BALANCE} HBAR), initiating top-up of ${TOPUP_AMOUNT} HBAR`);

    // Perform top-up transfer
    const transferTx = new TransferTransaction()
      .addHbarTransfer(operatorAccountId, new Hbar(-TOPUP_AMOUNT))
      .addHbarTransfer(AccountId.fromString(accountId), new Hbar(TOPUP_AMOUNT))
      .setMaxTransactionFee(new Hbar(2))
      .setTransactionMemo(`Waternity Auto-Refill: ${TOPUP_AMOUNT} HBAR to ${accountId}`);

    console.log(`[Hedera] Executing transfer transaction...`);
    const exec = await transferTx.execute(client);
    console.log(`[Hedera] Transfer transaction ID: ${exec.transactionId.toString()}`);
    
    const receipt = await exec.getReceipt(client);
    console.log(`[Hedera] Transfer receipt status: ${receipt.status.toString()}`);

    if (receipt.status !== Status.Success) {
      console.warn(`[Hedera] Top-up failed with status: ${receipt.status}`);
      return { toppedUp: false, currentBalance };
    }

    // Wait a moment for balance to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedBalance = await getHbarBalance(accountId);
    console.log(`[Hedera] Updated balance after top-up: ${updatedBalance.toString()}`);
    
    return { toppedUp: true, currentBalance: updatedBalance };
  } catch (error) {
    console.error('[Hedera] ensureMinimumHbarBalance error:', error);
    // Return current balance if possible, otherwise 0 HBAR
    try {
      const current = await getHbarBalance(accountId);
      return { toppedUp: false, currentBalance: current };
    } catch {
      return { toppedUp: false, currentBalance: new Hbar(0) };
    }
  }
}