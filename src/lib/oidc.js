import { Issuer, Client } from 'openid-client';

// AWS Cognito OIDC Configuration
// Replace these values with your actual Cognito User Pool details
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID; // e.g., 'us-east-2_XXXXXXXXX'
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN; // e.g., 'your-pool-name.auth.region.amazoncognito.com' (needed for logout)
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const REDIRECT_URI = process.env.COGNITO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
const REGION = process.env.COGNITO_REGION || 'us-east-1';

// Construct the issuer URL using User Pool ID (more reliable than domain-based discovery)
const ISSUER_URL = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

let issuer;
let client;

/**
 * Initialize the OIDC issuer and client
 */
export async function getOidcClient() {
  if (!USER_POOL_ID || !CLIENT_ID) {
    const missing = [];
    if (!USER_POOL_ID) missing.push('COGNITO_USER_POOL_ID');
    if (!CLIENT_ID) missing.push('COGNITO_CLIENT_ID');
    throw new Error(`Missing required Cognito configuration. Please set the following environment variables: ${missing.join(', ')}`);
  }

  if (!issuer) {
    try {
      console.log(`Discovering OIDC issuer at: ${ISSUER_URL}`);
      issuer = await Issuer.discover(ISSUER_URL);
      console.log('Issuer discovered successfully');
    } catch (error) {
      console.error('Failed to discover OIDC issuer:', error);
      throw new Error(`Failed to discover OIDC issuer at ${ISSUER_URL}. Please verify your COGNITO_USER_POOL_ID and COGNITO_REGION are correct. Error: ${error.message}`);
    }
  }

  if (!client) {
    try {
      client = new issuer.Client({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uris: [REDIRECT_URI],
        response_types: ['code'],
      });
      console.log('OIDC client created successfully');
    } catch (error) {
      console.error('Failed to create OIDC client:', error);
      throw new Error(`Failed to create OIDC client. Error: ${error.message}`);
    }
  }

  return client;
}

/**
 * Get the authorization URL for login
 */
export async function getAuthorizationUrl(state, nonce) {
  try {
    const oidcClient = await getOidcClient();
    
    const authUrl = oidcClient.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
    });
    
    console.log('Authorization URL generated successfully');
    return authUrl;
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    throw error;
  }
}

/**
 * Get the logout URL
 */
export function getLogoutUrl() {
  if (!COGNITO_DOMAIN) {
    throw new Error('Missing COGNITO_DOMAIN environment variable');
  }
  
  const logoutUrl = new URL(`https://${COGNITO_DOMAIN}/logout`);
  logoutUrl.searchParams.set('client_id', CLIENT_ID);
  logoutUrl.searchParams.set('logout_uri', process.env.COGNITO_LOGOUT_REDIRECT_URI || 'http://localhost:3000');
  
  return logoutUrl.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code, nonce, state) {
  const oidcClient = await getOidcClient();
  
  // Create params object with the authorization code and state
  const params = {
    code: code,
    state: state,
  };
  
  const tokenSet = await oidcClient.callback(REDIRECT_URI, params, { nonce });
  
  return tokenSet;
}

export { ISSUER_URL, REDIRECT_URI };

