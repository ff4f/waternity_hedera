import {
  FileCreateTransaction,
  FileAppendTransaction,
  Hbar,
  Client,
} from "@hashgraph/sdk";
import { createHash } from "crypto";

const MAX_FILE_SIZE = 4096; // 4KB, leaving some buffer for safety
const MAX_SINGLE_FILE_SIZE = 900_000; // 900KB limit for single file creation

/**
 * Creates or appends a file on Hedera File Service based on size.
 * If bytes.length <= 900,000 → FileCreateTransaction with full contents.
 * Else: create + chunked FileAppendTransaction until complete.
 *
 * @param {Uint8Array} bytes - The content bytes to store
 * @param {Client} client - The Hedera client
 * @returns {Promise<{fileId: string, receipt: any, hashscanFileUrl: string}>} - The file ID, receipt, and hashscan URL
 */
export async function createOrAppendFile(bytes: Uint8Array, client: Client) {
  const operatorId = client.operatorAccountId;
  const operatorKey = client.operatorPublicKey;

  if (!operatorId || !operatorKey) {
    throw new Error("Client is not configured with an operator.");
  }

  let fileId;
  let receipt;

  if (bytes.length <= MAX_SINGLE_FILE_SIZE) {
    // Single file creation for files <= 900KB
    const createFileTx = new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(bytes)
      .setMaxTransactionFee(new Hbar(5));

    const createFileResponse = await createFileTx.execute(client);
    receipt = await createFileResponse.getReceipt(client);
    fileId = receipt.fileId;
  } else {
    // Chunked file creation for files > 900KB
    const firstChunk = bytes.slice(0, MAX_FILE_SIZE);
    const remainingContent = bytes.slice(MAX_FILE_SIZE);

    const createFileTx = new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(firstChunk)
      .setMaxTransactionFee(new Hbar(5));

    const createFileResponse = await createFileTx.execute(client);
    receipt = await createFileResponse.getReceipt(client);
    fileId = receipt.fileId;

    if (!fileId) {
      throw new Error("File creation failed at initial chunk.");
    }

    // Append remaining chunks
    for (let i = 0; i < remainingContent.length; i += MAX_FILE_SIZE) {
      const chunk = remainingContent.slice(i, i + MAX_FILE_SIZE);
      const appendTx = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(chunk)
        .setMaxTransactionFee(new Hbar(5));
      await (await appendTx.execute(client)).getReceipt(client);
    }
  }

  if (!fileId) {
    throw new Error("File creation failed.");
  }

  const network = client.networkName;
  const hashscanFileUrl = `https://hashscan.io/${network}/file/${fileId.toString()}`;

  return {
    fileId: fileId.toString(),
    receipt,
    hashscanFileUrl,
  };
}

/**
 * Bundles a monthly report into a file on Hedera File Service.
 * If the content is larger than MAX_FILE_SIZE, it will be split into chunks.
 *
 * @param {object} params - The parameters for bundling the report.
 * @param {string} params.wellId - The ID of the well.
 * @param {Uint8Array} params.contentBytes - The content of the report in bytes.
 * @param {Client} params.client - The Hedera client.
 * @returns {Promise<{fileId: string, hashscanFileUrl: string}>} - The file ID and the hashscan URL.
 */
export async function bundleMonthlyReport({ wellId, contentBytes, client }: { wellId: string, contentBytes: Uint8Array, client: Client }) {
  const operatorId = client.operatorAccountId;
  const operatorKey = client.operatorPublicKey;

  if (!operatorId || !operatorKey) {
    throw new Error("Client is not configured with an operator.");
  }

  let fileId;

  if (contentBytes.length > MAX_FILE_SIZE) {
    // Chunked file creation
    const firstChunk = contentBytes.slice(0, MAX_FILE_SIZE);
    const remainingContent = contentBytes.slice(MAX_FILE_SIZE);

    const createFileTx = new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(firstChunk)
      .setFileMemo(`Water Well ${wellId} - Monthly Report`)
      .setMaxTransactionFee(new Hbar(5)); // Increased fee for larger transaction

    const createFileResponse = await createFileTx.execute(client);
    const createFileReceipt = await createFileResponse.getReceipt(client);
    fileId = createFileReceipt.fileId;

    if (!fileId) {
      throw new Error("File creation failed at initial chunk.");
    }

    // Append remaining chunks
    for (let i = 0; i < remainingContent.length; i += MAX_FILE_SIZE) {
      const chunk = remainingContent.slice(i, i + MAX_FILE_SIZE);
      const appendTx = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(chunk)
        .setMaxTransactionFee(new Hbar(5));
      await (await appendTx.execute(client)).getReceipt(client);
    }
  } else {
    // Single file creation
    const createFileTx = new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(contentBytes)
      .setFileMemo(`Water Well ${wellId} - Monthly Report`)
      .setMaxTransactionFee(new Hbar(2));

    const createFileResponse = await createFileTx.execute(client);
    const createFileReceipt = await createFileResponse.getReceipt(client);
    fileId = createFileReceipt.fileId;
  }

  if (!fileId) {
    throw new Error("File creation failed.");
  }

  const network = client.networkName;
  const hashscanFileUrl = `https://hashscan.io/${network}/file/${fileId.toString()}`;

  return {
    fileId: fileId.toString(),
    hashscanFileUrl,
  };
}

/**
 * Computes SHA256 hash of bytes and returns as hex string.
 *
 * @param {Uint8Array} bytes - The bytes to hash
 * @returns {string} - The SHA256 hash as hex string
 */
export function sha256Hex(bytes: Uint8Array): string {
  const hash = createHash('sha256');
  hash.update(bytes);
  return hash.digest('hex');
}