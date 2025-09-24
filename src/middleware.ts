import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, createUnauthorizedResponse, createForbiddenResponse } from './lib/auth/session';
import { Role } from './lib/types';
import { hasRole, hasAnyRole } from './lib/auth/roles';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/test-proof-pill',
  '/test-csv-export',
  '/dashboard',
];

// Public GET endpoints (read-only access) - allowlist for public GET
const PUBLIC_GET_ROUTES = [
  '/api/health',   // Health check
  '/api/docs',     // Documentation
  '/api/wells',    // List wells (read-only)
  '/api/meta',     // Metadata
];

// Role-specific route patterns
const ROLE_ROUTES = {
  [Role.INVESTOR]: [
    '/api/wells/*/invest',
    '/api/settlements/*/invest',
    '/api/investor',
    '/app/investor',
  ],
  [Role.OPERATOR]: [
    '/api/wells/create',
    '/api/wells/*/complete',
    '/api/wells/*/meter',
    '/api/wells/*/valve',
    '/api/hcs/meter_reading',
    '/api/hcs/valve_command',
    '/app/operator',
  ],
  [Role.AGENT]: [
    '/api/settlements/*/verify',
    '/api/settlements/*/approve',
    '/api/documents/*/anchor',
    '/api/hcs/doc_anchored',
    '/api/hcs/settlement_approved',
    '/app/agent',
  ],
  [Role.ADMIN]: [
    '/api/admin',
    '/api/system',
    '/app/admin',
  ],
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function isPublicGetRoute(pathname: string, method: string): boolean {
  if (method !== 'GET') return false;
  return PUBLIC_GET_ROUTES.some(route => pathname.startsWith(route));
}

function matchesPattern(pathname: string, pattern: string): boolean {
  // Convert pattern like '/api/wells/*/invest' to regex
  const regexPattern = pattern
    .replace(/\*/g, '[^/]+')
    .replace(/\//g, '\\/');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

function getRequiredRoleForRoute(pathname: string): Role | null {
  for (const [role, patterns] of Object.entries(ROLE_ROUTES)) {
    for (const pattern of patterns) {
      if (matchesPattern(pathname, pattern)) {
        return role as Role;
      }
    }
  }
  return null;
}

function isProtectedRoute(pathname: string): boolean {
  // Protect all /api routes except public ones
  if (pathname.startsWith('/api/')) {
    return !isPublicRoute(pathname);
  }
  
  // Protect all /app routes except public ones
  if (pathname.startsWith('/app/')) {
    return true;
  }
  
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow public routes (auth endpoints, test pages)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow public GET routes only (health, docs, wells list)
  if (method === 'GET' && isPublicGetRoute(pathname, method)) {
    return NextResponse.next();
  }

  // DENY MUTATIONS BY DEFAULT - All POST, PUT, DELETE, PATCH require authentication
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const user = await getSessionFromRequest(request);
    
    if (!user) {
      return createUnauthorizedResponse('Authentication required for mutations');
    }

    // Role-specific mutation checks
    
    // Investment endpoints - Investors only
    if (pathname.includes('/invest')) {
      if (!hasAnyRole(user, [Role.INVESTOR, Role.ADMIN])) {
        return createForbiddenResponse(Role.INVESTOR);
      }
    }
    
    // Well/project creation and operations - Operators only
    else if (
      pathname.includes('/wells') && method === 'POST' ||
      pathname.includes('/complete') ||
      pathname.includes('/meter') ||
      pathname.includes('/valve') ||
      pathname.includes('/hcs/meter_reading') ||
      pathname.includes('/hcs/valve_command')
    ) {
      if (!hasAnyRole(user, [Role.OPERATOR, Role.ADMIN])) {
        return createForbiddenResponse(Role.OPERATOR);
      }
    }
    
    // Agent endpoints - Agents only
    else if (
      pathname.startsWith('/api/agent') ||
      pathname.includes('/verify') ||
      pathname.includes('/approve') ||
      pathname.includes('/anchor') ||
      pathname.includes('/hcs/doc_anchored') ||
      pathname.includes('/hcs/settlement_approved')
    ) {
      if (!hasAnyRole(user, [Role.AGENT, Role.ADMIN])) {
        return createForbiddenResponse(Role.AGENT);
      }
    }
    
    // Admin endpoints - Admin only
    else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/system')) {
      if (user.role !== Role.ADMIN) {
        return createForbiddenResponse(Role.ADMIN);
      }
    }
  }

  // For protected GET routes, check authentication and role
  if (isProtectedRoute(pathname)) {
    const user = await getSessionFromRequest(request);
    
    if (!user) {
      return createUnauthorizedResponse('Authentication required');
    }

    const requiredRole = getRequiredRoleForRoute(pathname);
    if (requiredRole && !hasRole(user, requiredRole)) {
      return createForbiddenResponse(requiredRole);
    }
  }

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