import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

export interface CustomJWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
}

/**
 * Sign a JWT token
 */
export async function signJWT(payload: { userId: string; email: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string): Promise<CustomJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    
    // Validate that required fields exist
    if (typeof payload.userId === 'string' && typeof payload.email === 'string') {
      return payload as CustomJWTPayload;
    }
    
    return null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}