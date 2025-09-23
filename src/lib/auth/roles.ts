import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, Role } from '../types';
import { getSessionFromCookie, getSessionFromRequest, createUnauthorizedResponse, createForbiddenResponse } from './session';

export function hasRole(user: AuthUser | null, requiredRole: Role): boolean {
  if (!user) return false;
  
  // Admin has access to everything
  if (user.role === Role.ADMIN) return true;
  
  return user.role === requiredRole;
}

export function hasAnyRole(user: AuthUser | null, requiredRoles: Role[]): boolean {
  if (!user) return false;
  
  // Admin has access to everything
  if (user.role === Role.ADMIN) return true;
  
  return requiredRoles.includes(user.role);
}

export function assertRole(user: AuthUser | null, requiredRole: Role): void {
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  if (!hasRole(user, requiredRole)) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
  }
}

export function assertAnyRole(user: AuthUser | null, requiredRoles: Role[]): void {
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  if (!hasAnyRole(user, requiredRoles)) {
    throw new Error(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
  }
}

export function requireUser(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// Server-side guards for API routes
export async function requireRoleFromCookie(requiredRole: Role): Promise<AuthUser> {
  const user = await getSessionFromCookie();
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (!hasRole(user, requiredRole)) {
    throw new Error(`FORBIDDEN:${requiredRole}`);
  }
  
  return user;
}

export async function requireAnyRoleFromCookie(requiredRoles: Role[]): Promise<AuthUser> {
  const user = await getSessionFromCookie();
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (!hasAnyRole(user, requiredRoles)) {
    throw new Error(`FORBIDDEN:${requiredRoles.join(',')}`);
  }
  
  return user;
}

export async function requireRoleFromRequest(request: NextRequest, requiredRole: Role): Promise<AuthUser> {
  const user = await getSessionFromRequest(request);
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (!hasRole(user, requiredRole)) {
    throw new Error(`FORBIDDEN:${requiredRole}`);
  }
  
  return user;
}

// Middleware helpers
export function createRoleGuard(requiredRole: Role) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      await requireRoleFromRequest(request, requiredRole);
      return null; // Continue to next middleware/handler
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'UNAUTHORIZED') {
        return createUnauthorizedResponse();
      }
      
      if (errorMessage.startsWith('FORBIDDEN:')) {
        const needRole = errorMessage.split(':')[1] as Role;
        return createForbiddenResponse(needRole);
      }
      
      return createUnauthorizedResponse();
    }
  };
}

export function createAnyRoleGuard(requiredRoles: Role[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      await requireAnyRoleFromRequest(request, requiredRoles);
      return null; // Continue to next middleware/handler
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'UNAUTHORIZED') {
        return createUnauthorizedResponse();
      }
      
      if (errorMessage.startsWith('FORBIDDEN:')) {
        const needRoles = errorMessage.split(':')[1].split(',') as Role[];
        return createForbiddenResponse(needRoles[0]); // Return first required role
      }
      
      return createUnauthorizedResponse();
    }
  };
}

async function requireAnyRoleFromRequest(request: NextRequest, requiredRoles: Role[]): Promise<AuthUser> {
  const user = await getSessionFromRequest(request);
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (!hasAnyRole(user, requiredRoles)) {
    throw new Error(`FORBIDDEN:${requiredRoles.join(',')}`);
  }
  
  return user;
}

// Role-specific guards for different endpoints
export const requireInvestor = createRoleGuard(Role.INVESTOR);
export const requireOperator = createRoleGuard(Role.OPERATOR);
export const requireAgent = createRoleGuard(Role.AGENT);
export const requireAdmin = createRoleGuard(Role.ADMIN);

// Combined role guards
export const requireOperatorOrAdmin = createAnyRoleGuard([Role.OPERATOR, Role.ADMIN]);
export const requireAgentOrAdmin = createAnyRoleGuard([Role.AGENT, Role.ADMIN]);