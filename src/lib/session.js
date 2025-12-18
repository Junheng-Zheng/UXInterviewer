import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const SESSION_COOKIE_NAME = 'session';

/**
 * Create a session token
 */
export async function createSession(userInfo) {
  const secret = new TextEncoder().encode(SECRET_KEY);
  
  const token = await new SignJWT(userInfo)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

/**
 * Verify and decode session token
 */
export async function verifySession(token) {
  try {
    const secret = new TextEncoder().encode(SECRET_KEY);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get session from cookies
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return null;
  }

  return await verifySession(sessionToken);
}

/**
 * Set session cookie
 */
export async function setSession(userInfo) {
  const token = await createSession(userInfo);
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Delete session cookie
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

