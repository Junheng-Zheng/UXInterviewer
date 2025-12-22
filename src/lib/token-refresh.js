import { getOidcClient } from './oidc';

/**
 * Refresh the ID token using the refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<{idToken: string, accessToken: string, expiresIn: number}>}
 */
export async function refreshIdToken(refreshToken) {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    const oidcClient = await getOidcClient();
    
    // Use the refresh token to get new tokens
    const tokenSet = await oidcClient.refresh(refreshToken);
    
    return {
      idToken: tokenSet.id_token,
      accessToken: tokenSet.access_token,
      expiresIn: tokenSet.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh token. Please sign in again.');
  }
}



