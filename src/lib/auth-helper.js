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
      console.log('Token expired, refreshing...');
      const refreshed = await refreshIdToken(session.refreshToken);
      
      if (refreshed && refreshed.idToken) {
        idToken = refreshed.idToken;
        
        // Update session with new token
        updatedSession = {
          ...session,
          idToken: refreshed.idToken,
        };
        
        // Save updated session
        await setSession(updatedSession);
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Token expired and refresh failed. Please sign in again.');
    }
  } else if (isTokenExpired(idToken)) {
    throw new Error('Token expired and no refresh token available. Please sign in again.');
  }

  // Get AWS credentials with the (possibly refreshed) token
  const credentials = await getAWSCredentials(idToken);

  return {
    credentials,
    session: updatedSession,
  };
}

