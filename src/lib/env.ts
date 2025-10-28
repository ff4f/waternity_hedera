import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  
  // Hedera Configuration
  HEDERA_NETWORK: z.enum(['testnet', 'mainnet', 'previewnet']).default('testnet'),
  HEDERA_ACCOUNT_ID: z.string().regex(/^0\.0\.[0-9]+$/, 'Invalid Hedera Account ID format'),
  HEDERA_PRIVATE_KEY: z.string().min(64, 'Invalid Hedera Private Key'),
  HEDERA_DER_PRIVATE_KEY: z.string().min(64, 'Invalid Hedera DER Private Key'),
  
  // Hedera Services
  MIRROR_NODE_URL: z.string().url('Invalid Mirror Node URL').default('https://testnet.mirrornode.hedera.com/api/v1'),
  HASHSCAN_BASE: z.string().url('Invalid HashScan Base URL').default('https://hashscan.io/testnet'),
  HEDERA_MOCK_MODE: z.string()
    .default('false')
    .transform((val) => {
      const normalized = val.toLowerCase().trim();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }),
  
  // Next.js
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL').optional(),
  
  // Application
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

type Env = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Env {
  // Only validate on server side
  if (typeof window !== 'undefined') {
    // Return a minimal client-side env object
    return {
      HEDERA_NETWORK: 'testnet',
      HEDERA_MOCK_MODE: false,
      APP_ENV: 'development',
      NODE_ENV: 'development',
      MIRROR_NODE_URL: 'https://testnet.mirrornode.hedera.com/api/v1',
      HASHSCAN_BASE: 'https://hashscan.io/testnet',
    } as Env;
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`❌ Invalid environment variables:\n${missingVars}`);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Helper functions
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Hedera network helpers
export const getHederaNetworkEndpoints = () => {
  switch (env.HEDERA_NETWORK) {
    case 'mainnet':
      return {
        mirrorNode: 'https://mainnet.mirrornode.hedera.com/api/v1',
        hashscan: 'https://hashscan.io/mainnet',
        nodes: ['35.237.200.180:50211', '35.186.191.247:50211', '35.192.2.25:50211']
      };
    case 'previewnet':
      return {
        mirrorNode: 'https://previewnet.mirrornode.hedera.com/api/v1',
        hashscan: 'https://hashscan.io/previewnet',
        nodes: ['35.231.208.148:50211', '35.199.161.108:50211', '35.203.82.240:50211']
      };
    case 'testnet':
    default:
      return {
        mirrorNode: 'https://testnet.mirrornode.hedera.com/api/v1',
        hashscan: 'https://hashscan.io/testnet',
        nodes: ['34.94.106.61:50211', '35.237.119.55:50211', '35.245.27.193:50211']
      };
  }
};

// Database connection string helpers
export const getDatabaseConfig = () => {
  const url = new URL(env.DATABASE_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
    ssl: url.searchParams.get('sslmode') === 'require'
  };
};

// Export types
export type { Env };

export function requireEnv() {
  const required = [
    'DATABASE_URL',
    'HEDERA_ACCOUNT_ID',
    'HEDERA_PRIVATE_KEY',
    'HEDERA_DER_PRIVATE_KEY',
    'HEDERA_NETWORK',
    'MIRROR_NODE_URL',
    'HASHSCAN_BASE',
    'APP_ENV',
    'NODE_ENV',
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}

export function optionalDemoEnv() {
  // Not required for core runtime, but used to make demo seamless
  const optional = ['HCS_TOPIC_ID', 'HTS_TOKEN_ID', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  optional.forEach((k) => {
    if (!process.env[k]) {
      console.warn(`[demo] Optional env ${k} is not set`);
    }
  });
}