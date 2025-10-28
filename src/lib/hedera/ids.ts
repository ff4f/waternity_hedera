/**
 * Hedera ID validation utilities
 * 
 * This module provides validation functions for Hedera identifiers
 * to ensure fail-fast behavior when IDs are missing or invalid.
 */

/**
 * Validates if a string is a valid Hedera Topic ID
 * 
 * A valid Topic ID follows the format: x.y.z where x, y, z are numbers
 * Examples: "0.0.123", "1.2.3456", "10.20.30"
 * 
 * @param id - The topic ID to validate (can be string, null, or undefined)
 * @returns true if the ID is valid, false otherwise
 */
export const isValidTopicId = (id?: string | null): boolean => {
  return !!id && /^\d+\.\d+\.\d+$/.test(id);
};

/**
 * Validates if a string is a valid Hedera Account ID
 * 
 * A valid Account ID follows the format: x.y.z where x, y, z are numbers
 * Examples: "0.0.123", "1.2.3456", "10.20.30"
 * 
 * @param id - The account ID to validate (can be string, null, or undefined)
 * @returns true if the ID is valid, false otherwise
 */
export const isValidAccountId = (id?: string | null): boolean => {
  return !!id && /^\d+\.\d+\.\d+$/.test(id);
};

/**
 * Validates if a string is a valid Hedera Token ID
 * 
 * A valid Token ID follows the format: x.y.z where x, y, z are numbers
 * Examples: "0.0.123", "1.2.3456", "10.20.30"
 * 
 * @param id - The token ID to validate (can be string, null, or undefined)
 * @returns true if the ID is valid, false otherwise
 */
export const isValidTokenId = (id?: string | null): boolean => {
  return !!id && /^\d+\.\d+\.\d+$/.test(id);
};

/**
 * Validates if a string is a valid Hedera File ID
 * 
 * A valid File ID follows the format: x.y.z where x, y, z are numbers
 * Examples: "0.0.123", "1.2.3456", "10.20.30"
 * 
 * @param id - The file ID to validate (can be string, null, or undefined)
 * @returns true if the ID is valid, false otherwise
 */
export const isValidFileId = (id?: string | null): boolean => {
  return !!id && /^\d+\.\d+\.\d+$/.test(id);
};

/**
 * Generic Hedera ID validator
 * 
 * @param id - The Hedera ID to validate (can be string, null, or undefined)
 * @returns true if the ID is valid, false otherwise
 */
export const isValidHederaId = (id?: string | null): boolean => {
  return !!id && /^\d+\.\d+\.\d+$/.test(id);
};