import { NextResponse } from 'next/server';

/**
 * CSRF Protection for Waternity
 * 
 * Provides minimal CSRF barrier for POST/PUT/DELETE operations
 * without requiring form refactoring.
 */

const CSRF_COOKIE_NAME = 'wty_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Generate a secure random CSRF token
 */
function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a hash of the token for comparison
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Issue a CSRF token and set it as an HTTPOnly cookie
 * 
 * @param res - NextResponse object to set the cookie on
 * @returns Object containing the token to be sent to client
 */
export async function issueCsrf(res: NextResponse): Promise<{ token: string }> {
  const token = generateCsrfToken();
  const hashedToken = await hashToken(token);
  
  // Set HTTPOnly cookie with hashed token (2h expiry)
  res.cookies.set(CSRF_COOKIE_NAME, hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // maxAge is in seconds
    path: '/'
  });
  
  // Return the plain token for client to use in headers
  return { token };
}

/**
 * Verify CSRF token from request header against cookie
 * 
 * @param req - Request object containing headers and cookies
 * @throws Error with status 403 if CSRF verification fails
 */
export async function verifyCsrf(req: Request): Promise<void> {
  // Get token from header
  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    const error = new Error('CSRF token missing from request header');
    (error as any).status = 403;
    (error as any).code = 'csrf';
    throw error;
  }
  
  // Get hashed token from cookie
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) {
    const error = new Error('CSRF cookie missing');
    (error as any).status = 403;
    (error as any).code = 'csrf';
    throw error;
  }
  
  // Parse cookies manually to get CSRF cookie
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  if (!cookieToken) {
    const error = new Error('CSRF cookie not found');
    (error as any).status = 403;
    (error as any).code = 'csrf';
    throw error;
  }
  
  // Hash the header token and compare with cookie
  const hashedHeaderToken = await hashToken(headerToken);
  if (hashedHeaderToken !== cookieToken) {
    const error = new Error('CSRF token mismatch');
    (error as any).status = 403;
    (error as any).code = 'csrf';
    throw error;
  }
  
  // Verification successful - no action needed
}

/**
 * Error response for CSRF failures
 */
export function createCsrfErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'csrf',
      message: 'CSRF token validation failed'
    },
    { status: 403 }
  );
}