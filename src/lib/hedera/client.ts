import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { env } from "@/lib/env";

export function getOperator() {
  const operatorAccountId = AccountId.fromString(env.HEDERA_ACCOUNT_ID);
  const operatorPrivateKey = PrivateKey.fromString(env.HEDERA_PRIVATE_KEY);

  const client = Client.forName(env.HEDERA_NETWORK);
  client.setOperator(operatorAccountId, operatorPrivateKey);

  return { client, operatorAccountId, operatorPrivateKey };
}