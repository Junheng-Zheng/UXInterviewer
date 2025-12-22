/**
 * Client-side utility to handle authentication errors and redirects
 */

/**
 * Check if an API response indicates authentication is required
 * If so, redirect to login page with return URL
 * @param {Response} response - The fetch response object
 * @param {string} currentPath - The current pathname to return to after login
 * @returns {Promise<boolean>} - Returns true if redirect was triggered, false otherwise
 */
export async function handleAuthError(response, currentPath = null) {
  if (response.status === 401) {
    try {
      const data = await response.json();
      
      if (data.requiresAuth || data.redirectTo) {
        // Store the current path in sessionStorage for redirect after login
        if (currentPath) {
          sessionStorage.setItem('auth_return_url', currentPath);
        } else if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_return_url', window.location.pathname + window.location.search);
        }
        
        // Redirect to login
        const loginUrl = data.redirectTo || '/api/auth/login';
        if (typeof window !== 'undefined') {
          window.location.href = loginUrl;
        }
        
        return true;
      }
    } catch (e) {
      // If response is not JSON, still check for 401
      if (typeof window !== 'undefined' && currentPath) {
        sessionStorage.setItem('auth_return_url', currentPath);
        window.location.href = '/api/auth/login';
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get the stored return URL from sessionStorage and clear it
 * @returns {string|null} - The URL to return to, or null if not set
 */
export function getAndClearReturnUrl() {
  if (typeof window === 'undefined') return null;
  
  const returnUrl = sessionStorage.getItem('auth_return_url');
  if (returnUrl) {
    sessionStorage.removeItem('auth_return_url');
    return returnUrl;
  }
  
  return null;
}



