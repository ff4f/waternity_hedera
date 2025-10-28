import crypto from 'crypto';

/**
 * Generate SHA256 hash from string or bytes
 * @param input - String or Buffer to hash
 * @returns Hexadecimal string representation of the hash
 */
export function sha256Hex(input: string | Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}