import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '../prisma';

const SESSION_COOKIE_NAME = 'wty_sess';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

interface SessionPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string, email: string): Promise<string> {
  const payload: Omit<SessionPayload, 'iat' | 'exp'> = {
    userId,
    email,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_DURATION) / 1000))
    .sign(getSecretKey());

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function getSessionToken(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getSessionTokenFromHeaders(): Promise<string | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

export async function getUserFromRequest(request: NextRequest) {
  const token = getSessionToken(request);
  console.log('Token from NextRequest:', token);
  
  if (!token) {
    console.log('No token found in NextRequest');
    return null;
  }

  const session = await verifySession(token);
  console.log('Session from NextRequest:', session);
  
  if (!session) {
    console.log('Invalid session from NextRequest');
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        role: true,
      },
    });

    console.log('User from NextRequest:', user?.email);
    return user;
  } catch (error) {
    console.error('Error fetching user from session:', error);
    return null;
  }
}

export async function getUserFromHeaders() {
  const token = await getSessionTokenFromHeaders();
  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  if (!session) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user from session:', error);
    return null;
  }
}

export async function getUserFromStandardRequest(request: Request) {
  // Parse cookies from the Cookie header
  const cookieHeader = request.headers.get('cookie');
  
  if (!cookieHeader) {
    return null;
  }

  // Extract session token from cookies
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  
  if (!sessionCookie) {
    return null;
  }

  const token = sessionCookie.split('=')[1];
  
  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  
  if (!session) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user from session:', error);
    return null;
  }
}

export type { SessionPayload };