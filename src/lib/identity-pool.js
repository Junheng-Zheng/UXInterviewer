import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';

const REGION = process.env.COGNITO_REGION || 'us-east-1';
const IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const identityClient = new CognitoIdentityClient({
  region: REGION,
});

/**
 * Get AWS credentials from Cognito Identity Pool using ID token
 * Note: Token expiration should be checked before calling this function
 * Use getAWSCredentialsWithRefresh() from auth-helper.js for automatic token refresh
 * @param {string} idToken - The ID token from Cognito User Pool
 * @returns {Promise<{accessKeyId: string, secretAccessKey: string, sessionToken: string, identityId: string}>}
 */
export async function getAWSCredentials(idToken) {
  if (!IDENTITY_POOL_ID) {
    throw new Error('COGNITO_IDENTITY_POOL_ID environment variable is not set');
  }

  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID environment variable is not set');
  }

  try {
    // Get Identity ID
    const getIdCommand = new GetIdCommand({
      IdentityPoolId: IDENTITY_POOL_ID,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken,
      },
    });

    const getIdResponse = await identityClient.send(getIdCommand);
    const identityId = getIdResponse.IdentityId;

    if (!identityId) {
      throw new Error('Failed to get identity ID');
    }

    // Get credentials for the identity
    const getCredentialsCommand = new GetCredentialsForIdentityCommand({
      IdentityId: identityId,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken,
      },
    });

    const credentialsResponse = await identityClient.send(getCredentialsCommand);
    const credentials = credentialsResponse.Credentials;

    if (!credentials) {
      throw new Error('Failed to get AWS credentials');
    }

    return {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretKey,
      sessionToken: credentials.SessionToken,
      expiration: credentials.Expiration,
      identityId: identityId,
    };
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    throw error;
  }
}

