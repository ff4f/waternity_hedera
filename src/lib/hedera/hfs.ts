import {
  FileCreateTransaction,
  FileAppendTransaction,
  Hbar,
  Client,
} from "@hashgraph/sdk";

const MAX_FILE_SIZE = 4096; // 4KB, leaving some buffer for safety

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