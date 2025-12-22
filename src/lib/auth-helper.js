import { getSession, setSession } from './session';
import { getAWSCredentials } from './identity-pool';
import { refreshIdToken } from './token-refresh';
import { isTokenExpired } from './token-utils';

/**
 * Get AWS credentials with automatic token refresh if needed
 * This helper function checks if the token is expired and refreshes it automatically
 * @returns {Promise<{credentials: Object, session: Object}>}
 */
export async function getAWSCredentialsWithRefresh() {
  const session = await getSession();

  if (!session || !session.idToken) {
    throw new Error('Not authenticated');
  }

  let idToken = session.idToken;
  let updatedSession = session;

  // Check if token needs refresh
  if (isTokenExpired(idToken) && session.refreshToken) {
    try {
      const refreshed = await refreshIdToken(session.refreshToken);
      
      if (refreshed && refreshed.idToken) {
        idToken = refreshed.idToken;
        
        // Update session with new token and refresh token (if new one provided)
        updatedSession = {
          ...session,
          idToken: refreshed.idToken,
          refreshToken: refreshed.refreshToken || session.refreshToken, // Keep refresh token updated
        };
        
        // Save updated session (refresh token will be stored in separate cookie)
        await setSession(updatedSession);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Create a custom error that includes redirect information
      const authError = new Error('Token expired and refresh failed. Please sign in again.');
      authError.code = 'TOKEN_EXPIRED';
      authError.requiresAuth = true;
      throw authError;
    }
  } else if (isTokenExpired(idToken)) {
    // Create a custom error that includes redirect information
    const authError = new Error('Token expired and no refresh token available. Please sign in again.');
    authError.code = 'TOKEN_EXPIRED';
    authError.requiresAuth = true;
    throw authError;
  }

  // Get AWS credentials with the (possibly refreshed) token
  const credentials = await getAWSCredentials(idToken);

  return {
    credentials,
    session: updatedSession,
  };
}

