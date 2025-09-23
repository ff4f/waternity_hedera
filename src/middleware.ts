import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, createUnauthorizedResponse, createForbiddenResponse } from './lib/auth/session';
import { Role } from './lib/types';
import { hasRole, hasAnyRole } from './lib/auth/roles';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/docs',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/hcs/events',
  '/api/wells',
  '/api/users',
  '/api/dashboard/stats',
  '/api/investor',
  '/api/agent',
  '/api/hts/tokens',
  '/api/settlements',
  '/api/water-quality',
  '/dashboard',
];

// Public GET endpoints (read-only access)
const PUBLIC_GET_ROUTES = [
  '/api/wells', // List wells
  '/api/meta',  // Metadata
  '/api/docs',  // Documentation
];

// Role-specific route patterns
const ROLE_ROUTES = {
  [Role.INVESTOR]: [
    '/api/wells/*/invest',
    '/api/settlements/*/invest',
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
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow public GET routes
  if (isPublicGetRoute(pathname, method)) {
    return NextResponse.next();
  }

  // Check if route needs protection
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Get user session
  const user = await getSessionFromRequest(request);

  // Require authentication for protected routes
  if (!user) {
    return createUnauthorizedResponse('Authentication required');
  }

  // Check role-specific access
  const requiredRole = getRequiredRoleForRoute(pathname);
  
  if (requiredRole) {
    // Check if user has the required role (Admin has access to everything)
    if (!hasRole(user, requiredRole)) {
      return createForbiddenResponse(requiredRole);
    }
  }

  // For mutating operations (POST, PUT, DELETE, PATCH), require authentication
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    // Additional role checks for specific endpoints
    
    // Investment endpoints - Investors only
    if (pathname.includes('/invest')) {
      if (!hasAnyRole(user, [Role.INVESTOR, Role.ADMIN])) {
        return createForbiddenResponse(Role.INVESTOR);
      }
    }
    
    // Well/project creation and operations - Operators only
    if (
      pathname.includes('/wells/create') ||
      pathname.includes('/complete') ||
      pathname.includes('/meter') ||
      pathname.includes('/valve')
    ) {
      if (!hasAnyRole(user, [Role.OPERATOR, Role.ADMIN])) {
        return createForbiddenResponse(Role.OPERATOR);
      }
    }
    
    // Settlement verification and document anchoring - Agents only
    if (
      pathname.includes('/verify') ||
      pathname.includes('/approve') ||
      pathname.includes('/anchor')
    ) {
      if (!hasAnyRole(user, [Role.AGENT, Role.ADMIN])) {
        return createForbiddenResponse(Role.AGENT);
      }
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