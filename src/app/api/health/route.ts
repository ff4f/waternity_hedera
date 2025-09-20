import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { env } from '@/lib/env'

// Health check response interface
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error'
      latency?: number
      error?: string
    }
    hedera: {
      network: string
      mirrorNode: {
        status: 'reachable' | 'unreachable' | 'error'
        latency?: number
        error?: string
      }
    }
  }
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
}

// Store application start time for uptime calculation
const startTime = Date.now()

// Database health check
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now()
    
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`
    
    const latency = Date.now() - startTime
    
    return {
      status: 'connected' as const,
      latency
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// Hedera Mirror Node health check
async function checkHederaMirrorNodeHealth() {
  try {
    const startTime = Date.now()
    
    // Check Mirror Node API endpoint
    const response = await fetch(`${env.MIRROR_NODE_URL}/network/nodes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Waternity-HealthCheck/1.0'
      },
      // Set timeout to 5 seconds
      signal: AbortSignal.timeout(5000)
    })
    
    const latency = Date.now() - startTime
    
    if (response.ok) {
      return {
        status: 'reachable' as const,
        latency
      }
    } else {
      return {
        status: 'error' as const,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    console.error('Hedera Mirror Node health check failed:', error)
    return {
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown Mirror Node error'
    }
  }
}

// Memory usage calculation
function getMemoryUsage() {
  const memUsage = process.memoryUsage()
  const totalMemory = memUsage.heapTotal
  const usedMemory = memUsage.heapUsed
  
  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round((usedMemory / totalMemory) * 100)
  }
}

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Run health checks in parallel
    const [databaseHealth, mirrorNodeHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkHederaMirrorNodeHealth()
    ])
    
    // Calculate uptime
    const uptime = Math.floor((Date.now() - startTime) / 1000) // seconds
    
    // Get memory usage
    const memory = getMemoryUsage()
    
    // Determine overall health status
    const isHealthy = 
      databaseHealth.status === 'connected' &&
      mirrorNodeHealth.status === 'reachable'
    
    const healthResponse: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      services: {
        database: databaseHealth,
        hedera: {
          network: env.HEDERA_NETWORK,
          mirrorNode: mirrorNodeHealth
        }
      },
      uptime,
      memory
    }
    
    // Return appropriate HTTP status code
    const statusCode = isHealthy ? 200 : 503
    
    return NextResponse.json(healthResponse, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Health check endpoint error:', error)
    
    // Return error response
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      services: {
        database: {
          status: 'error',
          error: 'Health check failed'
        },
        hedera: {
          network: env.HEDERA_NETWORK,
          mirrorNode: {
            status: 'error',
            error: 'Health check failed'
          }
        }
      },
      uptime: Math.floor((Date.now() - startTime) / 1000),
      memory: getMemoryUsage()
    }
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

// HEAD /api/health - Lightweight health check for load balancers
export async function HEAD(request: NextRequest) {
  try {
    // Quick database connectivity check
    await prisma.$queryRaw`SELECT 1`
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Health check HEAD request failed:', error)
    return new NextResponse(null, { status: 503 })
  }
}

// OPTIONS /api/health - CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache'
    }
  })
}