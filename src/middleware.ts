import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './lib/auth/jwt';

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/api/health',
  '/api/docs',
  '/api/auth/logout',
  '/api/auth/csrf',
];

// Special endpoints that need CSRF but not authentication
const CSRF_ONLY_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
];

// Public GET endpoints that allow read access without authentication
const PUBLIC_READ_ENDPOINTS = [
  '/api/wells',
  '/api/documents',
  '/api/dashboard',
  '/api/demo',
];

// Mutation methods that require authentication
const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// CSRF protection constants
const CSRF_COOKIE_NAME = 'wty_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Hash token for comparison using Web Crypto API
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify CSRF token from request
 */
async function verifyCsrfInMiddleware(request: NextRequest): Promise<boolean> {
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return false;
  }
  
  // Get hashed token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) {
    return false;
  }
  
  // Hash the header token and compare with cookie
  const hashedHeaderToken = await hashToken(headerToken);
  return hashedHeaderToken === cookieToken;
}

/**
 * Checks if a path matches any of the given patterns
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Exact match
    if (pathname === pattern) return true;
    
    // Pattern with wildcard (e.g., /api/wells matches /api/wells/123)
    if (pathname.startsWith(pattern + '/')) return true;
    
    return false;
  });
}

/**
 * Checks if the request is for a public endpoint
 */
function isPublicEndpoint(pathname: string): boolean {
  return matchesPath(pathname, PUBLIC_ENDPOINTS);
}

/**
 * Checks if the request is for a CSRF-only endpoint
 */
function isCsrfOnlyEndpoint(pathname: string): boolean {
  return matchesPath(pathname, CSRF_ONLY_ENDPOINTS);
}

/**
 * Checks if the request is for a public read endpoint
 */
function isPublicReadEndpoint(pathname: string): boolean {
  return matchesPath(pathname, PUBLIC_READ_ENDPOINTS);
}

/**
 * Checks if the request method is a mutation
 */
function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.includes(method.toUpperCase());
}

/**
 * Checks if the request is for an API endpoint
 */
function isApiRequest(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Skip middleware for non-API requests
  if (!isApiRequest(pathname)) {
    return NextResponse.next();
  }

  // Allow public endpoints without authentication
  if (isPublicEndpoint(pathname)) {
    return NextResponse.next();
  }

  // Allow public read endpoints for GET requests only
  if (method === 'GET' && isPublicReadEndpoint(pathname)) {
    return NextResponse.next();
  }

  // Handle CSRF-only endpoints (need CSRF but not authentication)
  if (isCsrfOnlyEndpoint(pathname)) {
    if (isMutationMethod(method)) {
      // Skip CSRF validation in mock mode
      if (process.env.HEDERA_MOCK_MODE !== 'true') {
        if (!(await verifyCsrfInMiddleware(request))) {
          return NextResponse.json(
            {
              error: 'csrf',
              message: 'CSRF token validation failed'
            },
            { status: 403 }
          );
        }
      }
    }
    return NextResponse.next();
  }

  // For mutation methods, verify CSRF token first
  if (isMutationMethod(method)) {
    // Skip CSRF validation in mock mode
    if (process.env.HEDERA_MOCK_MODE !== 'true') {
      if (!(await verifyCsrfInMiddleware(request))) {
        return NextResponse.json(
          {
            error: 'csrf',
            message: 'CSRF token validation failed'
          },
          { status: 403 }
        );
      }
    }
  }

  // For all other API requests, require authentication
  const token = request.cookies.get('wty_sess')?.value;
  
  if (!token) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Authentication required',
      },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Invalid token',
        },
        { status: 401 }
      );
    }

    // Block all mutations by default unless explicitly handled by route handlers
    // This is a safety measure - route handlers should implement their own authorization
    if (isMutationMethod(method)) {
      // Log the mutation attempt for security monitoring
      console.log(`Mutation attempt: ${method} ${pathname} by user ${payload.userId} (${payload.email})`);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Invalid token',
      },
      { status: 401 }
    );
  }

  // Continue to the route handler
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};