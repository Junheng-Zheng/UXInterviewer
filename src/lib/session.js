import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const SESSION_COOKIE_NAME = 'session';
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

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
    console.error('Session verification failed:', error.message);
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

  const session = await verifySession(sessionToken);
  
  // Get refresh token from separate cookie and merge it into session
  if (session) {
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
    if (refreshToken) {
      session.refreshToken = refreshToken;
    }
  }
  
  return session;
}

/**
 * Set session cookie
 */
export async function setSession(userInfo) {
  try {
    const cookieStore = await cookies();
    
    // Extract refresh token to store separately
    const refreshToken = userInfo.refreshToken;
    const sessionData = { ...userInfo };
    delete sessionData.refreshToken; // Remove refresh token from session data
    
    // Create session token without refresh token
    const token = await createSession(sessionData);
    
    // Set main session cookie
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    // Store refresh token in separate cookie if present
    if (refreshToken) {
      cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days (refresh tokens last longer)
        path: '/',
      });
    }
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Delete session cookie
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}

