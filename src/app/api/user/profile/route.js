import { NextResponse } from 'next/server';
import { getSession, setSession } from '@/lib/session';
import { AdminGetUserCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, getUserAttributeVerificationCode } from '@/lib/cognito';
import { getAccessTokenWithRefresh } from '@/lib/auth-helper';
import { getCognitoUsername } from '@/lib/cognito-username';

/**
 * Get current user profile from Cognito
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || (!session.email && !session.sub)) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
    
    if (!USER_POOL_ID) {
      return NextResponse.json({ error: 'User pool not configured' }, { status: 500 });
    }

    const cognitoUsername = getCognitoUsername(session);
    if (!cognitoUsername) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: cognitoUsername,
    });
    
    const user = await cognitoClient.send(command);
    
    // Extract user attributes
    const attributes = {};
    user.UserAttributes?.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });

    const identityProvider = user.Username?.startsWith('google_') ? 'Google' : null;
    
    return NextResponse.json({
      email: attributes.email || session.email,
      givenName: attributes.given_name || attributes.name?.split(' ')[0] || '',
      familyName: attributes.family_name || attributes.name?.split(' ').slice(1).join(' ') || '',
      name: attributes.name || '',
      identityProvider,
    });
  } catch (error) {
    if (error.name === 'UserNotFoundException') {
      return NextResponse.json({ error: 'Session invalid or user not found' }, { status: 401 });
    }
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

/**
 * Update current user profile in Cognito (name and/or email)
 */
export async function PATCH(request) {
  try {
    const session = await getSession();

    if (!session || (!session.sub && !session.email)) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const cognitoUsername = getCognitoUsername(session);
    if (!cognitoUsername) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
    if (!USER_POOL_ID) {
      return NextResponse.json({ error: 'User pool not configured' }, { status: 500 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
    const email = typeof body.email === 'string' ? body.email.trim() : undefined;

    if (body.firstName !== undefined && !firstName) {
      return NextResponse.json({ error: 'firstName must be a non-empty string' }, { status: 400 });
    }
    if (body.lastName !== undefined && !lastName) {
      return NextResponse.json({ error: 'lastName must be a non-empty string' }, { status: 400 });
    }
    if (body.email !== undefined && !email) {
      return NextResponse.json({ error: 'email must be a non-empty string' }, { status: 400 });
    }

    const userAttributes = [];

    // Fetch current user when we need existing name or to compare email
    let currentAttrs = {};
    let fetchedUser = null;
    if (firstName !== undefined || lastName !== undefined || email !== undefined) {
      const getCommand = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoUsername,
      });
      fetchedUser = await cognitoClient.send(getCommand);
      fetchedUser.UserAttributes?.forEach((attr) => {
        currentAttrs[attr.Name] = attr.Value;
      });
    }

    if (fetchedUser && fetchedUser.Username?.startsWith('Google_') && email !== undefined) {
      return NextResponse.json(
        { error: 'Email cannot be changed for accounts linked with Google.' },
        { status: 400 }
      );
    }

    const currentEmail = currentAttrs.email || session.email || '';
    const emailUnverified = email !== undefined && (currentAttrs.email_verified === 'false' || currentAttrs.email_verified === false);

    if (firstName !== undefined || lastName !== undefined) {
      const currentGiven = currentAttrs.given_name || currentAttrs.name?.split(' ')[0] || '';
      const currentFamily = currentAttrs.family_name || currentAttrs.name?.split(' ').slice(1).join(' ') || '';
      const newGiven = firstName !== undefined ? firstName : currentGiven;
      const newFamily = lastName !== undefined ? lastName : currentFamily;
      userAttributes.push({ Name: 'given_name', Value: newGiven });
      userAttributes.push({ Name: 'family_name', Value: newFamily });
      userAttributes.push({ Name: 'name', Value: [newGiven, newFamily].filter(Boolean).join(' ').trim() });
    }

    if (email !== undefined) {
      userAttributes.push({ Name: 'email', Value: email });
    }

    if (userAttributes.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const emailChanged = email !== undefined && (email || '') !== (currentEmail || '');

    const updateCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: cognitoUsername,
      UserAttributes: userAttributes,
    });
    await cognitoClient.send(updateCommand);

    if (email !== undefined) {
      await setSession({ ...session, email });
    }

    // Return updated profile so client can sync local data (use stable cognitoUsername, not email)
    const getCommand = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: cognitoUsername,
    });
    const updatedUser = await cognitoClient.send(getCommand);
    const attrs = {};
    updatedUser.UserAttributes?.forEach((attr) => {
      attrs[attr.Name] = attr.Value;
    });
    const profile = {
      givenName: attrs.given_name || attrs.name?.split(' ')[0] || '',
      familyName: attrs.family_name || attrs.name?.split(' ').slice(1).join(' ') || '',
      email: attrs.email || session.email,
    };

    let emailVerificationRequired = false;
    if (emailChanged) {
      try {
        const { accessToken } = await getAccessTokenWithRefresh();
        await getUserAttributeVerificationCode(accessToken, 'email');
        emailVerificationRequired = true;
      } catch (err) {
        console.error('Error sending email verification code:', err);
        return NextResponse.json(
          { error: err.message || 'Failed to send verification code. Please try again.' },
          { status: 500 }
        );
      }
    } else if (email !== undefined && !emailChanged && emailUnverified) {
      try {
        const { accessToken } = await getAccessTokenWithRefresh();
        await getUserAttributeVerificationCode(accessToken, 'email');
        emailVerificationRequired = true;
      } catch (err) {
        console.error('Error sending email verification code:', err);
        return NextResponse.json(
          { error: err.message || 'Failed to send verification code. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      ...(emailVerificationRequired && { emailVerificationRequired: true }),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
