/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@hashgraph/sdk']
  },
  transpilePackages: ['recharts'],
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  env: {
    HEDERA_NETWORK: process.env.HEDERA_NETWORK,
    MIRROR_NODE_URL: process.env.MIRROR_NODE_URL,
    HASHSCAN_BASE: process.env.HASHSCAN_BASE
  }
};

export default nextConfig;