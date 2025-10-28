import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, getUserFromHeaders, getUserFromStandardRequest } from './session';

export type Role = 'ADMIN' | 'OPERATOR' | 'AGENT' | 'INVESTOR';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  hashedPassword: string;
  salt: string;
  resetToken: string | null;
  resetTokenExpiresAt: Date | null;
  hederaAccountId: string | null;
  walletEvm: string | null;
  roleId: string;
  createdAt: Date;
  role: {
    id: string;
    name: string;
    users: any[];
  };
  wells: any[];
  memberships: any[];
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Requires a user to be authenticated via the existing custom cookie session.
 * Throws 401 if missing.
 * 
 * @param req - The Request object (NextRequest or standard Request)
 * @returns Promise<AuthenticatedUser> - The authenticated user with role information
 * @throws AuthenticationError if user is not authenticated
 */
export async function requireUser(req: Request): Promise<AuthenticatedUser> {
  let user: any = null;

  // Handle both NextRequest and standard Request
  if (req instanceof NextRequest) {
    user = await getUserFromRequest(req);
  } else {
    // For standard Request (like in API routes), we need to parse cookies from headers
    user = await getUserFromStandardRequest(req);
  }

  if (!user) {
    throw new AuthenticationError('Valid authentication required');
  }

  return user as AuthenticatedUser;
}

/**
 * Requires a user to be authenticated from headers (for API routes)
 * Throws AuthenticationError if no valid user session
 */
export async function requireUserFromHeaders(): Promise<AuthenticatedUser> {
  const user = await getUserFromHeaders();
  
  if (!user) {
    throw new AuthenticationError('Valid authentication required');
  }
  
  return user as AuthenticatedUser;
}

/**
 * Asserts that the authenticated user has one of the allowed roles.
 * Throws 403 if user doesn't have any of the allowed roles.
 * 
 * @param user - The user object with role information
 * @param roles - Array of allowed roles
 * @throws AuthorizationError if user doesn't have any of the allowed roles
 */
export function assertRole(user: AuthenticatedUser, ...roles: Role[]): void {
  const userRole = user.role.name as Role;
  
  if (!roles.includes(userRole)) {
    throw new AuthorizationError(
      `One of roles [${roles.join(', ')}] required, but user has role ${userRole}`
    );
  }
}

/**
 * Asserts that the authenticated user has one of the required roles
 * Throws AuthorizationError if user doesn't have any of the required roles
 */
export function assertAnyRole(user: AuthenticatedUser, requiredRoles: Role[]): void {
  const userRole = user.role.name as Role;
  
  if (!requiredRoles.includes(userRole)) {
    throw new AuthorizationError(
      `One of roles [${requiredRoles.join(', ')}] required, but user has role ${userRole}`
    );
  }
}

/**
 * Checks if user has the specified role
 */
export function hasRole(user: AuthenticatedUser, role: Role): boolean {
  return user.role.name === role;
}

/**
 * Checks if user has any of the specified roles
 */
export function hasAnyRole(user: AuthenticatedUser, roles: Role[]): boolean {
  const userRole = user.role.name as Role;
  return roles.includes(userRole);
}

/**
 * Checks if user is an admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, 'ADMIN');
}

/**
 * Checks if user is an operator
 */
export function isOperator(user: AuthenticatedUser): boolean {
  return hasRole(user, 'OPERATOR');
}

/**
 * Checks if user is an investor
 */
export function isInvestor(user: AuthenticatedUser): boolean {
  return hasRole(user, 'INVESTOR');
}

/**
 * Checks if user is an agent
 */
export function isAgent(user: AuthenticatedUser): boolean {
  return hasRole(user, 'AGENT');
}

/**
 * Creates a standardized unauthorized response
 */
export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'unauthorized' },
    { status: 401 }
  );
}

/**
 * Creates a standardized forbidden response
 */
export function createForbiddenResponse(): NextResponse {
  return NextResponse.json(
    { error: 'forbidden' },
    { status: 403 }
  );
}

/**
 * Higher-order function to protect API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireUser(request);
      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return createUnauthorizedResponse();
      }
      if (error instanceof AuthorizationError) {
        return createForbiddenResponse();
      }
      throw error;
    }
  };
}

/**
 * Higher-order function to protect API routes with role-based authorization
 */
export function withRole<T extends any[]>(
  requiredRole: Role,
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireUser(request);
      assertRole(user, requiredRole);
      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return createUnauthorizedResponse();
      }
      if (error instanceof AuthorizationError) {
        return createForbiddenResponse();
      }
      throw error;
    }
  };
}

/**
 * Higher-order function to protect API routes with multiple role options
 */
export function withAnyRole<T extends any[]>(
  requiredRoles: Role[],
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireUser(request);
      assertAnyRole(user, requiredRoles);
      return await handler(user, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return createUnauthorizedResponse();
      }
      if (error instanceof AuthorizationError) {
        return createForbiddenResponse();
      }
      throw error;
    }
  };
}