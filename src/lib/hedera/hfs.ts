import { FileCreateTransaction, FileAppendTransaction, FileId } from "@hashgraph/sdk";
import { createHederaClient } from "./client";
import { sha256Hex } from "@/lib/hash";

/**
 * Create or append content to a Hedera File Service (HFS) file
 * @param bytes - File content as Uint8Array
 * @param existingFileId - Optional existing file ID to append to
 * @returns File ID of created or updated file
 */
export async function createOrAppendFile(
  bytes: Uint8Array,
  existingFileId?: string
): Promise<string> {
  const client = createHederaClient();
  
  try {
    if (existingFileId) {
      // Append to existing file
      const fileId = FileId.fromString(existingFileId);
      
      const appendTx = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(bytes)
        .setMaxTransactionFee(100_000_000); // 1 HBAR
      
      const appendResponse = await appendTx.execute(client);
      const appendReceipt = await appendResponse.getReceipt(client);
      
      if (appendReceipt.status.toString() !== "SUCCESS") {
        throw new Error(`File append failed: ${appendReceipt.status}`);
      }
      
      return existingFileId;
    } else {
      // Create new file
      const createTx = new FileCreateTransaction()
        .setContents(bytes)
        .setMaxTransactionFee(100_000_000); // 1 HBAR
      
      const createResponse = await createTx.execute(client);
      const createReceipt = await createResponse.getReceipt(client);
      
      if (createReceipt.status.toString() !== "SUCCESS") {
        throw new Error(`File creation failed: ${createReceipt.status}`);
      }
      
      const fileId = createReceipt.fileId;
      if (!fileId) {
        throw new Error("File ID not returned from creation");
      }
      
      return fileId.toString();
    }
  } catch (error) {
    console.error("HFS operation failed:", error);
    throw error;
  }
}

/**
 * Calculate SHA256 hash of file content
 * @param bytes - File content as Uint8Array
 * @returns SHA256 hash as hex string
 */
export function calculateFileHash(bytes: Uint8Array): string {
  return sha256Hex(Buffer.from(bytes));
}

/**
 * Get file info from HFS (placeholder for future implementation)
 * @param fileId - HFS file ID
 * @returns File information
 */
export async function getFileInfo(fileId: string) {
  // TODO: Implement file info retrieval when needed
  // This would use FileInfoQuery from Hedera SDK
  throw new Error(`File info retrieval not yet implemented for ${fileId}`);
}

/**
 * Convert base64 string to Uint8Array
 * @param base64 - Base64 encoded string
 * @returns Uint8Array
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 * @param bytes - Uint8Array
 * @returns Base64 encoded string
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
}