import { NextResponse } from 'next/server';
import { getSession, setSession } from '@/lib/session';
import { verifyUserAttribute } from '@/lib/cognito';
import { getAccessTokenWithRefresh } from '@/lib/auth-helper';
import { getCognitoUsername } from '@/lib/cognito-username';
import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '@/lib/cognito';

/**
 * Verify new email with the 6-digit code sent after an email change in settings.
 */
export async function POST(request) {
  try {
    const session = await getSession();

    if (!session || (!session.sub && !session.email)) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const { accessToken } = await getAccessTokenWithRefresh();

    try {
      await verifyUserAttribute(accessToken, 'email', code);
    } catch (err) {
      console.error('Verify email attribute error:', err);
      const message =
        err.name === 'CodeMismatchException'
          ? 'Invalid or expired verification code'
          : err.message || 'Verification failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Re-fetch profile from Cognito and update session email so it stays in sync
    const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
    const cognitoUsername = getCognitoUsername(session);
    if (USER_POOL_ID && cognitoUsername) {
      try {
        const getCommand = new AdminGetUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: cognitoUsername,
        });
        const user = await cognitoClient.send(getCommand);
        const emailAttr = user.UserAttributes?.find((a) => a.Name === 'email');
        const newEmail = emailAttr?.Value;
        if (newEmail) {
          await setSession({ ...session, email: newEmail });
        }
      } catch (e) {
        console.error('Error syncing session email after verify:', e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify email error:', error);
    if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to verify email' },
      { status: 500 }
    );
  }
}
