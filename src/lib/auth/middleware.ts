import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './session';
import { Role } from '../types';

// Role hierarchy for authorization
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ADMIN]: 4,
  [Role.AGENT]: 3,
  [Role.OPERATOR]: 2,
  [Role.INVESTOR]: 1,
};

// Add USER role if it doesn't exist in the enum
const USER_ROLE_LEVEL = 0;

export interface AuthMiddlewareOptions {
  requiredRole?: Role | string;
  allowSelf?: boolean; // Allow access if user is accessing their own resource
  resourceUserId?: string; // ID of the user who owns the resource
}

export async function withAuth(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<{ user: any; error?: NextResponse }> {
  try {
    // Get user session
    const user = await getUserFromRequest(request);

    if (!user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    // Check role-based authorization
    if (options.requiredRole) {
      const userRoleLevel = ROLE_HIERARCHY[user.role.name as Role] ?? USER_ROLE_LEVEL;
      const requiredRoleLevel = ROLE_HIERARCHY[options.requiredRole as Role] ?? USER_ROLE_LEVEL;

      // Allow if user has sufficient role level
      const hasRequiredRole = userRoleLevel >= requiredRoleLevel;
      
      // Allow if user is accessing their own resource
      const isSelfAccess = options.allowSelf && options.resourceUserId === user.id;

      if (!hasRequiredRole && !isSelfAccess) {
        return {
          user,
          error: NextResponse.json(
            { 
              error: 'forbidden', 
              message: `Access denied. Required role: ${options.requiredRole}` 
            },
            { status: 403 }
          )
        };
      }
    }

    return { user };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'internal_error', message: 'Authentication error' },
        { status: 500 }
      )
    };
  }
}

// Helper function to check if user has specific role
export function hasRole(userRole: Role | string, requiredRole: Role | string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? USER_ROLE_LEVEL;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as Role] ?? USER_ROLE_LEVEL;
  return userLevel >= requiredLevel;
}

// Helper function to check if user can access resource
export function canAccessResource(
  userRole: Role | string,
  userId: string,
  requiredRole?: Role | string,
  resourceUserId?: string,
  allowSelf: boolean = true
): boolean {
  // Check role-based access
  if (requiredRole && !hasRole(userRole, requiredRole)) {
    // Check self-access
    if (allowSelf && resourceUserId === userId) {
      return true;
    }
    return false;
  }
  return true;
}

// Decorator function for API routes
export function requireAuth(options: AuthMiddlewareOptions = {}) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const { user, error } = await withAuth(request, options);
      
      if (error) {
        return error;
      }

      // Add user to request context
      (request as any).user = user;
      
      return handler(request, context);
    };
  };
}