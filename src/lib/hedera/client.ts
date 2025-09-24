import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { env } from "@/lib/env";

export function getOperator() {
  const operatorAccountId = AccountId.fromString(env.HEDERA_ACCOUNT_ID);
  
  // Use the raw private key format for better compatibility
  const operatorPrivateKey = PrivateKey.fromString(env.HEDERA_PRIVATE_KEY);

  const client = Client.forName(env.HEDERA_NETWORK);
  client.setOperator(operatorAccountId, operatorPrivateKey);

  return { client, operatorAccountId, operatorPrivateKey };
}

export function createHederaClient(): Client {
  const { client } = getOperator();
  return client;
}