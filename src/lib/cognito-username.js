import { decodeToken } from '@/lib/cognito';

/**
 * Resolve the Cognito Username to use for Admin APIs (AdminGetUser, AdminUpdateUserAttributes, etc.).
 * When sign-up uses a UUID as Username, the pool's Username is that UUID; the JWT sub can differ.
 * Cognito includes the pool's Username in the ID token as cognito:username.
 * @param {Object} session - Session object (may have idToken, sub, email)
 * @returns {string} Value to pass as Username to Cognito Admin APIs
 */
export function getCognitoUsername(session) {
  if (!session) return undefined;
  if (session.idToken) {
    try {
      const claims = decodeToken(session.idToken);
      const cognitoUsername = claims['cognito:username'];
      if (cognitoUsername && typeof cognitoUsername === 'string') {
        return cognitoUsername;
      }
    } catch {
      // Invalid or expired token; fall through to sub/email
    }
  }
  return session.sub ?? session.email;
}
