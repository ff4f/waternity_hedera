/**
 * Rate limiting implementation with sliding window algorithm
 * Supports in-memory storage (default) and optional Upstash Redis
 */

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

// In-memory storage for rate limiting
const inMemoryStore = new Map<string, { requests: number[]; }>();

// Upstash Redis client (optional)
let redisClient: any = null;

// Initialize Redis client if environment variables are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    // Dynamic import to avoid issues if @upstash/redis is not installed
    import('@upstash/redis').then(({ Redis }) => {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }).catch(() => {
      console.warn('Upstash Redis not available, falling back to in-memory rate limiting');
    });
  } catch (error) {
    console.warn('Upstash Redis not available, falling back to in-memory rate limiting');
  }
}

/**
 * Clean up expired entries from in-memory store
 */
function cleanupExpiredEntries(key: string, windowMs: number): void {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  
  if (entry) {
    // Remove requests older than the window
    entry.requests = entry.requests.filter(timestamp => now - timestamp < windowMs);
    
    if (entry.requests.length === 0) {
      inMemoryStore.delete(key);
    } else {
      inMemoryStore.set(key, entry);
    }
  }
}

/**
 * In-memory rate limiting implementation
 */
async function inMemoryRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const now = Date.now();
  
  // Clean up expired entries
  cleanupExpiredEntries(key, windowMs);
  
  // Get current entry
  let entry = inMemoryStore.get(key);
  if (!entry) {
    entry = { requests: [] };
    inMemoryStore.set(key, entry);
  }
  
  // Check if limit is exceeded
  if (entry.requests.length >= limit) {
    const oldestRequest = entry.requests[0];
    const resetTime = oldestRequest + windowMs;
    
    return {
      success: false,
      remaining: 0,
      resetTime
    };
  }
  
  // Add current request
  entry.requests.push(now);
  inMemoryStore.set(key, entry);
  
  // Calculate reset time (when the oldest request will expire)
  const resetTime = entry.requests[0] + windowMs;
  
  return {
    success: true,
    remaining: limit - entry.requests.length,
    resetTime
  };
}

/**
 * Redis-based rate limiting implementation
 */
async function redisRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  try {
    // Use Redis sorted set for sliding window
    const pipeline = redisClient.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration for the key
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = results[1][1] as number;
    
    if (currentCount >= limit) {
      // Get the oldest request to calculate reset time
      const oldestRequests = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequests.length > 0 ? 
        parseInt(oldestRequests[1]) + windowMs : 
        now + windowMs;
      
      // Remove the request we just added since we're over the limit
      await redisClient.zrem(key, `${now}-${Math.random()}`);
      
      return {
        success: false,
        remaining: 0,
        resetTime
      };
    }
    
    // Calculate reset time
    const oldestRequests = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
    const resetTime = oldestRequests.length > 0 ? 
      parseInt(oldestRequests[1]) + windowMs : 
      now + windowMs;
    
    return {
      success: true,
      remaining: limit - (currentCount + 1),
      resetTime
    };
    
  } catch (error) {
    console.error('Redis rate limiting error, falling back to in-memory:', error);
    return inMemoryRateLimit(opts);
  }
}

/**
 * Main rate limiting function
 * Uses Redis if available, otherwise falls back to in-memory storage
 */
export async function rateLimit(opts: RateLimitOptions): Promise<void> {
  const result = redisClient ? 
    await redisRateLimit(opts) : 
    await inMemoryRateLimit(opts);
  
  if (!result.success) {
    const error = new Error('Rate limit exceeded') as any;
    error.status = 429;
    error.code = 'RATE_LIMITED';
    error.details = {
      limit: opts.limit,
      windowMs: opts.windowMs,
      resetTime: result.resetTime,
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    };
    throw error;
  }
}

/**
 * Get rate limit status without incrementing the counter
 */
export async function getRateLimitStatus(opts: RateLimitOptions): Promise<RateLimitResult> {
  if (redisClient) {
    const { key, limit, windowMs } = opts;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      // Count current requests in window without modifying
      await redisClient.zremrangebyscore(key, 0, windowStart);
      const currentCount = await redisClient.zcard(key);
      
      const oldestRequests = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequests.length > 0 ? 
        parseInt(oldestRequests[1]) + windowMs : 
        now + windowMs;
      
      return {
        success: currentCount < limit,
        remaining: Math.max(0, limit - currentCount),
        resetTime
      };
    } catch (error) {
      console.error('Redis rate limit status error:', error);
    }
  }
  
  // Fallback to in-memory check
  const { key, limit, windowMs } = opts;
  cleanupExpiredEntries(key, windowMs);
  
  const entry = inMemoryStore.get(key);
  const currentCount = entry ? entry.requests.length : 0;
  const resetTime = entry && entry.requests.length > 0 ? 
    entry.requests[0] + windowMs : 
    Date.now() + windowMs;
  
  return {
    success: currentCount < limit,
    remaining: Math.max(0, limit - currentCount),
    resetTime
  };
}

/**
 * Helper function to create rate limit key for IP-based limiting
 */
export function createIpKey(ip: string, endpoint: string): string {
  return `rate_limit:ip:${ip}:${endpoint}`;
}

/**
 * Helper function to create rate limit key for user-based limiting
 */
export function createUserKey(userId: string, endpoint: string): string {
  return `rate_limit:user:${userId}:${endpoint}`;
}

/**
 * Helper function to get client IP from request
 */
export function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a default value for serverless environments
  return 'unknown';
}