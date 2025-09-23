import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, Role } from '../types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const COOKIE_NAME = 'wty_sess';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 8 * 60 * 60, // 8 hours
  path: '/',
};

export async function signToken(payload: Omit<AuthUser, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  return await new SignJWT({
    sub: payload.sub,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + COOKIE_OPTIONS.maxAge)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      sub: payload.sub as string,
      name: payload.name as string,
      role: payload.role as Role,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function setSessionCookie(response: NextResponse, user: Omit<AuthUser, 'iat' | 'exp'>): Promise<void> {
  const token = await signToken(user);
  
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export async function getSessionFromCookie(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return await verifyToken(token);
}

export async function getSessionFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return await verifyToken(token);
}

export function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: 'unauthorized', message },
    { status: 401 }
  );
}

export function createForbiddenResponse(needRole?: Role): NextResponse {
  return NextResponse.json(
    { 
      error: 'forbidden', 
      message: 'Insufficient permissions',
      ...(needRole && { needRole })
    },
    { status: 403 }
  );
}