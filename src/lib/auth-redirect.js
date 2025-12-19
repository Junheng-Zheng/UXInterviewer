import { cookies } from 'next/headers';

const RETURN_URL_COOKIE = 'auth_return_url';

/**
 * Store the current URL to redirect back to after authentication
 * @param {string} url - The URL to return to after sign in
 */
export async function setReturnUrl(url) {
  const cookieStore = await cookies();
  cookieStore.set(RETURN_URL_COOKIE, url, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
}

/**
 * Get the stored return URL and clear it
 * @returns {string|null} - The URL to return to, or null if not set
 */
export async function getAndClearReturnUrl() {
  const cookieStore = await cookies();
  const returnUrl = cookieStore.get(RETURN_URL_COOKIE)?.value || null;
  
  if (returnUrl) {
    // Clear the cookie after reading it
    cookieStore.delete(RETURN_URL_COOKIE);
  }
  
  return returnUrl;
}



