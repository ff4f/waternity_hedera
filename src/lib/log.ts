/**
 * Structured JSON logger for hot paths
 * Outputs single-line JSON: { ts, level, msg, ...meta }
 * Never logs secrets or sensitive data
 */

type LogLevel = 'info' | 'warn' | 'error';

// List of keys that should never be logged (secrets, sensitive data)
const SENSITIVE_KEYS = new Set([
  'password',
  'hashedPassword',
  'salt',
  'privateKey',
  'secret',
  'token',
  'authorization',
  'cookie',
  'session',
  'key',
  'apiKey',
  'accessToken',
  'refreshToken',
  'resetToken',
  'hederaPrivateKey',
  'sessionSecret',
]);

/**
 * Sanitizes metadata to remove sensitive information
 */
function sanitizeMeta(meta: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    
    // Skip sensitive keys
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMeta(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Structured JSON logger
 * @param level - Log level: 'info', 'warn', or 'error'
 * @param msg - Log message
 * @param meta - Optional metadata object
 */
export function log(level: LogLevel, msg: string, meta?: Record<string, any>): void {
  const logEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ? sanitizeMeta(meta) : {}),
  };
  
  // Output single-line JSON
  console.log(JSON.stringify(logEntry));
}

/**
 * Convenience methods for different log levels
 */
export const logger = {
  info: (msg: string, meta?: Record<string, any>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, any>) => log('error', msg, meta),
};