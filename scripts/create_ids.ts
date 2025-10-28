import { Client, PrivateKey, AccountId, TopicCreateTransaction, TokenCreateTransaction, TokenType, TokenSupplyType, Status, Hbar } from '@hashgraph/sdk';
import fs from 'fs';
import path from 'path';

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function upsertEnvKey(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  const endsWithNewline = content.endsWith('\n');
  return content + (endsWithNewline ? '' : '\n') + line + '\n';
}

function getClient(network: string, accountId: string, privateKey: string): Client {
  const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  const key = PrivateKey.fromString(privateKey);
  client.setOperator(AccountId.fromString(accountId), key);
  return client;
}

async function createHcsTopic(client: Client): Promise<string> {
  const tx = new TopicCreateTransaction()
    .setTopicMemo('Waternity Hackathon Topic');
  const resp = await tx.execute(client);
  const receipt = await resp.getReceipt(client);
  if (!receipt.topicId) throw new Error('Topic creation did not return topicId');
  return receipt.topicId.toString();
}

async function createHtsToken(client: Client, treasuryAccountId: string, adminKey: PrivateKey): Promise<string> {
  const tx = new TokenCreateTransaction()
    .setTokenName('Waternity Demo Token')
    .setTokenSymbol('WDT')
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(6)
    .setInitialSupply(0)
    .setTreasuryAccountId(AccountId.fromString(treasuryAccountId))
    .setSupplyType(TokenSupplyType.Infinite)
    .setAdminKey(adminKey.publicKey)
    .setSupplyKey(adminKey.publicKey)
    .setFreezeDefault(false)
    .setMaxTransactionFee(new Hbar(30))
    .freezeWith(client);

  const signed = await tx.sign(adminKey);
  // If treasury key differs from admin, you would sign with treasury as well; here we reuse same key for demo
  const resp = await signed.execute(client);
  const receipt = await resp.getReceipt(client);
  if (receipt.status !== Status.Success) throw new Error(`Token creation failed: ${receipt.status.toString()}`);
  if (!receipt.tokenId) throw new Error('Token creation did not return tokenId');
  return receipt.tokenId.toString();
}

async function main() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = parseEnvFile(envPath);
  const accountId = env['HEDERA_ACCOUNT_ID'];
  const privateKey = env['HEDERA_PRIVATE_KEY'];
  const network = env['HEDERA_NETWORK'] || 'testnet';
  if (!accountId || !privateKey) {
    throw new Error('HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY missing in .env.local');
  }

  const client = getClient(network, accountId, privateKey);
  const topicId = await createHcsTopic(client);
  const tokenId = await createHtsToken(client, accountId, PrivateKey.fromString(privateKey));

  // Write back to .env.local
  let content = fs.readFileSync(envPath, 'utf-8');
  content = upsertEnvKey(content, 'HCS_TOPIC_ID', topicId);
  content = upsertEnvKey(content, 'HTS_TOKEN_ID', tokenId);
  fs.writeFileSync(envPath, content, 'utf-8');

  console.log(`HCS_TOPIC_ID=${topicId}`);
  console.log(`HTS_TOKEN_ID=${tokenId}`);
}

main().catch((err) => {
  console.error('Error creating HCS topic / HTS token:', err?.message || String(err));
  process.exit(1);
});