import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac, randomUUID } from 'crypto';

const REGION = process.env.COGNITO_REGION || 'us-east-1';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;

// Create Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
});

/**
 * Calculate SECRET_HASH for Cognito API calls
 * SECRET_HASH is HMAC-SHA256 of (username + client_id) using client_secret as key
 */
function calculateSecretHash(username) {
  if (!CLIENT_SECRET) {
    console.warn('COGNITO_CLIENT_SECRET is not set. SECRET_HASH will not be included.');
    return undefined; // No secret hash needed if client doesn't have a secret
  }
  
  if (!CLIENT_ID) {
    console.warn('COGNITO_CLIENT_ID is not set. Cannot calculate SECRET_HASH.');
    return undefined;
  }
  
  const hash = createHmac('SHA256', CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest('base64');
  
  return hash;
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email, password) {
  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID environment variable is not set');
  }

  try {
    const authParameters = {
      USERNAME: email,
      PASSWORD: password,
    };

    // Add SECRET_HASH if client has a secret
    const secretHash = calculateSecretHash(email);
    if (secretHash) {
      authParameters.SECRET_HASH = secretHash;
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: authParameters,
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      };
    }

    // Handle challenge responses (e.g., NEW_PASSWORD_REQUIRED)
    if (response.ChallengeName) {
      return {
        success: false,
        challengeName: response.ChallengeName,
        challengeParameters: response.ChallengeParameters,
        session: response.Session,
      };
    }

    throw new Error('Unexpected response from Cognito');
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign up a new user
 */
export async function signUp(email, password, attributes = {}) {
  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID environment variable is not set');
  }

  try {
    // Ensure email is in attributes
    const userAttributes = {
      email: email,
      ...attributes,
    };

    const attributeList = Object.entries(userAttributes).map(([Name, Value]) => ({
      Name,
      Value: String(Value),
    }));

    // When email is configured as an alias, we need to provide a unique Username
    // (not the email format). Generate a UUID for the username.
    // Cognito will use the email from attributes as the alias for login.
    const username = randomUUID();

    const signUpParams = {
      ClientId: CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: attributeList,
    };

    // Add SECRET_HASH if client has a secret
    // IMPORTANT: For SignUp, SECRET_HASH must use the Username (UUID), not the email
    const secretHash = calculateSecretHash(username);
    if (secretHash) {
      signUpParams.SecretHash = secretHash;
    }

    const command = new SignUpCommand(signUpParams);

    const response = await cognitoClient.send(command);

    return {
      success: true,
      userSub: response.UserSub,
      username: username, // Return the UUID username for use in confirmation
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Confirm sign up with verification code
 * @param {string} usernameOrEmail - The username (UUID) or email to use for confirmation
 * @param {string} confirmationCode - The verification code
 * @param {boolean} isEmailAlias - Whether to use email as alias (true) or username directly (false)
 */
export async function confirmSignUp(usernameOrEmail, confirmationCode, isEmailAlias = false) {
  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID environment variable is not set');
  }

  try {
    const confirmParams = {
      ClientId: CLIENT_ID,
      Username: usernameOrEmail, // Use the actual username (UUID) when email is alias
      ConfirmationCode: confirmationCode,
    };

    // Add SECRET_HASH if client has a secret
    // When email is alias, SECRET_HASH must use the actual username (UUID), not the email
    const secretHash = calculateSecretHash(usernameOrEmail);
    if (secretHash) {
      confirmParams.SecretHash = secretHash;
    }

    const command = new ConfirmSignUpCommand(confirmParams);

    await cognitoClient.send(command);

    return { success: true };
  } catch (error) {
    console.error('Confirm sign up error:', error);
    throw error;
  }
}

/**
 * Resend confirmation code
 */
export async function resendConfirmationCode(email) {
  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID environment variable is not set');
  }

  try {
    const resendParams = {
      ClientId: CLIENT_ID,
      Username: email,
    };

    // Add SECRET_HASH if client has a secret
    const secretHash = calculateSecretHash(email);
    if (secretHash) {
      resendParams.SecretHash = secretHash;
    }

    const command = new ResendConfirmationCodeCommand(resendParams);

    const response = await cognitoClient.send(command);

    return {
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };
  } catch (error) {
    console.error('Resend confirmation code error:', error);
    throw error;
  }
}

/**
 * Decode JWT token to get user info
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Use atob for browser or Buffer for Node.js
    let jsonPayload;
    if (typeof window !== 'undefined') {
      // Browser environment
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else {
      // Node.js environment
      const { Buffer } = require('buffer');
      jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString()
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode error:', error);
    throw new Error('Invalid token');
  }
}

